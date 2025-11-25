// GET /api/admin/versions/list
import { NextResponse } from "next/server";
import "server-only";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase
      .from("versions")
      .select("id, kind, label, status, is_current, total_pages, created_at, source")
      .order("id", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ versions: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
