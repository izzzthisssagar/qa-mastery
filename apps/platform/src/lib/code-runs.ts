/**
 * Shared code-execution plumbing for every graded lab, wherever it lives.
 *
 * Labs used to exist only inside lessons, so the runner ladder and the daily
 * quota lived inside `learn/actions.ts`. Notes-spine labs need exactly the same
 * two things, and duplicating the quota would silently double a learner's
 * allowance — the cap is counted over one `code_runs` table, so it has to be
 * enforced from one place.
 *
 * Not a "use server" module: that directive restricts a file to async exports,
 * and `getCodeRunner` is a plain function. Server actions import from here.
 */

import type { RunnerProvider } from "@qa-mastery/grading";
import { Judge0Runner, DockerPlaywrightRunner, WandboxRunner } from "@qa-mastery/grading/runners";
import type { SupabaseClient } from "@supabase/supabase-js";

const judge0 = new Judge0Runner();
const playwright = new DockerPlaywrightRunner();
const wandbox = new WandboxRunner();

/**
 * Pick the runner for a lab.
 *
 * Plain-code labs run on Wandbox — synchronous, free, keyless, and reachable
 * over plain HTTPS, which is why a lab grades identically on `pnpm dev` and on
 * Vercel with no extra setup. `USE_JUDGE0` swaps in Judge0 when an operator
 * needs it (a self-hosted Wandbox being down, say), and `WANDBOX_URL` points
 * the default runner at a private instance.
 *
 * `browser: true` selects the Playwright runner, which needs a container and
 * therefore does NOT run the same in both environments — reserve it for labs
 * that genuinely drive a browser.
 */
export function getCodeRunner(options: { browser?: boolean } = {}): RunnerProvider {
  if (options.browser) return playwright;
  return process.env.USE_JUDGE0 ? judge0 : wandbox;
}

/** Code execution is compute-heavy and paid; cap a learner's runs per UTC day. */
export const MAX_CODE_RUNS_PER_DAY = 100;

/**
 * Throw when the learner has spent their daily runs. Counted across the whole
 * `code_runs` table, so lesson labs, note labs and the standalone simulator all
 * draw down one shared allowance.
 */
export async function assertCodeRunQuota(
  service: SupabaseClient,
  userId: string,
): Promise<void> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { count } = await service
    .from("code_runs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfDay.toISOString());
  if ((count ?? 0) >= MAX_CODE_RUNS_PER_DAY) {
    throw new Error(`Daily code-run limit reached (${MAX_CODE_RUNS_PER_DAY}). Try again tomorrow.`);
  }
}
