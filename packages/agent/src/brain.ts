export type BrainStage = "new" | "learning" | "patterns" | "mentor";
export type TopicLevel = "introduced" | "practicing" | "struggling" | "improving" | "mastered";

export interface TopicMasteryEntry {
  level: TopicLevel;
  last_seen: string;
  failures: number;
}

export type TopicMasteryMap = Record<string, TopicMasteryEntry>;

export function computeBrainStage(dayCount: number): BrainStage {
  if (dayCount <= 1) return "new";
  if (dayCount <= 7) return "learning";
  if (dayCount <= 30) return "patterns";
  return "mentor";
}

export function brainStageLabel(stage: BrainStage): string {
  switch (stage) {
    case "new":
      return "New tutor";
    case "learning":
      return "Learning you";
    case "patterns":
      return "Knows your patterns";
    case "mentor":
      return "Your QA mentor";
  }
}

export function isNewActiveDay(lastActiveAt: string | null, now = new Date()): boolean {
  if (!lastActiveAt) return true;
  const last = new Date(lastActiveAt);
  return (
    last.getUTCFullYear() !== now.getUTCFullYear() ||
    last.getUTCMonth() !== now.getUTCMonth() ||
    last.getUTCDate() !== now.getUTCDate()
  );
}

export function updateTopicMasteryOnQuiz(
  map: TopicMasteryMap,
  slug: string,
  passed: boolean,
  now = new Date(),
): TopicMasteryMap {
  const existing = map[slug];
  const today = now.toISOString().slice(0, 10);
  if (passed) {
    return {
      ...map,
      [slug]: {
        level: "mastered",
        last_seen: today,
        failures: existing?.failures ?? 0,
      },
    };
  }
  const failures = (existing?.failures ?? 0) + 1;
  return {
    ...map,
    [slug]: {
      level: failures >= 2 ? "struggling" : "improving",
      last_seen: today,
      failures,
    },
  };
}

export function pruneMemoriesByCap<T extends { importance: number; created_at: string }>(
  memories: T[],
  cap = 50,
): T[] {
  if (memories.length <= cap) return memories;
  return [...memories]
    .sort((a, b) => {
      if (b.importance !== a.importance) return b.importance - a.importance;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, cap);
}
