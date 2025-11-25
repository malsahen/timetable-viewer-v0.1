// app/admin/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type VersionRow = {
  id: number;
  kind: "teacher" | "class" | null;
  label: string | null;
  status: "new" | "ingesting" | "ready" | "failed" | "mapped" | "archived";
  is_current: boolean | null;
  total_pages: number | null;
  created_at: string;
  source: "zip" | "multi" | "offline" | null;
};

function Chip({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warn" | "error" | "info";
  children: React.ReactNode;
}) {
  const map = {
    neutral: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-800",
    warn: "bg-amber-100 text-amber-800",
    error: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-800",
  } as const;
  return <span className={`chip ${map[tone]}`}>{children}</span>;
}

const toneByStatus = (s: VersionRow["status"]) =>
  s === "ready"
    ? "success"
    : s === "failed"
    ? "error"
    : s === "ingesting"
    ? "warn"
    : s === "mapped"
    ? "info"
    : "neutral";

/* ---------- Persist admin wizard state (client only) ---------- */
const KEY = "tv_admin_state_v1";
type PersistState = {
  kind: "teacher" | "class";
  label: string;
  useZip: boolean;
  createdVersionId: number | null;
};
function loadState(): PersistState | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PersistState) : null;
  } catch {
    return null;
  }
}
function saveState(s: PersistState) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export default function AdminPage() {
  // identity (header)
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // versions table state
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [kind, setKind] = useState<"teacher" | "class">("teacher");
  const [label, setLabel] = useState("");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [multiFiles, setMultiFiles] = useState<FileList | null>(null);
  const [creating, setCreating] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [createdVersionId, setCreatedVersionId] = useState<number | null>(null);
  const [useZip, setUseZip] = useState(true);

  // hydrate identity
  useEffect(() => {
    fetch("/api/auth/whoami", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        setRole(j?.profile?.role ?? null);
        setEmail(j?.user?.email ?? null);
      })
      .catch(() => {});
  }, []);

  // load persisted wizard state
  useEffect(() => {
    const s = loadState();
    if (s) {
      setKind(s.kind);
      setLabel(s.label);
      setUseZip(s.useZip);
      setCreatedVersionId(s.createdVersionId);
    }
  }, []);
  // persist on change
  useEffect(() => {
    saveState({ kind, label, useZip, createdVersionId });
  }, [kind, label, useZip, createdVersionId]);

  async function refresh() {
    const r = await fetch("/api/admin/versions/list", { cache: "no-store" }).catch(() => null);
    if (!r || !r.ok) return;
    const j = await r.json();
    setVersions(j.versions || []);
  }
  useEffect(() => {
    refresh();
  }, []);

  const latest = useMemo(() => versions.slice(0, 10), [versions]);

  async function createVersion() {
    try {
      setCreating(true);
      const r = await fetch("/api/admin/versions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, label, source: useZip ? "zip" : "multi" }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Failed to create release");
      setCreatedVersionId(j.versionId);
      setZipFile(null);
      setMultiFiles(null);
      await refresh();
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setCreating(false);
    }
  }

  async function ingest() {
    if (!createdVersionId) return alert("Create a release first.");
    try {
      setIngesting(true);
      const fd = new FormData();
      if (useZip) {
        if (!zipFile) return alert("Attach a ZIP of page PDFs.");
        fd.append("file", zipFile);
        const r = await fetch(`/api/admin/versions/${createdVersionId}/ingest-zip`, {
          method: "POST",
          body: fd,
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Ingest failed");
      } else {
        if (!multiFiles?.length) return alert("Attach multiple page PDFs.");
        Array.from(multiFiles).forEach((f) => fd.append("file", f));
        const r = await fetch(`/api/admin/versions/${createdVersionId}/ingest-multi`, {
          method: "POST",
          body: fd,
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "Ingest failed");
      }
      await refresh();
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setIngesting(false);
    }
  }

  async function setCurrent(id: number) {
    const r = await fetch(`/api/admin/versions/${id}/set-current`, { method: "POST" });
    const j = await r.json();
    if (!r.ok) return alert(j.error || "Failed");
    await refresh();
  }

  return (
    <div className="stack-lg">
      {/* ===== Header (no publish/mapping, no preview) ===== */}
      <div className="card">
        <div className="card-body flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="h1">Admin Dashboard</div>
            <div className="muted mt-1">
              {email ? (
                <>
                  Signed in as <strong>{email}</strong>
                  {role ? (
                    <>
                      {" "}· role <strong>{role}</strong>
                    </>
                  ) : null}
                </>
              ) : (
                "Loading…"
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/admin/upload-data" className="btn btn-outline">
              Upload data (CSV)
            </Link>
            <button onClick={refresh} className="btn btn-quiet">
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Working banner */}
      {createdVersionId ? (
        <div className="alert success">
          Working on release <strong>#{createdVersionId}</strong> · {kind.toUpperCase()} · source:{" "}
          {useZip ? "ZIP" : "Multiple PDFs"}
        </div>
      ) : null}

      {/* ===== Create release & upload pages ===== */}
      <section className="card">
        <div className="card-header">
          <h2 className="h2">Create release & upload pages</h2>
        </div>

        <div className="card-body grid md:grid-cols-2 gap-6">
          <div className="stack">
            <div className="inline-flex gap-6">
              <label className="radio">
                <input
                  type="radio"
                  checked={kind === "teacher"}
                  onChange={() => setKind("teacher")}
                />
                Teacher release
              </label>
              <label className="radio">
                <input type="radio" checked={kind === "class"} onChange={() => setKind("class")} />
                Class release
              </label>
            </div>

            <input
              className="input"
              placeholder="Release label (e.g. Term 1)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />

            <label className="checkbox">
              <input
                type="checkbox"
                checked={useZip}
                onChange={(e) => setUseZip(e.target.checked)}
              />
              Upload as ZIP (uncheck for multiple PDFs)
            </label>

            <div className="inline-flex gap-3 flex-wrap">
              <button onClick={createVersion} disabled={creating || !label} className="btn btn-primary">
                {creating ? "Creating…" : "Create release"}
              </button>
            </div>
          </div>

          <div className="stack">
            {useZip ? (
              <div className="stack-xs">
                <label className="label">ZIP of page PDFs</label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                  className="file"
                />
              </div>
            ) : (
              <div className="stack-xs">
                <label className="label">Multiple page PDFs</label>
                <input
                  type="file"
                  multiple
                  accept="application/pdf"
                  onChange={(e) => setMultiFiles(e.target.files)}
                  className="file"
                />
              </div>
            )}

            <button
              onClick={ingest}
              disabled={!createdVersionId || ingesting}
              className="btn btn-dark"
            >
              {ingesting ? "Ingesting…" : "Ingest pages"}
            </button>
            <p className="caption">
              {createdVersionId
                ? `Working on release #${createdVersionId}`
                : "Create a release to enable ingest."}
            </p>
          </div>
        </div>
      </section>

      {/* ===== Recent releases ===== */}
      <section className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="h2">Recent releases</h2>
          <button onClick={refresh} className="btn btn-quiet">
            Refresh
          </button>
        </div>
        <div className="card-body">
          {latest.length === 0 ? (
            <div className="muted">No releases yet.</div>
          ) : (
            <ul className="stack">
              {latest.map((v) => (
                <li key={v.id} className="row">
                  <div className="row-main">
                    <div className="row-title">
                      <span className="kbd">#{v.id}</span>
                      <span>· {(v.kind ?? "UNKNOWN").toString().toUpperCase()}</span>
                      <span>· “{v.label ?? "-"}”</span>
                      <Chip tone={toneByStatus(v.status)}>{v.status}</Chip>
                      {v.is_current ? <Chip tone="success">current</Chip> : null}
                    </div>
                    <div className="row-sub">
                      pages: {v.total_pages ?? 0} · source: {v.source ?? "-"} ·{" "}
                      <time title={new Date(v.created_at).toLocaleString()}>
                        {new Intl.DateTimeFormat(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(v.created_at))}
                      </time>
                    </div>
                  </div>
                  <div className="row-actions">
                    {!v.is_current && v.status === "ready" ? (
                      <button onClick={() => setCurrent(v.id)} className="btn btn-outline">
                        Set as current
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
