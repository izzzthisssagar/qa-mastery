import "server-only";

import {
  chat,
  computeBrainStage,
  isNewActiveDay,
  pruneMemoriesByCap,
  type TopicMasteryMap,
} from "@qa-mastery/agent";
import { createServiceClient } from "@qa-mastery/db";
import type { HelpAgentProfile } from "./types";
import { MESSAGE_RETENTION_DAYS, MEMORY_CAP } from "./types";

export async function touchProfileOnMessage(userId: string): Promise<HelpAgentProfile> {
  const service = createServiceClient();
  const now = new Date().toISOString();

  const { data: existing } = await service
    .from("help_agent_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<HelpAgentProfile>();

  if (!existing) {
    const row = {
      user_id: userId,
      first_active_at: now,
      last_active_at: now,
      brain_day_count: 1,
      brain_stage: computeBrainStage(1),
      total_messages: 1,
      profile_updated_at: now,
    };
    const { data, error } = await service
      .from("help_agent_profiles")
      .insert(row)
      .select("*")
      .single<HelpAgentProfile>();
    if (error) throw new Error(error.message);
    return data;
  }

  const newDay = isNewActiveDay(existing.last_active_at);
  const brainDayCount = newDay ? existing.brain_day_count + 1 : existing.brain_day_count;

  const { data, error } = await service
    .from("help_agent_profiles")
    .update({
      last_active_at: now,
      brain_day_count: brainDayCount,
      brain_stage: computeBrainStage(brainDayCount),
      total_messages: existing.total_messages + 1,
      profile_updated_at: now,
    })
    .eq("user_id", userId)
    .select("*")
    .single<HelpAgentProfile>();

  if (error) throw new Error(error.message);
  return data;
}

export async function persistMessage(input: {
  userId: string;
  role: "user" | "assistant";
  content: string;
  pathname: string | null;
  lessonSlug: string | null;
  sessionId: string;
}): Promise<void> {
  const service = createServiceClient();
  const { error } = await service.from("help_agent_messages").insert({
    user_id: input.userId,
    role: input.role,
    content: input.content,
    pathname: input.pathname,
    lesson_slug: input.lessonSlug,
    session_id: input.sessionId,
  });
  if (error) throw new Error(error.message);
}

export async function consolidateBrain(
  userId: string,
  sessionId?: string,
): Promise<void> {
  const service = createServiceClient();
  const now = new Date();

  const { data: profile } = await service
    .from("help_agent_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<HelpAgentProfile>();

  if (!profile) return;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 1);

  let msgQuery = service
    .from("help_agent_messages")
    .select("role, content, lesson_slug, created_at")
    .eq("user_id", userId)
    .gte("created_at", cutoff.toISOString())
    .order("created_at", { ascending: true });

  if (sessionId) {
    msgQuery = msgQuery.eq("session_id", sessionId);
  }

  const { data: messages } = await msgQuery;
  const { data: quizFails } = await service
    .from("quiz_attempts")
    .select("passed, lessons!inner(slug, title)")
    .eq("user_id", userId)
    .eq("passed", false)
    .gte("created_at", cutoff.toISOString());

  const weakTopics = new Set(profile.weak_topics);
  const stuckLessons = new Set(profile.stuck_lessons);
  const topicMastery = { ...profile.topic_mastery } as TopicMasteryMap;

  for (const row of quizFails ?? []) {
    const lesson = row.lessons as unknown as { slug: string; title: string };
    weakTopics.add(lesson.title);
    stuckLessons.add(lesson.slug);
    const existing = topicMastery[lesson.slug];
    topicMastery[lesson.slug] = {
      level: "struggling",
      last_seen: now.toISOString().slice(0, 10),
      failures: (existing?.failures ?? 0) + 1,
    };
  }

  const sessionMsgs = messages ?? [];
  const lessonSlug = sessionMsgs.find((m) => m.lesson_slug)?.lesson_slug ?? null;
  if (lessonSlug && sessionMsgs.filter((m) => m.role === "user").length >= 3) {
    weakTopics.add(lessonSlug);
    await service.from("help_agent_memories").insert({
      user_id: userId,
      kind: "confusion",
      content: `Asked for help multiple times on ${lessonSlug}`,
      lesson_slug: lessonSlug,
      importance: 6,
    });
  }

  let summary = profile.summary;
  let hintPreference = profile.hint_preference;

  if (sessionMsgs.length > 0) {
    try {
      const transcript = sessionMsgs.map((m) => `${m.role}: ${m.content}`).join("\n");
      const llmSummary = await chat([
        {
          role: "system",
          content:
            "Summarize this learner tutoring session in 2-3 sentences. Note what they struggled with and what improved. Output plain text only.",
        },
        { role: "user", content: transcript },
      ]);
      summary = mergeSummaries(profile.summary, llmSummary);
      if (sessionMsgs.filter((m) => m.role === "user").length >= 4) {
        hintPreference = "direct";
      }
    } catch {
      // Rule-based fallback when LLM unavailable
      if (lessonSlug) {
        summary = profile.summary || `Working on ${lessonSlug}.`;
      }
    }
  }

  await service
    .from("help_agent_profiles")
    .update({
      summary,
      weak_topics: [...weakTopics],
      stuck_lessons: [...stuckLessons],
      topic_mastery: topicMastery,
      hint_preference: hintPreference,
      last_consolidated_at: now.toISOString(),
      profile_updated_at: now.toISOString(),
    })
    .eq("user_id", userId);

  await pruneOldMessages(userId);
  await capMemories(userId);
}

async function pruneOldMessages(userId: string): Promise<void> {
  const service = createServiceClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - MESSAGE_RETENTION_DAYS);

  await service
    .from("help_agent_messages")
    .delete()
    .eq("user_id", userId)
    .lt("created_at", cutoff.toISOString());
}

async function capMemories(userId: string): Promise<void> {
  const service = createServiceClient();
  const { data: memories } = await service
    .from("help_agent_memories")
    .select("id, importance, created_at")
    .eq("user_id", userId);

  if (!memories || memories.length <= MEMORY_CAP) return;

  const kept = pruneMemoriesByCap(memories, MEMORY_CAP);
  const keptIds = new Set(kept.map((m) => m.id));
  const toDelete = memories.filter((m) => !keptIds.has(m.id)).map((m) => m.id);

  if (toDelete.length > 0) {
    await service.from("help_agent_memories").delete().in("id", toDelete);
  }
}

function mergeSummaries(previous: string, latest: string): string {
  if (!previous) return latest.trim();
  return `${previous.trim()}\n\nRecent: ${latest.trim()}`.slice(0, 2000);
}

export async function consolidateAllActiveBrains(): Promise<number> {
  const service = createServiceClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 1);

  const { data: profiles } = await service
    .from("help_agent_profiles")
    .select("user_id")
    .gte("last_active_at", cutoff.toISOString());

  let count = 0;
  for (const row of profiles ?? []) {
    await consolidateBrain(row.user_id);
    count++;
  }
  return count;
}
