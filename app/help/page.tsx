// app/help/page.tsx
"use client";

import { useState } from "react";

export default function HelpPage() {
  const [name, setName] = useState("");
  const [klass, setKlass] = useState(""); // year/class
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok?: boolean; message?: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("klass", klass.trim());
      fd.append("description", desc.trim());
      if (file) fd.append("file", file);

      const r = await fetch("/api/help/submit", { method: "POST", body: fd });
      const j = await r.json();

      if (j.mailtoUrl) {
        // fallback: open local mail client prefilled
        window.location.href = j.mailtoUrl as string;
      }

      if (!r.ok) throw new Error(j.error || "Failed to submit");

      setResult({ ok: true, message: "Submitted. ICT has been notified." });
      setName("");
      setKlass("");
      setDesc("");
      setFile(null);
      (document.getElementById("help-file") as HTMLInputElement | null)?.value && ((document.getElementById("help-file") as HTMLInputElement).value = "");
    } catch (err: any) {
      setResult({ ok: false, message: err?.message || "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="h1 mb-2 text-center">Help & Support</h1>
        <p className="muted text-center mb-8">
          Fill in the form below. You can attach a screenshot (optional). A copy will be sent to ICT.
        </p>

        <form onSubmit={onSubmit} className="card">
          <div className="card-body grid gap-6">
            <div>
              <label className="label">Your full name</label>
              <input
                className="input w-full"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nur Aisyah binti Ahmad"
              />
            </div>

            <div>
              <label className="label">Year / Class</label>
              <input
                className="input w-full"
                required
                value={klass}
                onChange={(e) => setKlass(e.target.value)}
                placeholder="e.g. 10C or Year-10C"
              />
            </div>

            <div>
              <label className="label">Describe the problem</label>
              <textarea
                className="textarea w-full"
                required
                rows={6}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="What happened? Any error messages? Steps to reproduce?"
              />
            </div>

            <div>
              <label className="label">Screenshot / file (optional)</label>
              <input
                id="help-file"
                type="file"
                className="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <p className="caption mt-2">Max ~10 MB recommended.</p>
            </div>

            <div className="flex items-center justify-between gap-4">
              <button className="btn btn-primary" disabled={submitting}>
                {submitting ? "Sending…" : "Submit request"}
              </button>
              {result ? (
                <span className={result.ok ? "text-green-700" : "text-red-600"}>
                  {result.message}
                </span>
              ) : null}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
