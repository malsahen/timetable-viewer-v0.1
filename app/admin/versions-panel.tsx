// app/admin/versions-panel.tsx
"use client";

import { useEffect, useState } from "react";

type VersionRow = {
  id: number;
  label: string | null;
  kind: "class" | "teacher" | null;
  is_current: boolean | null;
  total_pages: number | null;
  status: string | null;
};

export default function VersionsPanel() {
  const [rows, setRows] = useState<VersionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true); setErr(null);
    try {
      // simple in-app API to list versions (server RLS already requires admin)
      const r = await fetch("/api/admin/versions/list", { cache: "no-store" });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setRows(j.versions ?? []);
    } catch (e:any) {
      setErr(e?.message || "Failed to load versions");
    } finally { setLoading(false); }
  }

  async function setCurrent(id: number) {
    setLoading(true); setErr(null);
    try {
      const r = await fetch(`/api/admin/versions/set-current/${id}`, { method: "POST" });
      if (!r.ok) throw new Error(await r.text());
      await load();
    } catch (e:any) {
      setErr(e?.message || "Failed to set current");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  if (loading && rows.length === 0) return <div className="muted">Loading…</div>;
  if (err) return <div className="alert error">{err}</div>;
  if (!rows.length) return <div className="muted">No versions yet.</div>;

  return (
    <div className="stack">
      {rows.map(v => (
        <div key={`${v.kind}-${v.id}`} className="row">
          <div className="row-main">
            <div className="row-title">
              <span className="chip" style={{background:"#eef2ff"}}>{v.kind ?? "?"}</span>
              <span>{v.label ?? `#${v.id}`}</span>
              {v.is_current ? <span className="chip" style={{background:"#dcfce7"}}>current</span> : null}
            </div>
            <div className="row-sub">
              {v.total_pages ?? 0} pages · status {v.status ?? "new"} · id {v.id}
            </div>
          </div>
          {!v.is_current && (
            <div className="row-actions">
              <button className="btn btn-outline" disabled={loading} onClick={() => setCurrent(v.id)}>
                Make current
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
