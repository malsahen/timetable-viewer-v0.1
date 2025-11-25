import { NextResponse } from "next/server";
import "server-only";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { kind, label, source } = body as {
      kind: "teacher" | "class";
      label?: string;
      source?: "zip" | "multi" | "offline" | null;
    };

    if (kind !== "teacher" && kind !== "class") {
      return NextResponse.json({ error: "kind must be 'teacher' or 'class'" }, { status: 400 });
    }

    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("versions")
      .insert({
        label: label ?? null,
        kind,
        source: source ?? "zip",
        status: "new",
        is_current: false,
        created_by: user?.id ?? null,
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ versionId: data!.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
