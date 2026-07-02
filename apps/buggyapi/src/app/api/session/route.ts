import { NextResponse } from "next/server";
import { verifyHandoffToken, mintSessionToken } from "@qa-mastery/shared";
import { createServiceClient } from "@qa-mastery/db";

/**
 * Handoff-token → session-token exchange (BuggyAPI flavor).
 *
 * Same shape as BuggyShop's /api/session, plus: the response carries the
 * learner's sandbox credentials (seed API key + fake users) so the landing
 * page can show them — an API practice app is useless without something to
 * paste into curl/Postman. Service-role read from a deny-all schema; the
 * handoff token is the proof this caller owns the sandbox.
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

    const claims = await verifyHandoffToken(token, secret, "buggyapi");
    const sessionToken = await mintSessionToken(claims, secret, "buggyapi");

    const service = createServiceClient().schema("buggyapi");

    // Provision on first entry: seed rows exist iff the sandbox was reset before.
    const { data: seedUsers } = await service
      .from("ba_users")
      .select("name, email, password, role")
      .eq("sandbox_id", claims.sandboxId)
      .eq("is_seed", true);

    if (!seedUsers || seedUsers.length === 0) {
      const { error: provisionError } = await service.rpc("provision_buggyapi_sandbox", {
        p_sandbox_id: claims.sandboxId,
      });
      if (provisionError) {
        return NextResponse.json(
          { error: `Sandbox provisioning failed: ${provisionError.message}` },
          { status: 500 },
        );
      }
    }

    // The handoff's mode claim decides whether seeded bugs fire (clean is the
    // default; the platform's bug-hunt launch mints mode=bughunt).
    await service
      .from("ba_sandbox_state")
      .upsert(
        { sandbox_id: claims.sandboxId, mode: claims.mode ?? "clean" },
        { onConflict: "sandbox_id" },
      );

    const [{ data: users }, { data: keys }, { data: oauthClients }] = await Promise.all([
      service
        .from("ba_users")
        .select("name, email, password, role")
        .eq("sandbox_id", claims.sandboxId)
        .eq("is_seed", true),
      service
        .from("ba_api_keys")
        .select("key")
        .eq("sandbox_id", claims.sandboxId)
        .eq("is_seed", true)
        .eq("revoked", false)
        .limit(1),
      service
        .from("ba_oauth_clients")
        .select("client_id, client_secret, redirect_uri")
        .eq("sandbox_id", claims.sandboxId)
        .eq("is_seed", true)
        .limit(1),
    ]);

    return NextResponse.json({
      sessionToken,
      sandboxId: claims.sandboxId,
      apiKey: keys?.[0]?.key ?? null,
      users: users ?? [],
      oauthClient: oauthClients?.[0] ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired handoff token" },
      { status: 401 },
    );
  }
}
