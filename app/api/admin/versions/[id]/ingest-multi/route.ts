import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;                // ← IMPORTANT
    const versionId = Number(id);
    if (!versionId) {
      return NextResponse.json({ error: "invalid version id" }, { status: 400 });
    }

    const supabase = await supabaseServer();

    const form = await req.formData();
    const files = form.getAll("file") as File[];
    if (!files || !files.length) {
      return NextResponse.json({ error: "No PDFs provided" }, { status: 400 });
    }

    const { data: ver, error: verr } = await supabase
      .from("versions")
      .select("id, kind, label")
      .eq("id", versionId)
      .maybeSingle();
    if (verr) throw verr;
    if (!ver) return NextResponse.json({ error: "Version not found" }, { status: 404 });
    if (!ver.kind) return NextResponse.json({ error: "Version.kind is null" }, { status: 400 });

    // Natural sort by filename (so you can drag-drop p-001.pdf..p-034.pdf etc.)
    const sorted = files.sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", undefined, { numeric: true })
    );

    const storagePrefix = `versions/${versionId}/${ver.kind}`;
    let pageNo = 0;

    for (const f of sorted) {
      pageNo += 1;
      const filePath = `${storagePrefix}/p-${String(pageNo).padStart(3, "0")}.pdf`;

      const bytes = new Uint8Array(await f.arrayBuffer());
      const ab = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(ab).set(bytes);

      const { error: upErr } = await supabase.storage
        .from("timetable")
        .upload(filePath, ab, { contentType: "application/pdf", upsert: true });
      if (upErr) throw upErr;

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

    const { error: vErr } = await supabase
      .from("versions")
      .update({ total_pages: pageNo, status: "ready", source: "multi" })
      .eq("id", versionId);
    if (vErr) throw vErr;

    return NextResponse.json({ ok: true, versionId, total_pages: pageNo });
  } catch (e: any) {
    console.error("ingest-multi error:", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
