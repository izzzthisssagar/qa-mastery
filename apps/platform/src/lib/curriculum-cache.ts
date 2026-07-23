import "server-only";

import { unstable_cache } from "next/cache";
import {
  findLessonBySlug as findLessonBySlugUncached,
  loadLessonBody as loadLessonBodyUncached,
  loadQuiz as loadQuizUncached,
  type LessonSource,
  type QuizFile,
} from "@qa-mastery/curriculum";

/**
 * Lesson-content reads (MDX body, quiz JSON) are immutable once published
 * (invariant 5 — slugs never change, content only replaced via
 * `curriculum sync --apply`), so wrap them in `unstable_cache` tagged
 * `lesson:${slug}`: each lesson is read from disk once per deploy instead of
 * once per request. The route handler at
 * `app/api/internal/revalidate-lesson/route.ts` busts this tag on-demand when
 * `curriculum sync --apply` publishes a content change (see
 * `packages/curriculum/scripts/notify-revalidate.ts`). Policy: docs/10-caching.md.
 */

export function findLessonBySlug(slug: string): Promise<LessonSource | null> {
  return unstable_cache(
    async (s: string) => findLessonBySlugUncached(s),
    ["curriculum-cache", "findLessonBySlug"],
    { tags: [`lesson:${slug}`] },
  )(slug);
}

export function loadLessonBody(slug: string): Promise<string> {
  return unstable_cache(
    async (s: string) => loadLessonBodyUncached(s),
    ["curriculum-cache", "loadLessonBody"],
    { tags: [`lesson:${slug}`] },
  )(slug);
}

export function loadQuiz(slug: string): Promise<QuizFile> {
  return unstable_cache(
    async (s: string) => loadQuizUncached(s),
    ["curriculum-cache", "loadQuiz"],
    { tags: [`lesson:${slug}`] },
  )(slug);
}
