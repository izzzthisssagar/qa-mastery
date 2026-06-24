import "server-only";

/**
 * Talent feature flag. The marketplace ships dark and is exposed progressively
 * (seed graduates → cohort → general) via this env flag — decoupled from
 * deploys (DevOps-Spec §3.3). Mirrors the existing BILLING_ENABLED pattern.
 * Off by default so /talent is invisible until explicitly enabled.
 */
export function talentEnabled(): boolean {
  return process.env.TALENT_ENABLED === "true";
}
