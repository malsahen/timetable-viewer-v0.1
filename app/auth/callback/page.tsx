"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function AuthCallbackPage() {
  const [msg, setMsg] = useState("Finishing sign-in...");

  useEffect(() => {
    (async () => {
      try {
        const supabase = supabaseBrowser();

        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) {
          console.error("[exchangeCodeForSession] error:", error);
          setMsg(error.message || "Sign-in link is invalid or expired.");
          return;
        }

        const r = await fetch("/api/auth/sync-profile", { method: "POST" });
        if (!r.ok) {
          setMsg("Signed in, but profile sync failed.");
          return;
        }

        window.location.replace("/my-timetable");
      } catch (e: any) {
        console.error("[callback] caught error:", e);
        setMsg(e?.message || "Something went wrong.");
      }
    })();
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-sm text-gray-700">{msg}</div>
    </main>
  );
}
