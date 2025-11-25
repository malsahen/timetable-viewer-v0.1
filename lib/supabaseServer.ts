// lib/supabaseServer.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Read-only Supabase client for Server Components (pages/layouts/RSC).
 * - Safe on Next.js 16 (does NOT modify cookies).
 * - Use this in: app/page.tsx, app/my-timetable/page.tsx, etc.
 * - For route handlers or server actions that need to mutate auth cookies,
 *   use `supabaseRoute` instead.
 */
export async function supabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // IMPORTANT: in Server Components we must NOT modify cookies.
        set(_name: string, _value: string, _options: CookieOptions) {
          // no-op
        },
        remove(_name: string, _options: CookieOptions) {
          // no-op
        },
      },
    }
  );
}
