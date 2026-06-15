import { NextResponse } from "next/server";
import { verifyHandoffToken, mintSessionToken } from "@qa-mastery/shared";

/**
 * Handoff-token → session-token exchange.
 */
export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "Missing handoff token" }, { status: 400 });
    }

    const secret = process.env.SANDBOX_JWT_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Server misconfigured: missing secret" }, { status: 500 });
    }

    const claims = await verifyHandoffToken(token, secret);
    const sessionToken = await mintSessionToken(claims, secret);

    return NextResponse.json({ sessionToken });
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired handoff token" },
      { status: 401 }
    );
  }
}
