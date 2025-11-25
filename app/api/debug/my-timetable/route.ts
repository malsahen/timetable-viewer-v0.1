// app/api/debug/my-timetable/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const sb = await supabaseServer();
  const admin = supabaseAdmin();

  const out: any = {};

  const { data: userData } = await sb.auth.getUser();
  const user = userData?.user ?? null;
  out.user = { id: user?.id ?? null, email: user?.email ?? null };

  if (!user) return NextResponse.json({ error: "no session", out });

  const { data: student, error: studentErr } = await admin
    .from("students")
    .select("id, class_slug, email, user_id")
    .or(`user_id.eq.${user.id},email.ilike.${(user.email || "").toLowerCase()}`)
    .limit(1)
    .maybeSingle();
  out.student = { row: student ?? null, error: studentErr ?? null };

  if (!student?.class_slug) return NextResponse.json(out);

  const { data: klass, error: klassErr } = await admin
    .from("classes")
    .select("id, slug, name")
    .eq("slug", student.class_slug)
    .maybeSingle();
  out.class = { row: klass ?? null, error: klassErr ?? null };

  const { data: currentVersion, error: verErr } = await admin
    .from("versions")
    .select("id, label, total_pages, kind, is_current")
    .eq("kind", "class")
    .eq("is_current", true)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  out.currentVersion = { row: currentVersion ?? null, error: verErr ?? null };

  if (!currentVersion?.id || !klass?.slug) return NextResponse.json(out);

  const { data: mapping, error: mapErr } = await admin
    .from("page_mappings")
    .select("storage_path, page_no, match_score, owner_slug, version_id, kind")
    .eq("version_id", currentVersion.id)
    .eq("kind", "class")
    .eq("owner_slug", klass.slug)
    .maybeSingle();
  out.mapping = { row: mapping ?? null, error: mapErr ?? null };

  if (!mapping?.storage_path) {
    const { data: f, error: fErr } = await admin
      .from("files")
      .select("storage_path, file_type, file_scope, version_id")
      .eq("version_id", currentVersion.id)
      .eq("file_type", "class")
      .eq("file_scope", klass.slug)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    out.filesFallback = { row: f ?? null, error: fErr ?? null };
  }

  return NextResponse.json(out);
}
