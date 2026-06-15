import { NextResponse } from "next/server";
import { createServiceClient } from "@qa-mastery/db";

// Public readiness probe for uptime monitors + post-deploy checks. Returns a
// minimal body (no versions, counts, or internals — secops note) and 503 when
// the DB is unreachable. Never cached.
export const dynamic = "force-dynamic";

export async function GET() {
  let db = false;
  try {
    const service = createServiceClient();
    const { error } = await service
      .from("lessons")
      .select("id", { head: true, count: "exact" })
      .limit(1);
    db = !error;
  } catch {
    db = false;
  }

  return NextResponse.json(
    { status: db ? "ok" : "degraded", db: db ? "up" : "down" },
    { status: db ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
