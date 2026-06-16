import "server-only";

import { embedQuery } from "@qa-mastery/agent";
import { findLessonBySlug, loadLessonBody, loadQuiz } from "@qa-mastery/curriculum";
import { createServiceClient } from "@qa-mastery/db";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { HelpAgentMemory, HelpAgentMessage, HelpAgentProfile } from "./types";
import { parseLessonSlug, truncateText } from "./types";

interface BuildContextInput {
  userId: string;
  pathname: string | null;
  assistantTurn: number;
  /** The learner's current question — drives RAG retrieval across all lessons. */
  message?: string;
}

export async function buildAgentContext(input: BuildContextInput): Promise<{
  contextBlock: string;
  lessonSlug: string | null;
  profile: HelpAgentProfile | null;
}> {
  const service = createServiceClient();
  const lessonSlug = parseLessonSlug(input.pathname);

  const [profile, memories, recentMessages, lessonBlock, retrieved] = await Promise.all([
    loadProfile(service, input.userId),
    loadMemories(service, input.userId, lessonSlug),
    loadRecentMessages(service, input.userId),
    lessonSlug ? loadLessonBlock(service, input.userId, lessonSlug, input.assistantTurn) : null,
    loadRetrievedChunks(service, input.message),
  ]);

  const parts: string[] = [];

  if (retrieved.length > 0) {
    parts.push(
      "Relevant curriculum (retrieved by similarity to the question — ground your answer in this and cite the lesson; do NOT reveal quiz answers):",
      ...retrieved.map((c) => `- ${c}`),
    );
  }

  if (profile) {
    parts.push(
      `Learner summary: ${profile.summary || "No summary yet."}`,
      `Topic mastery: ${JSON.stringify(profile.topic_mastery)}`,
      `Stuck lessons: ${profile.stuck_lessons.join(", ") || "none"}`,
    );
  }

  if (memories.length > 0) {
    parts.push(
      "Episodic memories:",
      ...memories.map((m) => `- [${m.kind}] ${m.content}`),
    );
  }

  if (recentMessages.length > 0) {
    parts.push(
      "Recent chat (last 7 days):",
      ...recentMessages.map((m) => `${m.role}: ${m.content}`),
    );
  }

  if (lessonBlock) {
    parts.push("Current lesson:", lessonBlock);
  } else if (input.pathname) {
    parts.push(`Current page: ${input.pathname}`);
    const progressSummary = await loadProgressSummary(service, input.userId);
    if (progressSummary) parts.push(progressSummary);
  }

  return {
    contextBlock: parts.join("\n\n"),
    lessonSlug,
    profile,
  };
}

interface RetrievedChunk {
  title: string;
  lesson_slug: string;
  content: string;
  similarity: number;
}

/**
 * RAG: embed the learner's question and pull the most relevant lesson chunks
 * across the whole curriculum. Best-effort — if embeddings are unavailable (no
 * Gemini key / quota), return nothing and let the tutor answer from the
 * current-lesson context + memory instead of failing.
 */
async function loadRetrievedChunks(
  service: SupabaseClient,
  message: string | undefined,
): Promise<string[]> {
  if (!message || message.trim().length < 3) return [];
  try {
    const queryEmbedding = await embedQuery(message);
    const { data, error } = await service.rpc("match_lesson_chunks", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_count: 6,
      min_similarity: 0.45,
    });
    if (error || !data) return [];
    return (data as RetrievedChunk[]).map(
      (r) => `[${r.title} · ${r.lesson_slug}] ${r.content}`,
    );
  } catch (err) {
    console.error("RAG retrieval skipped:", (err as Error).message);
    return [];
  }
}

