export {
  RELEASES,
  DEFAULT_RELEASE,
  isRelease,
  type Release,
} from "./releases";

export {
  SEEDED_BUGS,
  isBugActive,
  bugFlag,
  type SeededBugSpec,
  type SeededBugId,
} from "./bug-flag";

export {
  HANDOFF_TTL_SECONDS,
  SESSION_TTL_SECONDS,
  mintHandoffToken,
  verifyHandoffToken,
  mintSessionToken,
  verifySessionToken,
  type SandboxClaims,
} from "./sandbox-token";

export { WIDGET_NAMES, isWidgetName, type WidgetName } from "./widget-names";

// Shared Server Action return contract (P1-10). A mutating/reading action
// returns this instead of throwing, so the client can branch on `ok` without
// a try/catch — see apps/platform/src/app/(app)/talent/actions.ts for the
// pattern.
export type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };
