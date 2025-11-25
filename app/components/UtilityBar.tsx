"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Who = { user?: { email?: string }, profile?: { role?: string } };

export default function UtilityBar() {
  const [who, setWho] = useState<Who | null>(null);

  useEffect(() => {
    fetch("/api/auth/whoami", { cache: "no-store" })
      .then(r => r.json())
      .then(j => setWho(j))
      .catch(() => setWho(null));
  }, []);

  const email = who?.user?.email ?? "";
  const role  = (who?.profile?.role ?? "").toLowerCase();

  return (
    <div className="utilitybar">
      <div className="container flex items-center justify-end h-9 gap-3">
        {email ? (
          <>
            <span className="text-xs opacity-90">
              Welcome, <strong>{email}</strong>{role ? ` · ${role}` : ""}
            </span>
            <form action="/api/auth/signout" method="post" aria-label="Sign out">
              <button type="submit" className="btn btn-quiet-sm">Sign out</button>
            </form>
          </>
        ) : (
          <Link href="/login" className="btn btn-quiet-sm">Sign in</Link>
        )}
      </div>
    </div>
  );
}
