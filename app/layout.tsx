import "./globals.css";
import type { Metadata } from "next";
import AppShell from "./AppShell";

export const metadata: Metadata = {
  title: "UCSI Timetables",
  description: "Publish and view the latest school timetables.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
