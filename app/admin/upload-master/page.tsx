// app/admin/page.tsx
'use client';

import { useState } from 'react';

export default function UploadMasterPage() {
  const [kind, setKind] = useState<'class' | 'teacher'>('teacher');
  const [label, setLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOut(null);
    if (!file) {
      setErr('Please choose a PDF.');
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('kind', kind);
      fd.append('label', label);

      const r = await fetch('/api/admin/upload-master', { method: 'POST', body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Upload failed');
      setOut(j);
    } catch (e: any) {
      setErr(e?.message || 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Upload Master PDFs</h1>
      <p className="text-sm text-gray-600 mb-6">
        Upload the latest master PDF. We’ll split per page, upload to Storage, and auto-map pages to teachers/classes.
      </p>

      <form onSubmit={onSubmit} className="grid gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Kind</label>
          <div className="flex gap-4">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="kind"
                checked={kind === 'class'}
                onChange={() => setKind('class')}
              />
              Class
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="kind"
                checked={kind === 'teacher'}
                onChange={() => setKind('teacher')}
              />
              Teacher
            </label>
          </div>
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">Version label (optional)</label>
          <input
            className="border rounded-md px-3 py-2"
            placeholder="e.g. Term 1 – Week 6"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm font-medium">PDF File</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-60"
          >
            {busy ? 'Processing…' : 'Upload & Process'}
          </button>
          {err && <span className="text-red-600 text-sm">{err}</span>}
        </div>
      </form>

      {out && (
        <div className="mt-6 border rounded-lg p-4">
          <div className="font-medium">Result</div>
          <pre className="text-xs overflow-x-auto mt-2">{JSON.stringify(out, null, 2)}</pre>
        </div>
      )}
    </main>
  );
}
