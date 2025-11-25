// app/components/TopNav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Who = { user?: { email?: string }, profile?: { role?: string } };

export default function TopNav() {
  const pathname = usePathname();
  const [who, setWho] = useState<Who | null>(null);

  useEffect(() => {
    fetch("/api/auth/whoami", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setWho(j))
      .catch(() => setWho(null));
  }, []);

  const role = (who?.profile?.role ?? "").toLowerCase();
  const item = (href: string, label: string) => {
    const active = pathname === href || pathname?.startsWith(href + "/");
    return <Link href={href} className={`nav-link ${active ? "nav-link-active" : ""}`}>{label}</Link>;
  };

  return (
    <div className="topnav">
      <nav aria-label="Primary" className="container flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          {item("/", "Home")}
          {item("/my-timetable", "My Timetable")}
          {role === "admin" && item("/admin", "Admin")}
          {item("/help", "Help")}
        </div>

        {who?.user?.email ? (
          <form action="/api/auth/signout" method="post" aria-label="Sign out">
            <button type="submit" className="btn btn-quiet">Sign out</button>
          </form>
        ) : (
          <Link href="/login" className="btn btn-quiet">Sign in</Link>
        )}
      </nav>
    </div>
  );
}
