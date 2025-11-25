// app/api/admin/auto-ingest/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";

// Temporarily disabled: the previous implementation depended on lib/pdfNode
// and we are not using auto-ingest in the current phase.
// This prevents crashes if the route is accidentally called.
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "auto-ingest disabled in this phase (no pdfNode). Use upload + publish-mapping instead." },
    { status: 501 }
  );
}
