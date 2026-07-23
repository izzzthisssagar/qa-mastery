import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

// Called by `curriculum sync --apply` (packages/curriculum/scripts/notify-revalidate.ts)
// after publishing changed lessons to the DB registry, so each `lesson:${slug}`
// unstable_cache entry (apps/platform/src/lib/curriculum-cache.ts) busts
// immediately instead of serving stale content until the next deploy.
export async function POST(request: Request) {
  const secret = process.env.CURRICULUM_REVALIDATE_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { slugs?: unknown } | null;
  const slugs = Array.isArray(body?.slugs)
    ? body.slugs.filter((s): s is string => typeof s === "string")
    : [];
  if (slugs.length === 0) {
    return NextResponse.json(
      { error: "slugs must be a non-empty string array" },
      { status: 400 },
    );
  }

  for (const slug of slugs) {
    revalidateTag(`lesson:${slug}`, { expire: 0 });
  }

  return NextResponse.json({ revalidated: slugs });
}
