// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  // Mutable response so Supabase can sync cookies
  const res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const path = req.nextUrl.pathname;
  const isLogin = path === "/login";
  const isAdmin = path.startsWith("/admin");
  const isProtected = isAdmin || path.startsWith("/my-timetable");

  if (!session && isProtected) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // If already logged in and on /login → bounce based on role
  if (session && isLogin) {
    // Minimal lookup of role
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", session.user.id)
      .maybeSingle();

    const role = (prof?.role ?? "student") as "admin" | "teacher" | "student";

    const url = req.nextUrl.clone();
    if (role === "admin") url.pathname = "/admin";
    else if (role === "teacher") {
      url.pathname = "/my-timetable";
      url.searchParams.set("view", "teacher");
    } else url.pathname = "/my-timetable";

    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next|favicon.ico|public|api/auth/signout|api/auth/whoami|api/auth/sync-profile).*)",
  ],
};
