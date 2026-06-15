import type { BrainStage } from "@qa-mastery/agent";
import type { TopicMasteryMap } from "@qa-mastery/agent";

export interface HelpAgentProfile {
  user_id: string;
  summary: string;
  weak_topics: string[];
  strong_topics: string[];
  topic_mastery: TopicMasteryMap;
  hint_preference: "socratic" | "direct" | "hybrid";
  stuck_lessons: string[];
  brain_stage: BrainStage;
  brain_day_count: number;
  first_active_at: string | null;
  last_active_at: string | null;
  last_consolidated_at: string | null;
  total_messages: number;
  total_sessions: number;
  profile_updated_at: string;
}

export interface HelpAgentMemory {
  id: string;
  kind: "breakthrough" | "confusion" | "preference" | "milestone";
  content: string;
  lesson_slug: string | null;
  importance: number;
  created_at: string;
}

export interface HelpAgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  pathname: string | null;
  lesson_slug: string | null;
  session_id: string;
  created_at: string;
}

export const DAILY_MESSAGE_LIMIT = 30;
export const MESSAGE_RETENTION_DAYS = 7;
export const MEMORY_CAP = 50;

export function parseLessonSlug(pathname: string | null | undefined): string | null {
  if (!pathname) return null;
  const match = pathname.match(/^\/learn\/([^/]+)/);
  return match?.[1] ?? null;
}

export function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[…truncated]`;
}
