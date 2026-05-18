// XML-escaping and number formatting for hand-built SVG strings.

const XML_ENTITIES: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
};

/** Escape text for safe insertion into SVG markup. */
export function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) => XML_ENTITIES[c] ?? c);
}

/** Compact star-count label: 1500 → "1.5k", 2_000_000 → "2M". */
export function formatStars(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${trimZero(n / 1_000_000)}M`;
  if (abs >= 1_000) return `${trimZero(n / 1_000)}k`;
  return String(Math.round(n));
}

function trimZero(n: number): string {
  return String(Math.round(n * 10) / 10);
}
