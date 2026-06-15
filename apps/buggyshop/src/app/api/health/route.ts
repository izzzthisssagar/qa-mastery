import { NextResponse } from "next/server";

// Public liveness probe for uptime monitors. BuggyShop's catalog is in-process,
// so liveness (the app responds) is the meaningful signal. Never cached.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
