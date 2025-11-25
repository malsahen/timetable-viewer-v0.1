import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;                // ← IMPORTANT
    const versionId = Number(id);
    if (!versionId) {
      return NextResponse.json({ error: "invalid version id" }, { status: 400 });
    }

    const supabase = await supabaseServer();

    // Fetch target version to know its kind
    const { data: ver, error: vErr } = await supabase
      .from("versions")
      .select("id, kind")
      .eq("id", versionId)
      .maybeSingle();
    if (vErr) throw vErr;
    if (!ver) return NextResponse.json({ error: "Version not found" }, { status: 404 });
    if (!ver.kind) return NextResponse.json({ error: "Cannot set current for null kind" }, { status: 400 });

    // Unset current for this kind
    const { error: u1 } = await supabase
      .from("versions")
      .update({ is_current: false })
      .eq("kind", ver.kind)
      .eq("is_current", true);
    if (u1) throw u1;

    // Set current
    const { error: u2 } = await supabase
      .from("versions")
      .update({ is_current: true })
      .eq("id", versionId);
    if (u2) throw u2;

    return NextResponse.json({ ok: true, id: versionId });
  } catch (e: any) {
    console.error("set-current error:", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
