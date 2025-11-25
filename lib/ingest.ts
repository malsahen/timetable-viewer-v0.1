// lib/ingest.ts

// Safe lowercase/trim for comparisons
export function safe(s: unknown) {
  return String(s ?? "").trim();
}

// Slugify a teacher full name → "jane-doe"
export function slugifyName(name: string) {
  return safe(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Normalize class labels like "Year 8B", "Y8 b", "8b" → "y8b"
export function normalizeClassSlug(raw: string) {
  const s = safe(raw).toLowerCase().replace(/\s+/g, " ").trim();
  if (!s) return "";
  // Early Years (optional)
  if (/^(ey|early\s*years)$/i.test(s)) return "ey";
  // Try common patterns
  const m =
    s.match(/\by(?:ear)?\s*(\d{1,2})\s*([a-z])\b/i) ||
    s.match(/\b(\d{1,2})\s*([a-z])\b/i);
  if (m) return `y${m[1]}${m[2]}`.toLowerCase();
  // fallback: compress spaces and dashes
  return s.replace(/[^a-z0-9]/g, "");
}

// Pick the first non-empty field name from an object
export function pick(row: any, keys: string[]) {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
  }
  return "";
}
