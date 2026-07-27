/** Only allow same-origin relative paths — blocks open-redirect via
 *  `next=https://evil.example` or `next=//evil.example`. */
export function sanitizeNext(next: string | undefined | null): string | undefined {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return undefined;
}
