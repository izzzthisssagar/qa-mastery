/** True when the user has requested reduced motion (prefers-reduced-motion:
 *  reduce). Safe to call outside React render — canvas-confetti has no
 *  reduced-motion awareness of its own, so callers must check this first. */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}
