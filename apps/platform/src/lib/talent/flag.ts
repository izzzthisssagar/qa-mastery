import "server-only";

/**
 * Talent feature flag. The marketplace is now LAUNCHED — on by default. Set
 * TALENT_ENABLED=false to take it dark again (an instant, deploy-free kill
 * switch via the env var). Gating still flows through this one function, so
 * reverting to off-by-default later is a one-line change.
 */
export function talentEnabled(): boolean {
  return process.env.TALENT_ENABLED !== "false";
}
