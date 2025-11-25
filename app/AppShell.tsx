"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const res = await fetch("/api/auth/whoami", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setSignedIn(false);
          return;
        }
        const json = await res.json();
        if (!cancelled) setSignedIn(Boolean(json?.user));
      } catch {
        if (!cancelled) setSignedIn(false);
      }
    }

    checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignOut() {
    try {
      setSigningOut(true);
      // Call the API route that clears the Supabase session cookies
      await fetch("/api/auth/signout", { method: "POST" }).catch(() => {});
    } finally {
      // Optimistically treat as signed out and go to login
      setSignedIn(false);
      setSigningOut(false);
      router.push("/login");
    }
  }

  const year = new Date().getFullYear();

  const navLinkClass = (href: string) => {
    const base = "tab";
    const active =
      (href === "/" && pathname === "/") ||
      (href !== "/" && pathname?.startsWith(href));
    return active ? `${base} tab-active` : base;
  };

  return (
    <div className="min-h-screen bg-surface text-ink">
      {/* Utility bar */}
      <div className="utilitybar">
        <div className="container flex items-center justify-end h-9 gap-4">
          {signedIn === null && (
            <span className="text-xs text-gray-400">Checking session…</span>
          )}

          {signedIn === true && (
            <button
              type="button"
              className="btn btn-quiet-sm"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          )}

          {signedIn === false && (
            <Link href="/login" className="btn btn-quiet-sm">
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* Brand masthead */}
      <header className="brandmasthead">
        <div className="container py-6 flex justify-center">
          <Image
            src="/images/Subang_logo-2.png"
            alt="School Logo"
            width={520}
            height={120}
            className="h-24 w-auto object-contain"
            priority
          />
        </div>
      </header>

      {/* Primary nav (hidden on admin routes) */}
      {!isAdmin && (
        <nav aria-label="Primary" className="primarynav">
          <div className="container">
            <ul className="tabs">
              <li>
                <Link className={navLinkClass("/")} href="/">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  className={navLinkClass("/my-timetable")}
                  href="/my-timetable"
                >
                  My Timetable
                </Link>
              </li>
              <li>
                <Link className={navLinkClass("/help")} href="/help">
                  Help
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      )}

      {/* Main content */}
      <main className="container py-8">{children}</main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container py-5 flex items-center justify-between">
          <span>© {year} UCSI Timetables</span>
          <span>
            Developed by <strong>Mr Khier</strong>
          </span>
        </div>
      </footer>
    </div>
  );
}
