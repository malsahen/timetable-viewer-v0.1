import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { parse } from "csv-parse/sync";

function normSlug(s: string | null | undefined) {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\s/-]+/g, "")
    .replace(/[\/\s]+/g, "-");
}
function normEmail(e: string | null | undefined) {
  return (e ?? "").trim().toLowerCase();
}

export const runtime = "nodejs";

export async function POST(req: Request) {
  const form = await req.formData();
  const admin = supabaseAdmin();

  let studAdded = 0, studUpdated = 0, teachAdded = 0, teachUpdated = 0;

  // Students.csv
  const sFile = form.get("students") as File | null;
  if (sFile) {
    const buf = Buffer.from(await sFile.arrayBuffer());
    const rows: any[] = parse(buf, { columns: true, skip_empty_lines: true, trim: true });
    for (const r of rows) {
      const email = normEmail(r.email);
      const full_name = (r.full_name ?? "").trim();
      const class_slug = normSlug(r.class_slug);
      if (!email || !class_slug) continue;

      // upsert by email
      const { data: existing } = await admin.from("students").select("id,email").eq("email", email).maybeSingle();
      if (existing) {
        const { error } = await admin.from("students").update({ full_name, class_slug }).eq("email", email);
        if (!error) studUpdated++;
      } else {
        const { error } = await admin.from("students").insert({ full_name, email, class_slug });
        if (!error) studAdded++;
      }
    }
  }

  // Teachers.csv
  const tFile = form.get("teachers") as File | null;
  if (tFile) {
    const buf = Buffer.from(await tFile.arrayBuffer());
    const rows: any[] = parse(buf, { columns: true, skip_empty_lines: true, trim: true });
    for (const r of rows) {
      const email = normEmail(r.email);
      const full_name = (r.full_name ?? "").trim();
      const slug = normSlug(r.slug || full_name);
      const ft = normSlug(r.ft_class_slug);
      const ct = normSlug(r.ct_class_slug);

      if (!email || !slug) continue;

      const { data: existing } = await admin.from("teachers").select("id,email").eq("email", email).maybeSingle();
      if (existing) {
        const { error } = await admin
          .from("teachers")
          .update({ full_name, slug, ft_class_slug: ft || null, ct_class_slug: ct || null })
          .eq("email", email);
        if (!error) teachUpdated++;
      } else {
        const { error } = await admin
          .from("teachers")
          .insert({ full_name, email, slug, ft_class_slug: ft || null, ct_class_slug: ct || null });
        if (!error) teachAdded++;
      }
    }
  }

  const summary =
    `students +${studAdded}/~${studUpdated} · teachers +${teachAdded}/~${teachUpdated}`;
  return NextResponse.json({ ok: true, summary });
}
