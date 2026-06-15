import { NextResponse } from "next/server";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { createServiceClient } from "@qa-mastery/db";

// Use sandbox environment by default for dev/testing
const paddle = new Paddle(process.env.PADDLE_API_KEY || "mock-key", {
  environment: Environment.sandbox, 
});

export async function POST(req: Request) {
  const signature = req.headers.get("paddle-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  const secret = process.env.PADDLE_WEBHOOK_SECRET;

  if (!secret) {
    console.error("Missing PADDLE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  try {
    const eventData = await paddle.webhooks.unmarshal(rawBody, secret, signature);

    // We only care about completed transactions for Pro upgrades
    if (eventData.eventType === "transaction.completed") {
      // Paddle's customData is loosely typed and deeply nested; narrow to the
      // one field we set when creating the transaction.
      const transaction = eventData.data as { customData?: { userId?: unknown } };
      const userId = transaction.customData?.userId;

      if (userId && typeof userId === "string") {
        const service = createServiceClient();
        const { error } = await service
          .from("entitlements")
          .upsert({ user_id: userId, kind: "pro" }, { onConflict: "user_id,kind" });

        if (error) {
          console.error("Failed to grant entitlement:", error.message);
          return NextResponse.json({ error: "Database error" }, { status: 500 });
        }
      } else {
        console.warn("Transaction completed without customData.userId");
      }
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("Webhook signature verification failed:", e);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }
}
