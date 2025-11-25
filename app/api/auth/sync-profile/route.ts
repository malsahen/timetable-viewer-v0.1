import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  const sb = await supabaseServer(); // session-bound (anon) — for getUser()
  const admin = supabaseAdmin();     // service-role — for DB reads/writes

  // 1) who is logged in
  const { data: userData } = await sb.auth.getUser();
  const user = userData?.user;
  if (!user) return NextResponse.json({ error: "No session" }, { status: 401 });

  const email = (user.email || "").toLowerCase();
  const uid = user.id;

  // 2) ensure profile exists (link-by-email first, else create as student)
  const { data: profByUid } = await admin
    .from("profiles").select("*").eq("user_id", uid).maybeSingle();

  if (!profByUid) {
    const { data: byEmail } = await admin
      .from("profiles").select("*").ilike("email", email).maybeSingle();

    if (byEmail) {
      await admin.from("profiles").update({ user_id: uid }).eq("email", byEmail.email);
    } else {
      await admin.from("profiles").insert({ user_id: uid, email, role: "student" });
    }
  }

  // 3) teacher match → link user_id if missing and ALWAYS set role=teacher (unless admin)
  const { data: t } = await admin
    .from("teachers").select("id, email, user_id").ilike("email", email).maybeSingle();

  if (t && !t.user_id) {
    await admin.from("teachers").update({ user_id: uid }).eq("id", t.id);
  }
  if (t) {
    await admin.rpc("set_profile_role_if_not_admin", { p_user_id: uid, p_role: "teacher" });
  }

  // 4) student match → link user_id if missing and set role=student ONLY if not teacher
  const { data: s } = await admin
    .from("students").select("id, email, user_id").ilike("email", email).maybeSingle();

  if (s && !s.user_id) {
    await admin.from("students").update({ user_id: uid }).eq("id", s.id);
  }
  if (!t && s) {
    await admin.rpc("set_profile_role_if_not_admin", { p_user_id: uid, p_role: "student" });
  }

  // 5) return final profile
  const { data: finalProfile } = await admin
    .from("profiles").select("*").eq("user_id", uid).maybeSingle();

  return NextResponse.json({ ok: true, profile: finalProfile ?? null });
}
