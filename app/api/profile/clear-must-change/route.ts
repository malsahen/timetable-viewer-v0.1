// app/api/profile/clear-must-change/route.ts
import "server-only";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  const sb = await supabaseServer();
  const admin = supabaseAdmin();

  const { data, error: authError } = await sb.auth.getUser();
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  const user = data?.user;
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { error } = await admin
    .from("profiles")
    .update({ must_change_password: false })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
