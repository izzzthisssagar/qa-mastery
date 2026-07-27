import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { CURRICULUM_CACHE_TAG } from "@/lib/curriculum-cache";

// Called by `curriculum sync --apply` (scripts/notify-curriculum-update.mjs)
// after publishing content changes, so the `curriculum`-tagged unstable_cache
// entries (lib/curriculum-cache.ts) bust immediately instead of serving stale
// notes until the next deploy. Never cached itself.
export const dynamic = "force-dynamic";

/** Hash both sides to a fixed-length digest before comparing, so neither an
 *  early length-mismatch return nor a byte-by-byte scan on the raw secret
 *  can leak timing information about it. */
function constantTimeEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.CURRICULUM_REVALIDATE_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/, "") ?? "";

  if (!secret || !provided || !constantTimeEqual(provided, secret)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  revalidateTag(CURRICULUM_CACHE_TAG, { expire: 0 });
  return NextResponse.json({ revalidated: true });
}
