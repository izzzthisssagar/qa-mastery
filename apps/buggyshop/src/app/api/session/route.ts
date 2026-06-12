import { NextResponse } from "next/server";

/**
 * Handoff-token → session-token exchange.
 * M1 implements: verifyHandoffToken (@qa-mastery/shared) → mintSessionToken,
 * once the sandboxes table + provision_sandbox() RPC exist.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Sandbox sessions are not live yet — the exchange ships with the first lab (M1).",
    },
    { status: 501 },
  );
}
