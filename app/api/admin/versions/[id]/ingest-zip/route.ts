import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { supabaseServer } from "@/lib/supabaseServer";

// Route segment config for large file uploads
export const maxDuration = 60; // 60 seconds timeout
export const dynamic = 'force-dynamic';

// Expect: a ZIP containing page PDFs named in natural order (e.g. p-001.pdf ...)
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;               // ← IMPORTANT
    const versionId = Number(id);
    if (!versionId) {
      return NextResponse.json({ error: "invalid version id" }, { status: 400 });
    }

    const supabase = await supabaseServer();

    const form = await req.formData();
    const zipFile = form.get("file") as File | null;
    if (!zipFile) {
      return NextResponse.json({ error: "No ZIP file provided" }, { status: 400 });
    }

    // Read ZIP into memory
    const zipBytes = new Uint8Array(await zipFile.arrayBuffer());

    // Defer unzip to DB-side or a small in-process unzipper.
    // Here: in-process with JSZip to keep it simple.
    const { default: JSZip } = await import("jszip");
    const zip = await JSZip.loadAsync(zipBytes);

    // Get version info (kind, etc.) for path prefixing
    const { data: ver, error: verr } = await supabase
      .from("versions")
      .select("id, kind, label")
      .eq("id", versionId)
      .maybeSingle();
    if (verr) throw verr;
    if (!ver) return NextResponse.json({ error: "Version not found" }, { status: 404 });
    if (!ver.kind) return NextResponse.json({ error: "Version.kind is null" }, { status: 400 });

    // Sort entries by filename so page order is deterministic
    const entries = Object.values(zip.files)
      .filter((f) => !f.dir && f.name.toLowerCase().endsWith(".pdf"))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    if (!entries.length) {
      return NextResponse.json({ error: "ZIP has no PDFs" }, { status: 400 });
    }

    const storagePrefix = `versions/${versionId}/${ver.kind}`;
    let pageNo = 0;

    for (const f of entries) {
      pageNo += 1;
      const filePath = `${storagePrefix}/p-${String(pageNo).padStart(3, "0")}.pdf`;

      const bytes = new Uint8Array(await f.async("uint8array"));
      const ab = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(ab).set(bytes);

      const { error: upErr } = await supabase.storage
        .from("timetable")
        .upload(filePath, ab, { contentType: "application/pdf", upsert: true });
      if (upErr) throw upErr;

      // Insert page_mappings row with minimal info; mapping/owners can be published later
      const { error: pmErr } = await supabase.from("page_mappings").insert({
        version_id: versionId,
        kind: ver.kind,
        page_no: pageNo,
        storage_path: filePath,
        owner_slug: null,
        owner_id: null,
        match_score: 0,
        match_hits: [],
      });
      if (pmErr) throw pmErr;
    }

    // Update version page count + status
    const { error: vErr } = await supabase
      .from("versions")
      .update({ total_pages: pageNo, status: "ready", source: "zip" })
      .eq("id", versionId);
    if (vErr) throw vErr;

    return NextResponse.json({ ok: true, versionId, total_pages: pageNo });
  } catch (e: any) {
    console.error("ingest-zip error:", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
