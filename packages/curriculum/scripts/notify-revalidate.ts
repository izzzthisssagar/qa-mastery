/**
 * POSTs changed lesson slugs to the running app's revalidate route
 * (`apps/platform/src/app/api/internal/revalidate-lesson/route.ts`) so each
 * `lesson:${slug}` `unstable_cache` entry busts immediately after
 * `curriculum sync --apply` publishes a content change, instead of waiting
 * for the next deploy.
 *
 * No-ops (returns `{ skipped: true }`) if the revalidation URL/secret aren't
 * configured — mirrors the "inert until configured" guard used for the
 * staging deploy job (`.github/workflows/deploy-staging.yml`), so local/CI
 * runs of `sync --apply` without a deployed target never fail.
 */
export interface NotifyRevalidateEnv {
  url?: string;
  secret?: string;
}

export type NotifyRevalidateResult =
  | { skipped: true }
  | { skipped: false; ok: boolean; status: number };

export async function notifyRevalidate(
  slugs: string[],
  env: NotifyRevalidateEnv = {
    url: process.env.CURRICULUM_REVALIDATE_URL,
    secret: process.env.CURRICULUM_REVALIDATE_SECRET,
  },
): Promise<NotifyRevalidateResult> {
  if (slugs.length === 0) return { skipped: false, ok: true, status: 200 };
  if (!env.url || !env.secret) return { skipped: true };

  const response = await fetch(env.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.secret}`,
    },
    body: JSON.stringify({ slugs }),
  });
  return { skipped: false, ok: response.ok, status: response.status };
}
