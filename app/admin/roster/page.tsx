"use client";
import { useState } from "react";

export default function RosterPage() {
  const [studentsFile, setStudentsFile] = useState<File | null>(null);
  const [teachersFile, setTeachersFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function importCsv() {
    setMsg(null); setErr(null); setLoading(true);
    try {
      if (!studentsFile && !teachersFile) { setErr("Attach at least one CSV."); setLoading(false); return; }
      const fd = new FormData();
      if (studentsFile) fd.append("students", studentsFile);
      if (teachersFile) fd.append("teachers", teachersFile);
      const r = await fetch("/api/admin/roster/import", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Import failed");
      setMsg(`Imported: ${j.summary}`);
    } catch (e:any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack-lg">
      <div className="text-center">
        <h1 className="h1">Roster upload (CSV)</h1>
        <p className="muted mt-2">Students: full_name,email,class_slug · Teachers: full_name,email,slug,ft_class_slug,ct_class_slug</p>
      </div>

      <div className="card">
        <div className="card-body grid md:grid-cols-2 gap-6">
          <div className="stack">
            <label className="label">Students.csv</label>
            <input type="file" accept=".csv,text/csv" onChange={(e)=>setStudentsFile(e.target.files?.[0]||null)} className="file" />
          </div>
          <div className="stack">
            <label className="label">Teachers.csv</label>
            <input type="file" accept=".csv,text/csv" onChange={(e)=>setTeachersFile(e.target.files?.[0]||null)} className="file" />
          </div>
          <div className="md:col-span-2">
            <button onClick={importCsv} disabled={loading} className="btn btn-primary">
              {loading ? "Importing…" : "Import CSVs"}
            </button>
            {msg && <div className="alert success mt-4">{msg}</div>}
            {err && <div className="alert error mt-4">{err}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
