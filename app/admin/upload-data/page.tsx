// app/admin/upload-data/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

type Kind = "teachers" | "ftct" | "students";

export default function UploadDataPage() {
  const [teachersFile, setTeachersFile] = useState<File | null>(null);
  const [ftctFile, setFtctFile] = useState<File | null>(null);
  const [studentsFile, setStudentsFile] = useState<File | null>(null);

  const [busy, setBusy] = useState<Kind | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [lastJson, setLastJson] = useState<any | null>(null);

  async function send(kind: Kind, f: File | null) {
    setMsg(null);
    setErr(null);
    setLastJson(null);
    if (!f) {
      setErr("Please choose a CSV file first.");
      return;
    }
    setBusy(kind);
    try {
      const fd = new FormData();
      fd.append("kind", kind);
      fd.append("file", f);
      const r = await fetch("/api/admin/upload-data", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Upload failed");
      setLastJson(j);
      setMsg(
        `${kind}: upserted=${j.upserted ?? 0} · skipped=${j.skipped ?? 0} · errors=${j.errors ?? 0}`
      );
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  function resetStatus() {
    setMsg(null);
    setErr(null);
    setLastJson(null);
  }

  return (
    <div className="stack-lg">
      {/* Top card header with back button */}
      <div className="card">
        <div className="card-body flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="h1">Upload data (CSV)</div>
            <div className="muted mt-1">Teachers · FT/CT mapping · Students</div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/admin" className="btn btn-outline">← Back to Admin</Link>
            <Link href="/help" className="btn btn-quiet">Help</Link>
          </div>
        </div>
      </div>

      {/* Hints */}
      <section className="card">
        <div className="card-body">
          <ul className="list-disc pl-6 text-sm text-muted space-y-1">
            <li><b>teachers.csv</b> headers: <code>email</code>, <code>full_name</code> (others tolerated).</li>
            <li><b>ftct.csv</b> headers (required): <code>class</code>, <code>ft_email</code>, <code>ct_email</code>. Optional: <code>ft_name</code>, <code>ct_name</code>.</li>
            <li><b>students.csv</b> headers: <code>email</code>/<code>student_email</code>, <code>full_name</code>/<code>student_name</code>, <code>class</code>/<code>class_slug</code>. If class missing, it infers from filename.</li>
          </ul>
        </div>
      </section>

      {/* Teachers */}
      <section className="card">
        <div className="card-header"><h2 className="h2">Teachers (Emails & Names)</h2></div>
        <div className="card-body flex flex-col md:flex-row gap-4 md:items-end">
          <div className="grow">
            <label className="label">teachers.csv</label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => { resetStatus(); setTeachersFile(e.target.files?.[0] ?? null); }}
              className="file"
            />
            <p className="caption mt-1">Creates/updates teachers & profiles (role=teacher).</p>
          </div>
          <button
            onClick={() => send("teachers", teachersFile)}
            disabled={busy !== null}
            className="btn btn-primary"
          >
            {busy === "teachers" ? "Uploading…" : "Upload teachers.csv"}
          </button>
        </div>
      </section>

      {/* FT/CT */}
      <section className="card">
        <div className="card-header"><h2 className="h2">Form & Co-Tutor mapping</h2></div>
        <div className="card-body flex flex-col md:flex-row gap-4 md:items-end">
          <div className="grow">
            <label className="label">ftct.csv</label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => { resetStatus(); setFtctFile(e.target.files?.[0] ?? null); }}
              className="file"
            />
            <p className="caption mt-1">Sets <code>ft_class_slug</code> and <code>ct_class_slug</code> for teachers. Auto-creates missing classes.</p>
          </div>
          <button
            onClick={() => send("ftct", ftctFile)}
            disabled={busy !== null}
            className="btn btn-primary"
          >
            {busy === "ftct" ? "Uploading…" : "Upload ftct.csv"}
          </button>
        </div>
      </section>

      {/* Students */}
      <section className="card">
        <div className="card-header"><h2 className="h2">Students for a class</h2></div>
        <div className="card-body flex flex-col md:flex-row gap-4 md:items-end">
          <div className="grow">
            <label className="label">students.csv</label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => { resetStatus(); setStudentsFile(e.target.files?.[0] ?? null); }}
              className="file"
            />
            <p className="caption mt-1">
              Upserts <code>students</code>, auto-creates <code>classes</code>, ensures <code>profiles</code> (role=student).
            </p>
          </div>
          <button
            onClick={() => send("students", studentsFile)}
            disabled={busy !== null}
            className="btn btn-primary"
          >
            {busy === "students" ? "Uploading…" : "Upload students.csv"}
          </button>
        </div>
      </section>

      {/* Status */}
      {(msg || err) && (
        <div className={`alert ${err ? "error" : "success"}`}>
          {err ?? msg}
        </div>
      )}

      {/* Debug JSON (collapsible feel — simple) */}
      {lastJson && (
        <section className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="h3">Import result (details)</h3>
            <button className="btn btn-quiet" onClick={resetStatus}>Clear</button>
          </div>
          <div className="card-body">
            <pre className="text-xs overflow-x-auto">{JSON.stringify(lastJson, null, 2)}</pre>
          </div>
        </section>
      )}

      {/* Footer actions */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/admin" className="btn btn-outline">← Back to Admin</Link>
        <button className="btn btn-quiet" onClick={resetStatus}>Reset messages</button>
      </div>
    </div>
  );
}
