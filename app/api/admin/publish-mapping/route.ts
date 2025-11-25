// app/api/admin/publish-mapping/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
const BUCKET = "timetable"; // ← keep this exact and consistent everywhere

type MappingInput = {
  index: number;               // page index (1-based)
  scope: string;               // owner_slug, e.g. "year-9a"
  score?: number;              // optional match score
  hits?: string[];             // optional match hits
};

export async function POST(req: Request) {
  const sb = supabaseAdmin(); // service role (server-only)
  const { version_id, kind, mappings, make_current } = await req.json();

  if (!version_id || !["classes", "teachers"].includes(kind) || !Array.isArray(mappings)) {
    return NextResponse.json({ error: "version_id, kind in {'classes','teachers'}, mappings[]" }, { status: 400 });
  }

  // validate version
  const { data: ver, error: verr } = await sb
    .from("versions")
    .select("id, kind")
    .eq("id", version_id)
    .maybeSingle();
  if (verr) return NextResponse.json({ error: verr.message }, { status: 500 });
  if (!ver) return NextResponse.json({ error: "Version not found" }, { status: 404 });

  const file_type = kind === "classes" ? "class" : "teacher";
  const created: string[] = [];

  for (const m of mappings as MappingInput[]) {
    if (!m?.index || !m?.scope) {
      return NextResponse.json({ error: "each mapping needs { index, scope }" }, { status: 400 });
    }

    const src = `${version_id}/_pages/${kind}/page-${m.index}.pdf`;
    const dst = `${file_type}/${m.scope}/v${version_id}.pdf`;

    // 1) Read split page from staging location
    const dl = await sb.storage.from(BUCKET).download(src);
    if (dl.error || !dl.data) {
      return NextResponse.json({ error: `Cannot read staged page: ${src}` }, { status: 500 });
    }

    const buf = Buffer.from(await dl.data.arrayBuffer());

    // 2) Publish to the final path
    const up = await sb.storage.from(BUCKET).upload(dst, buf, {
      upsert: true,
      contentType: "application/pdf",
    });
    if (up.error) {
      return NextResponse.json({ error: `Storage publish failed for ${dst}: ${up.error.message}` }, { status: 500 });
    }

    // 3) Record in files (for ops history)
    const insFiles = await sb.from("files").insert({
      version_id,
      file_type,
      file_scope: m.scope,  // equals classes.slug or teachers.slug
      storage_path: dst,
      published: true,
    });
    if (insFiles.error) {
      return NextResponse.json({ error: `files insert failed: ${insFiles.error.message}` }, { status: 500 });
    }

    // 4) Upsert page_mappings so the student page can find it
    //    We align (version_id, kind, page_no) with this scope and path
    const upPm = await sb
      .from("page_mappings")
      .upsert(
        {
          version_id,
          kind: ver.kind,        // "class" or "teacher" — note: singular, matches your MyTimetable query
          page_no: m.index,
          storage_path: dst,
          owner_slug: m.scope,
          owner_id: null,
          match_score: Number.isFinite(m.score) ? m.score : 0,
          match_hits: Array.isArray(m.hits) ? m.hits : [],
        },
        { onConflict: "version_id,kind,page_no" }
      )
      .select("version_id")
      .maybeSingle();
    if (upPm.error) {
      return NextResponse.json({ error: `page_mappings upsert failed: ${upPm.error.message}` }, { status: 500 });
    }

    created.push(dst);
  }

  if (make_current) {
    // Flip current only within this kind
    const unset = await sb.from("versions").update({ is_current: false }).eq("kind", ver.kind);
    if (unset.error) return NextResponse.json({ error: unset.error.message }, { status: 500 });

    const set = await sb.from("versions").update({ is_current: true }).eq("id", version_id);
    if (set.error) return NextResponse.json({ error: set.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, created });
}
