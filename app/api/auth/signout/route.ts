// app/api/auth/signout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseRoute } from "@/lib/supabaseRoute";

/**
 * Performs Supabase sign-out and redirects to /login.
 * Works for both GET (browser navigation) and POST (fetch).
 */
async function handleSignOut(req: NextRequest) {
  // Use the route-scoped Supabase client (allowed to mutate cookies)
  const sb = await supabaseRoute();

  try {
    await sb.auth.signOut();
  } catch (e) {
    // We still redirect even if signout fails; no need to crash the route
    console.error("Supabase signOut failed:", e);
  }

  // ALWAYS redirect to /login on the same origin
  const loginUrl = new URL("/login", req.url);
  return NextResponse.redirect(loginUrl, 303); // 303 = "See Other" after POST
}

// GET /api/auth/signout  (e.g. clicking a normal <a> link)
export async function GET(req: NextRequest) {
  return handleSignOut(req);
}

// POST /api/auth/signout (e.g. fetch('/api/auth/signout', { method: 'POST' }))
export async function POST(req: NextRequest) {
  return handleSignOut(req);
}
