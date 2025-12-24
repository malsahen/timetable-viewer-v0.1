// app/login/LoginClient.tsx
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Role = "admin" | "teacher" | "student" | "browser";

export default function LoginClient() {
  const search = useSearchParams();
  const next = search.get("next") || "";
  const sb = supabaseBrowser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"pw" | "magic" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function afterAuthRedirect() {
    // 1) Link user → profile/role on the server
    try {
      await fetch("/api/auth/sync-profile", { method: "POST", cache: "no-store" });
    } catch {
      // ignore – non-fatal
    }

    // 2) Fetch role
    let role: Role = "student";
    try {
      const r = await fetch("/api/auth/whoami", { cache: "no-store" });
      const j = await r.json();
      const raw = (j?.profile?.role ?? "student").toLowerCase();
      if (raw === "admin" || raw === "teacher" || raw === "student" || raw === "browser") role = raw;
    } catch {
      // default to student
    }

    // 3) Decide target
    let target = "/my-timetable";
    if (next) target = next;
    else if (role === "admin") target = "/admin";
    else if (role === "browser") target = "/browse-timetables";
    // Teachers and students both use /my-timetable
    // (role-specific content is handled by the page itself)

    // 4) Hard reload so nav picks up new session
    window.location.assign(target);
  }

  async function signInPassword(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading("pw");

    const { error } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(null);
      setErr(error.message || "Sign in failed.");
      return;
    }

    await afterAuthRedirect();
  }

  async function sendMagic() {
    setErr(null);
    setMsg(null);
    setLoading("magic");

    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      // If you use a custom redirect for magic links, set emailRedirectTo here
      // emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`,
    });

    setLoading(null);
    if (error) {
      setErr(error.message || "Could not send magic link.");
    } else {
      setMsg("Magic link sent. Check your inbox.");
    }
  }

  const isBusy = loading !== null;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md items-center justify-center px-4 py-10">
      <div className="card w-full rounded-2xl border border-slate-200 bg-white/80 shadow-xl backdrop-blur-sm">
        <div className="card-body p-6 sm:p-8">
          <header className="space-y-1">
            <h1 className="h1 text-xl font-semibold tracking-tight text-slate-900">
              Sign in
            </h1>
            <p className="muted text-sm text-slate-500">
              Use your school account to continue to the platform.
            </p>
          </header>

          {err && (
            <div className="alert error mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </div>
          )}
          {msg && (
            <div className="alert success mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {msg}
            </div>
          )}

          <form
            onSubmit={signInPassword}
            className="mt-6 grid gap-4"
            aria-label="Sign in form"
          >
            <label className="grid gap-2">
              <span className="label text-sm font-medium text-slate-700">
                Email
              </span>
              <input
                type="email"
                className="input block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                placeholder="you@school.edu.my"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="label text-sm font-medium text-slate-700">
                Password
              </span>
              <input
                type="password"
                className="input block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                minLength={6}
                required
              />
            </label>

            <button
              type="submit"
              disabled={isBusy}
              className="btn btn-primary mt-2 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading === "pw" ? "Signing in…" : "Sign in"}
            </button>

            <button
              type="button"
              onClick={sendMagic}
              disabled={isBusy || !email.trim()}
              className="btn btn-outline inline-flex w-full items-center justify-center rounded-lg border border-indigo-200 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading === "magic" ? "Sending link…" : "Email me a magic link"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Need help? Visit{" "}
            <a
              href="/help"
              className="font-medium text-indigo-600 underline-offset-2 hover:text-indigo-500 hover:underline"
            >
              Help
            </a>{" "}
            or contact ICT Support.
          </p>
        </div>
      </div>
    </div>
  );
}
