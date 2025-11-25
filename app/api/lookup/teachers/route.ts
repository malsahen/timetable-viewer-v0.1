/*import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const sb = await supabaseServer();
  const { data } = await sb.from("teachers").select("slug").order("slug");
  return NextResponse.json({ items: (data ?? []).map((r:any)=>r.slug) });
}
*/

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
export const runtime = "nodejs";
export async function GET() {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from("teachers").select("slug").order("slug");
  if (error) return NextResponse.json({ items: [] });
  return NextResponse.json({ items: (data ?? []).map((r:any)=>r.slug) });
}
