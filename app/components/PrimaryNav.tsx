"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home" },
  { href: "/my-timetable", label: "My Timetable" },
  { href: "/admin", label: "Admin" },
  { href: "/help", label: "Help" },
];

export default function PrimaryNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="primarynav">
      <div className="container">
        <ul className="tabs">
          {items.map((it) => {
            const active = pathname === it.href || pathname?.startsWith(it.href + "/");
            return (
              <li key={it.href}>
                <Link className={`tab ${active ? "tab-active" : ""}`} href={it.href}>
                  {it.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
