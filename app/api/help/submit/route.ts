// app/api/help/submit/route.ts
import { NextResponse } from "next/server";
import "server-only";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const ICT_TO = "15984@ucsiinternationalschool.edu.my"; // destination

function mailto(to: string, subject: string, body: string) {
  const u = new URL("mailto:" + to);
  u.searchParams.set("subject", subject);
  u.searchParams.set("body", body);
  return u.toString();
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const name = String(form.get("name") || "").trim();
    const klass = String(form.get("klass") || "").trim();
    const description = String(form.get("description") || "").trim();
    const file = form.get("file") as File | null;

    if (!name || !klass || !description) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Upload optional file to Supabase Storage (bucket: "help")
    const admin = supabaseAdmin();
    let attachmentUrl: string | null = null;

    if (file && file.size > 0) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const ab = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(ab).set(bytes);

      const safeName = (file.name || "upload").replace(/[^a-zA-Z0-9._-]+/g, "_");
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const path = `tickets/${stamp}-${safeName}`;

      const up = await admin.storage
        .from("help")
        .upload(path, ab, { contentType: file.type || "application/octet-stream", upsert: false });

      if (up.error) {
        // If the bucket doesn't exist, give a helpful error message back to the UI
        return NextResponse.json(
          { error: `Upload failed: ${up.error.message}. Create a public bucket named "help".` },
          { status: 500 }
        );
      }

      // create a signed URL valid for 7 days
      const signed = await admin.storage.from("help").createSignedUrl(path, 60 * 60 * 24 * 7);
      if (!signed.error && signed.data?.signedUrl) {
        attachmentUrl = signed.data.signedUrl;
      }
    }

    // Try SMTP first (if configured), otherwise return a mailto fallback the UI will open.
    const hasSMTP =
      !!process.env.SMTP_HOST &&
      !!process.env.SMTP_PORT &&
      !!process.env.SMTP_USER &&
      !!process.env.SMTP_PASS &&
      !!process.env.SMTP_FROM;

    const subject = `Timetable Viewer Help: ${name} (${klass})`;
    const bodyLines = [
      `Name: ${name}`,
      `Year/Class: ${klass}`,
      ``,
      `Description:`,
      description,
      ``,
      attachmentUrl ? `Attachment: ${attachmentUrl}` : `Attachment: (none)`,
      ``,
      `— Sent automatically from Timetable Viewer`,
    ];
    const bodyText = bodyLines.join("\n");

    if (hasSMTP) {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST!,
        port: Number(process.env.SMTP_PORT!),
        secure: Number(process.env.SMTP_PORT) === 465, // common convention
        auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM!,
        to: ICT_TO,
        subject,
        text: bodyText,
      });

      if (!info.messageId) {
        return NextResponse.json({ error: "Email send failed." }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    } else {
      // Fallback: open the user's mail client prefilled
      const mt = mailto(ICT_TO, subject, bodyText);
      return NextResponse.json({ ok: true, mailtoUrl: mt });
    }
  } catch (e: any) {
    console.error("help/submit error:", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
