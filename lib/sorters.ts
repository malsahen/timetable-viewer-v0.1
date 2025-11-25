// lib/sorters.ts
export function parseNumericOrder(name: string): number {
  // Extract the first number in a filename, fallback to lexicographic weight
  const m = name.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}

function yearKey(s: string): number {
  // EY first => 0, then Year 1..11 => 1..11, fallback high
  const n = s.toLowerCase().trim();
  if (/(^|\s)(ey|early\s*years)(\s|$)/i.test(n)) return 0;
  const m = n.match(/year\s*(\d{1,2})/i);
  if (m) return parseInt(m[1], 10);
  return 999;
}

function sectionKey(s: string): string {
  // Extract A/B/C ... as sort key; fallback long string
  const m = s.match(/(?:^|\s)([A-Z])(?:\s|$)/i);
  return m ? m[1].toUpperCase() : 'ZZZ';
}

export function classSortKey(nameOrSlug: string): [number, string] {
  return [yearKey(nameOrSlug), sectionKey(nameOrSlug)];
}
