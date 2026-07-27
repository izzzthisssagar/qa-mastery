#!/usr/bin/env node
// Notifies the running platform app to invalidate its curriculum cache after
// `curriculum sync --apply` publishes content changes (POSTs to
// /api/revalidate-curriculum, apps/platform/src/lib/curriculum-cache.ts).
// The sync script only calls this when both env vars are configured; if
// invoked directly without them, this fails closed (exits non-zero) instead
// of silently reporting success for a no-op, so a misconfigured publish step
// cannot look green. See docs/superpowers/plans/
// 2026-07-26-release-repository-governance.md Task 8.

export async function notifyCurriculumUpdate({ url, secret, fetchImpl = fetch } = {}) {
  if (!url || !secret) {
    throw new Error(
      "CURRICULUM_REVALIDATE_URL and CURRICULUM_REVALIDATE_SECRET must both be set -- refusing to report success for a no-op.",
    );
  }

  const response = await fetchImpl(url, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });

  if (!response.ok) {
    throw new Error(`Curriculum revalidation failed: ${response.status} ${response.statusText}`);
  }
}

async function main() {
  try {
    await notifyCurriculumUpdate({
      url: process.env.CURRICULUM_REVALIDATE_URL,
      secret: process.env.CURRICULUM_REVALIDATE_SECRET,
    });
    console.log("notify-curriculum-update: OK");
  } catch (err) {
    console.error(`notify-curriculum-update: ${err.message}`);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
