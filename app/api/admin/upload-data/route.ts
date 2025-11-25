// app/api/admin/upload-data/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { parse as parseCsv } from "csv-parse/sync";

export const runtime = "nodejs";

/* ---------- tiny helpers ---------- */
const CI = (s: any) => String(s ?? "").trim();
const LC = (s: any) => CI(s).toLowerCase();
const isBlank = (v: any) => CI(v) === "";
const isBlankTeacherEmail = (e: string | null) => {
  const x = LC(e || "");
  return !x || x === "tbc" || x === "-" || x === "n/a";
};
function slugifyName(name: string): string {
  return CI(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function deriveNameFromEmail(email: string) {
  const local = (email.split("@")[0] || "").replace(/[._]+/g, " ");
  return local
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ")
    .trim();
}
function pick(row: Record<string, any>, keys: string[]): string | null {
  // case-insensitive pick
  const map: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) map[LC(k)] = v;
  for (const k of keys) {
    const v = map[LC(k)];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
  }
  return null;
}
async function readCsv(file: File): Promise<any[]> {
  const buf = Buffer.from(await file.arrayBuffer());
  return parseCsv(buf.toString("utf8"), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true,
  });
}

/* ---------- class canonicalization ---------- */
// Allowed canonical slugs (exactly the set you gave)
const ALLOWED_CLASS_SLUGS = new Set<string>([
  "early-years",
  "year-1",
  "year-2",
  "year-3",
  "year-4",
  "year-5",
  "year-6",
  "year-7a",
  "year-7b",
  "year-8a",
  "year-8b",
  "year-9a",
  "year-9b",
  "year-9c",
  "year-10a",
  "year-10b",
  "year-10c",
  "year-11a",
  "year-11b",
]);

/** Normalize any of: EY, ey, Early Years, 1..6, 7A/7B, 8A/8B, 9A/9B/9C, 10A/B/C, 11A/B, also "Year 7A", "year-10b", etc.
 *  Returns the canonical slug (e.g. "year-10c"), or null if it doesn't map to your allowed list.
 */
function normalizeClassSlug(input?: string | null): string | null {
  if (!input) return null;

  const raw = CI(input);
  let s = raw.toLowerCase().replace(/\s+/g, " ").trim();

  // EY aliases
  if (["ey", "early years", "early-years", "earlyyears"].includes(s)) {
    return "early-years";
  }

  // Already in "year X" / "year-X" forms (optional section)
  // e.g. "year 10 a", "year 10a", "year-10b"
  const yr = s.match(/^year[-\s]*([1-9]|10|11)\s*([a-c])?$/i);
  if (yr) {
    const grade = yr[1];
    const sec = (yr[2] || "").toLowerCase();
    const candidate = `year-${grade}${sec}`;
    return ALLOWED_CLASS_SLUGS.has(candidate) ? candidate : null;
  }

  // Compact numeric + optional section: "10c", "7A", "11 a", "5"
  const compact = s.replace(/\s+/g, "");
  const m = compact.match(/^([1-9]|10|11)([a-c])?$/i);
  if (m) {
    const grade = m[1];
    const sec = (m[2] || "").toLowerCase();
    const candidate = `year-${grade}${sec}`;
    return ALLOWED_CLASS_SLUGS.has(candidate) ? candidate : null;
  }

  // If it looks like a slug already (e.g. "year-9a")
  if (s.startsWith("year-")) {
    const candidate = s;
    return ALLOWED_CLASS_SLUGS.has(candidate) ? candidate : null;
  }

  // Fallback: not recognized
  return null;
}

function classNameFromSlug(slug: string): string {
  // Nice uppercase label (e.g. "year-10c" -> "YEAR-10C")
  return slug.toUpperCase();
}

