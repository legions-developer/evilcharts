// Round-robin pool of GitHub tokens parsed from the GITHUB_TOKEN env var.
// A token that hits a 403/429 is benched for COOLDOWN_MS so it is skipped.
// Module-scoped: state lives for the lifetime of the server process
// (per-instance on serverless — acceptable, see plan notes).

const COOLDOWN_MS = 15 * 60 * 1000;

interface TokenState {
  token: string;
  benchedUntil: number;
}

function parseTokens(raw: string | undefined): TokenState[] {
  if (!raw) return [];
  const unique = new Set(
    raw
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean),
  );
  return [...unique].map((token) => ({ token, benchedUntil: 0 }));
}

const tokens = parseTokens(process.env.GITHUB_TOKEN);
let cursor = 0;

/** True when at least one token is configured. */
export function hasTokens(): boolean {
  return tokens.length > 0;
}

/**
 * Next non-benched token (round-robin), or `null` when every token is benched
 * or none are configured. Pair with `hasTokens()` to tell the two apart.
 */
export function acquireToken(): string | null {
  if (tokens.length === 0) return null;
  const now = Date.now();
  for (let i = 0; i < tokens.length; i++) {
    const entry = tokens[(cursor + i) % tokens.length];
    if (entry.benchedUntil <= now) {
      cursor = (cursor + i + 1) % tokens.length;
      return entry.token;
    }
  }
  return null;
}

/** Bench a token for the cooldown window after a rate-limit response. */
export function benchToken(token: string): void {
  const entry = tokens.find((t) => t.token === token);
  if (entry) entry.benchedUntil = Date.now() + COOLDOWN_MS;
}
