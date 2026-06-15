import "server-only";

import { createServiceClient } from "@qa-mastery/db";
import { DAILY_MESSAGE_LIMIT } from "./types";

export async function countMessagesToday(userId: string): Promise<number> {
  const service = createServiceClient();
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { count, error } = await service
    .from("help_agent_messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", startOfDay.toISOString());

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function assertWithinRateLimit(userId: string): Promise<void> {
  const count = await countMessagesToday(userId);
  if (count >= DAILY_MESSAGE_LIMIT) {
    throw new Error(`Daily limit reached (${DAILY_MESSAGE_LIMIT} messages). Try again tomorrow.`);
  }
}