/* ---------- route ---------- */
export async function POST(req: Request) {
  const sb = supabaseAdmin(); // service role: bypasses RLS
  const form = await req.formData();
  const kind = String(form.get("kind") || "");
  const file = form.get("file") as File | null;

  if (!["teachers", "ftct", "students"].includes(kind) || !file) {
    return NextResponse.json(
      { error: "kind (teachers|ftct|students) + file required" },
      { status: 400 }
    );
  }
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return NextResponse.json({ error: "CSV files only" }, { status: 400 });
  }

  const rows = await readCsv(file);
  const headers = Object.keys(rows[0] || {});
  let upserted = 0,
    skipped = 0;
  const errors: string[] = [];
  const errors_detail: any[] = []; // collect first few detailed errors

  /* ---------- TEACHERS ---------- */
  if (kind === "teachers") {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const email = LC(pick(r, ["email", "teacher_email", "work email", "work_email"]) || "");
        if (!email) {
          skipped++;
          continue;
        }
        const full =
          pick(r, ["full_name", "name", "teacher_name", "teacher"]) || deriveNameFromEmail(email);
        const slug = slugifyName(full);

        const t = await sb.from("teachers").upsert({ email, full_name: full, slug }, { onConflict: "email" });
        if (t.error) throw t.error;

        const p = await sb
          .from("profiles")
          .upsert({ email, role: "teacher" }, { onConflict: "email", ignoreDuplicates: true });
        if (p.error) throw p.error;

        upserted++;
      } catch (e: any) {
        errors.push(e?.message || "teachers: row failed");
        if (errors_detail.length < 10) {
          errors_detail.push({
            i: i + 1,
            email: pick(r, ["email", "teacher_email"]),
            raw: r,
            error: e?.message || String(e),
          });
        }
      }
    }
    return NextResponse.json({
      ok: true,
      kind,
      headers,
      rowCount: rows.length,
      upserted,
      skipped,
      errors: errors.length,
      errors_detail,
    });
  }

  /* ---------- FTCT (class-centric) ---------- */
  if (kind === "ftct") {
    async function ensureClass(slugLike: string | null) {
      const s = normalizeClassSlug(slugLike);
      if (!s) return null; // reject unknowns
      const r = await sb
        .from("classes")
        .upsert({ slug: s, name: classNameFromSlug(s) }, { onConflict: "slug", ignoreDuplicates: true });
      if (r.error) throw r.error;
      return s;
    }
    async function ensureTeacher(email: string | null, nameMaybe?: string | null) {
      if (!email || isBlankTeacherEmail(email)) return;
      const e = LC(email);
      const { data: t } = await sb.from("teachers").select("email").eq("email", e).maybeSingle();
      if (!t) {
        const full = (nameMaybe && nameMaybe.trim()) || deriveNameFromEmail(e);
        const slug = slugifyName(full);
        const ins = await sb.from("teachers").insert({ email: e, full_name: full, slug });
        if (ins.error) throw ins.error;
      }
      const p = await sb
        .from("profiles")
        .upsert({ email: e, role: "teacher" }, { onConflict: "email", ignoreDuplicates: true });
      if (p.error) throw p.error;
    }

    // strong header check
    const lcHeaders = headers.map(LC);
    const required = ["class", "ft_email", "ct_email"];
    const missing = required.filter((h) => !lcHeaders.includes(h));
    if (missing.length) {
      return NextResponse.json(
        {
          error:
            "ftct.csv must have headers: class, ft_email, ft_name (optional), ct_email, ct_name (optional).",
          headers_detected: headers,
          missing,
        },
        { status: 400 }
      );
    }

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const classSlug = await ensureClass(pick(r, ["class"]));
        if (!classSlug) {
          skipped++;
          if (errors_detail.length < 10) {
            errors_detail.push({
              i: i + 1,
              class_in: pick(r, ["class"]),
              error: "Unrecognized class; must be one of EY,1,2,3,4,5,6,7A,7B,8A,8B,9A,9B,9C,10A,10B,10C,11A,11B",
            });
          }
          continue;
        }

        const ftEmail = pick(r, ["ft_email"]);
        const ftName = pick(r, ["ft_name"]);
        const ctEmail = pick(r, ["ct_email"]);
        const ctName = pick(r, ["ct_name"]);

        if (!isBlankTeacherEmail(ftEmail)) {
          await ensureTeacher(ftEmail, ftName);
          const u = await sb.from("teachers").update({ ft_class_slug: classSlug }).eq("email", LC(ftEmail!));
          if (u.error) throw u.error;
          upserted += u.count ?? 1;
        } else {
          skipped++;
        }

        if (!isBlankTeacherEmail(ctEmail)) {
          await ensureTeacher(ctEmail, ctName);
          const u = await sb.from("teachers").update({ ct_class_slug: classSlug }).eq("email", LC(ctEmail!));
          if (u.error) throw u.error;
          upserted += u.count ?? 1;
        } else {
          skipped++;
        }
      } catch (e: any) {
        errors.push(e?.message || "ftct: row failed");
        if (errors_detail.length < 10) {
          errors_detail.push({
            i: i + 1,
            class_in: pick(r, ["class"]),
            ft_email: pick(r, ["ft_email"]),
            ct_email: pick(r, ["ct_email"]),
            raw: r,
            error: e?.message || String(e),
          });
        }
      }
    }
    return NextResponse.json({
      ok: true,
      kind,
      headers,
      rowCount: rows.length,
      upserted,
      skipped,
      errors: errors.length,
      errors_detail,
    });
  }

  /* ---------- STUDENTS ---------- */
  if (kind === "students") {
    const base = file.name.replace(/\.csv$/i, "");
    const inferred = normalizeClassSlug(base.replace(/class|students?|list/gi, ""));

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const email = LC(pick(r, ["student_email", "email", "pupil_email"]) || "");
        const full =
          pick(r, ["student_name", "name", "full_name", "pupil_name"]) || email;

        // Accept Class / class / CLASS or class_name / class_slug
        const rawClass = pick(r, ["class", "class_name", "class_slug"]) || inferred;
        const classSlug = normalizeClassSlug(rawClass);

        if (!email || !classSlug) {
          skipped++;
          if (errors_detail.length < 10) {
            errors_detail.push({
              i: i + 1,
              email: pick(r, ["student_email", "email"]),
              class_in: rawClass ?? null,
              error: !email ? "Missing student email" : "Unrecognized class value",
            });
          }
          continue;
        }

        // Ensure class exists
        const c1 = await sb
          .from("classes")
          .upsert({ slug: classSlug, name: classNameFromSlug(classSlug) }, { onConflict: "slug", ignoreDuplicates: true });
        if (c1.error) throw c1.error;

        // Upsert student
        const u3 = await sb
          .from("students")
          .upsert({ email, full_name: full, class_slug: classSlug }, { onConflict: "email" });
        if (u3.error) throw u3.error;
        upserted++;

        // Optional parent/guardian email
        const pEmail = LC(pick(r, ["parent_email", "guardian_email"]) || "");
        if (pEmail) {
          const p1 = await sb
            .from("parents")
            .upsert({ email: pEmail }, { onConflict: "email", ignoreDuplicates: true });
          if (p1.error) throw p1.error;
        }

        // Ensure profile (role=student) exists
        const p2 = await sb
          .from("profiles")
          .upsert({ email, role: "student" }, { onConflict: "email", ignoreDuplicates: true });
        if (p2.error) throw p2.error;
      } catch (e: any) {
        errors.push(e?.message || "students: row failed");
        if (errors_detail.length < 10) {
          errors_detail.push({
            i: i + 1,
            email: pick(r, ["student_email", "email"]),
            class_in: pick(r, ["class", "class_name", "class_slug"]) || inferred,
            raw: r,
            error: e?.message || String(e),
          });
        }
      }
    }
    return NextResponse.json({
      ok: true,
      kind,
      headers,
      rowCount: rows.length,
      upserted,
      skipped,
      errors: errors.length,
      errors_detail,
    });
  }

  return NextResponse.json({ ok: false, error: "unknown kind" }, { status: 400 });
}