async function loadProfile(
  service: SupabaseClient,
  userId: string,
): Promise<HelpAgentProfile | null> {
  const { data } = await service
    .from("help_agent_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<HelpAgentProfile>();
  return data;
}

async function loadMemories(
  service: SupabaseClient,
  userId: string,
  lessonSlug: string | null,
): Promise<HelpAgentMemory[]> {
  let query = service
    .from("help_agent_memories")
    .select("id, kind, content, lesson_slug, importance, created_at")
    .eq("user_id", userId)
    .order("importance", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5);

  if (lessonSlug) {
    query = query.or(`lesson_slug.eq.${lessonSlug},lesson_slug.is.null`);
  }

  const { data } = await query;
  return (data ?? []) as HelpAgentMemory[];
}

async function loadRecentMessages(
  service: SupabaseClient,
  userId: string,
): Promise<HelpAgentMessage[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const { data } = await service
    .from("help_agent_messages")
    .select("id, role, content, pathname, lesson_slug, session_id, created_at")
    .eq("user_id", userId)
    .gte("created_at", cutoff.toISOString())
    .order("created_at", { ascending: false })
    .limit(10);

  return ((data ?? []) as HelpAgentMessage[]).reverse();
}

async function loadLessonBlock(
  service: SupabaseClient,
  userId: string,
  slug: string,
  assistantTurn: number,
): Promise<string | null> {
  const lesson = findLessonBySlug(slug);
  if (!lesson) return null;

  const body = truncateText(loadLessonBody(slug), 12000);
  const quiz = loadQuiz(slug);
  const publicQuiz = quiz.questions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    options: q.options,
  }));

  const lessonId = await lessonIdForSlug(service, slug);

  const progressRow = lessonId
    ? await service
        .from("progress")
        .select("step_state, status")
        .eq("user_id", userId)
        .eq("lesson_id", lessonId)
        .maybeSingle<{ step_state: Record<string, boolean>; status: string }>()
    : { data: null };

  const block = [
    `Lesson: ${lesson.frontmatter.title} (${slug})`,
    `Track/module: ${lesson.frontmatter.track}/${lesson.frontmatter.module}`,
    `Lab type: ${lesson.frontmatter.lab_type}`,
    `Progress: ${JSON.stringify(progressRow.data?.step_state ?? {})}`,
    `Lesson content:\n${body}`,
    `Quiz questions (no answers): ${JSON.stringify(publicQuiz)}`,
  ];

  if (assistantTurn >= 2) {
    const explanations = await loadQuizExplanations(service, userId, slug);
    if (explanations) {
      block.push(`Prior quiz feedback (explanations only): ${explanations}`);
    }
  }

  return block.join("\n\n");
}

async function lessonIdForSlug(
  service: SupabaseClient,
  slug: string,
): Promise<string | null> {
  const { data } = await service
    .from("lessons")
    .select("id")
    .eq("slug", slug)
    .maybeSingle<{ id: string }>();
  return data?.id ?? null;
}

async function loadQuizExplanations(
  service: SupabaseClient,
  userId: string,
  slug: string,
): Promise<string | null> {
  const lessonId = await lessonIdForSlug(service, slug);
  if (!lessonId) return null;

  const { data: attempt } = await service
    .from("quiz_attempts")
    .select("answers")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ answers: Record<string, unknown> }>();

  if (!attempt) return null;

  const quiz = loadQuiz(slug);
  const explained = quiz.questions
    .filter((q) => q.explanation)
    .map((q) => `${q.prompt}: ${q.explanation}`)
    .join("; ");

  return explained || null;
}

async function loadProgressSummary(
  service: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: rows } = await service
    .from("progress")
    .select("status, step_state, lessons!inner(slug, title)")
    .eq("user_id", userId)
    .limit(10);

  if (!rows?.length) return null;

  const items = rows.map((r) => {
    const lesson = r.lessons as unknown as { slug: string; title: string };
    return `${lesson.title} (${lesson.slug}): ${r.status}, steps=${JSON.stringify(r.step_state)}`;
  });

  return `Recent progress:\n${items.join("\n")}`;
}
