import "server-only";

import { findLessonBySlug } from "@qa-mastery/curriculum";
import { DEFAULT_RELEASE, isRelease, type Release } from "@qa-mastery/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LessonRegistryRow } from "../action-types";

/** Look up a published lesson by slug. Everything is free — the platform has no
 *  paywall — so the only gate is that the lesson exists and is published. */
export async function requireAccessibleLesson(
  service: SupabaseClient,
  slug: string,
): Promise<LessonRegistryRow> {
  const { data, error } = await service
    .from("lessons")
    .select("id, free, status")
    .eq("slug", slug)
    .maybeSingle<LessonRegistryRow>();
  if (error) throw new Error(error.message);
  if (!data || data.status !== "published") throw new Error("Lesson not available");
  return data;
}

/** The release this lesson's lab grades against — from its frontmatter, server
 *  side, so the client can't aim grading at a release where the bug is fixed. */
export function lessonRelease(slug: string): Release {
  const source = findLessonBySlug(slug);
  const declared = source?.frontmatter.requires_release;
  return declared && isRelease(declared) ? declared : DEFAULT_RELEASE;
}
