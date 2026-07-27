const FALLBACK = "/dashboard";

// Paths that would bounce an already-authenticated visitor straight back to
// the auth pages (or into a loop through them) instead of somewhere useful.
const AUTH_LOOP_PATHS = ["/login", "/signup"];

const CONTROL_CHAR_RE = /[\x00-\x1f\x7f]/;

/**
 * Validate a post-auth redirect destination. Only same-origin application
 * paths beginning with exactly one `/` survive; everything else — an
 * absolute URL, a protocol-relative `//host` URL, a backslash (browsers can
 * treat `\` as a path separator, so `/\evil.example` can be interpreted the
 * same as `//evil.example`), a raw or decoded control character, or a path
 * that would loop back into the auth pages — falls back to `/dashboard`.
 *
 * Always returns a string; never throws. Safe to call with untrusted input
 * from a query param, a hidden form field, or a signed callback param.
 */
export function safeNextPath(value: string | null | undefined): string {
  if (!value) return FALLBACK;
  if (value.includes("\\")) return FALLBACK;
  if (CONTROL_CHAR_RE.test(value)) return FALLBACK;
  if (!value.startsWith("/") || value.startsWith("//")) return FALLBACK;

  const path = value.split(/[?#]/)[0];
  if (AUTH_LOOP_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return FALLBACK;

  return value;
}
