import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

const BUCKET = "timetables";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });

  const { data: ver } = await supabase.from("versions").select("*").eq("is_current", true).maybeSingle();
  if (!ver) return NextResponse.json({ files: [] });

  // RLS enforces who can see which rows
  const { data: rows, error } = await supabase
    .from("files")
    .select("id, file_type, file_scope, storage_path")
    .eq("version_id", ver.id)
    .eq("published", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const withUrls = await Promise.all((rows ?? []).map(async (r:any) => {
    const signed = await supabase.storage.from(BUCKET).createSignedUrl(r.storage_path, 3600);
    return { ...r, url: signed.data?.signedUrl ?? null };
  }));

  return NextResponse.json({ version: ver, files: withUrls });
}
