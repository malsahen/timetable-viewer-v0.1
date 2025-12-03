// app/api/admin/create-teacher-auth/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type TeacherRow = {
  id: number;
  email: string | null;
  user_id: string | null;
  full_name: string | null;
};

export async function POST(_req: Request) {
  const admin = supabaseAdmin();

  try {
    // 1) Load all teachers
    const { data: teachers, error: teacherErr } = await admin
      .from("teachers")
      .select("id,email,user_id,full_name");

    if (teacherErr) throw teacherErr;

    const teacherRows = (teachers ?? []) as TeacherRow[];

    // 2) Load all existing auth users (enough for your size; adjust perPage if needed)
    const { data: usersPage, error: usersErr } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (usersErr) throw usersErr;

    const users = usersPage.users ?? [];
    const userByEmail: Record<string, string> = {};

    for (const u of users) {
      if (u.email) {
        userByEmail[u.email.toLowerCase()] = u.id;
      }
    }

    let createdUsers = 0;
    let linkedExistingUsers = 0;
    let skippedNoEmail = 0;
    const failures: Array<{
      teacher_id: number;
      email: string | null;
      error: string;
      where?: string;
    }> = [];

    // 3) For each teacher: ensure auth user exists + link user_id in teachers & profiles
    for (const t of teacherRows) {
      const rawEmail = t.email?.trim() || "";
      if (!rawEmail) {
        skippedNoEmail++;
        continue;
      }

      const emailLower = rawEmail.toLowerCase();
      let userId = userByEmail[emailLower];

      // 3a) If user doesn't exist in auth.users → create with pattern {local-part}abc
      if (!userId) {
        const localPart = emailLower.split("@")[0];
        const password = `${localPart}abc`;

        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email: emailLower,
          password,
          email_confirm: true, // treat as already confirmed
        });

        if (createErr || !created?.user) {
          failures.push({
            teacher_id: t.id,
            email: rawEmail,
            error: createErr?.message || "Unknown error creating user",
            where: "auth.admin.createUser",
          });
          continue;
        }

        userId = created.user.id;
        userByEmail[emailLower] = userId;
        createdUsers++;
      } else {
        linkedExistingUsers++;
      }

      // 3b) Sync teachers.user_id
      if (!t.user_id || t.user_id !== userId) {
        const { error: updateTeacherErr } = await admin
          .from("teachers")
          .update({ user_id: userId })
          .eq("id", t.id);

        if (updateTeacherErr) {
          failures.push({
            teacher_id: t.id,
            email: rawEmail,
            error: updateTeacherErr.message,
            where: "update teachers.user_id",
          });
        }
      }

      // 3c) Sync profiles.user_id for that email
      const { error: updateProfileErr } = await admin
        .from("profiles")
        .update({ user_id: userId })
        .eq("email", rawEmail);

      if (updateProfileErr) {
        failures.push({
          teacher_id: t.id,
          email: rawEmail,
          error: updateProfileErr.message,
          where: "update profiles.user_id",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      totalTeachers: teacherRows.length,
      createdUsers,
      linkedExistingUsers,
      skippedNoEmail,
      failuresCount: failures.length,
      failures,
      passwordPattern: "{local-part}abc",
      note:
        "Newly created accounts use password pattern {local-part}abc. Existing auth users keep their current passwords.",
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "Server error",
      },
      { status: 500 },
    );
  }
}
