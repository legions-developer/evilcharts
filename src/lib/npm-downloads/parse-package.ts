import { BadPackageError } from "./types";

/** npm's hard cap on a package name's length. */
const MAX_NAME_LENGTH = 214;
/**
 * One name segment (scope or package): starts alphanumeric, then npm's
 * url-safe charset. Case-insensitive so legacy mixed-case packages still
 * resolve — npm only lowercases *new* names.
 */
const SEGMENT = /^[a-z0-9][a-z0-9._-]*$/i;

export interface ParsedPackage {
  /** Canonical package name, e.g. "react" or "@scope/pkg". */
  name: string;
}

/**
 * Parse an npm package from either an npmjs.com URL
 * (https://www.npmjs.com/package/react) or a plain name ("react",
 * "@scope/pkg"). Throws `BadPackageError` on anything malformed.
 */
export function parsePackage(input: string): ParsedPackage {
  let trimmed = input.trim();
  if (!trimmed) throw new BadPackageError(input);

  // URL-ish input (a scheme, or a leading "host.tld/") must live on npmjs.com.
  if (/^https?:\/\//i.test(trimmed) || /^[\w-]+(\.[\w-]+)+\//.test(trimmed)) {
    let url: URL;
    try {
      url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    } catch {
      throw new BadPackageError(input);
    }
    if (url.hostname.replace(/^www\./i, "").toLowerCase() !== "npmjs.com") {
      throw new BadPackageError(input);
    }
    const segments = url.pathname.split("/").filter(Boolean);
    // Expected shape: /package/<name> or /package/@scope/name.
    if (segments[0] !== "package" || segments.length < 2) throw new BadPackageError(input);
    try {
      trimmed = decodeURIComponent(segments.slice(1).join("/"));
    } catch {
      throw new BadPackageError(input);
    }
  }

  const name = trimmed.replace(/\/+$/, "");
  if (!name || name.length > MAX_NAME_LENGTH) throw new BadPackageError(input);

  // Scoped package: "@scope/name".
  if (name.startsWith("@")) {
    const parts = name.slice(1).split("/");
    if (parts.length !== 2) throw new BadPackageError(input);
    const [scope, pkg] = parts;
    if (!SEGMENT.test(scope) || !SEGMENT.test(pkg)) throw new BadPackageError(input);
    return { name: `@${scope}/${pkg}` };
  }

  // Unscoped package — a single segment, no slashes.
  if (!SEGMENT.test(name)) throw new BadPackageError(input);
  return { name };
}
