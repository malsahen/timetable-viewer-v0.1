// set_passwords_students_only.js
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const SUFFIX = "abc";
const lp = (e) => (e.split("@")[0] || "").replace(/\s+/g, "");

async function fetchAllStudentEmails() {
  const emails = [];
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from("students")
      .select("email")
      .not("email", "is", null)
      .range(from, from + 999);
    if (error) throw error;
    if (!data?.length) break;
    for (const r of data) if (r.email) emails.push(r.email.toLowerCase());
    if (data.length < 1000) break;
    from += 1000;
  }
  return emails;
}

async function buildAuthIndex() {
  const idx = new Map();
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) idx.set((u.email || "").toLowerCase(), u.id);
    if (data.users.length < 1000) break;
  }
  return idx;
}

(async () => {
  const students = await fetchAllStudentEmails();
  const authIdx = await buildAuthIndex();

  const report = { created: 0, updated: 0, linked: 0, errors: 0, details: [] };

  for (const email of students) {
    const password = lp(email) + SUFFIX;
    try {
      let uid = authIdx.get(email);
      if (!uid) {
        const { data, error } = await sb.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (error) throw error;
        uid = data.user.id;
        authIdx.set(email, uid);
        report.created++;
      } else {
        const { error } = await sb.auth.admin.updateUserById(uid, { password });
        if (error) throw error;
        report.updated++;
      }

      const { error: pErr } = await sb.from("profiles").upsert(
        { email, role: "student", user_id: uid },
        { onConflict: "email" }
      );
      if (pErr) throw pErr;

      report.linked++;
      report.details.push({ email, user_id: uid });
    } catch (e) {
      report.errors++;
      report.details.push({ email, error: String(e) });
    }
  }

  console.log(JSON.stringify(report, null, 2));
})();
