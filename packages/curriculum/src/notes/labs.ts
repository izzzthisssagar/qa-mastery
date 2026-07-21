/**
 * Graded labs on the notes spine — the single source of truth for which
 * CHAPTER closes out with an assessed exercise.
 *
 * Why a registry in code rather than note frontmatter: a lab belongs to a
 * chapter, but MDX frontmatter can only describe the topic file it sits in, and
 * the taxonomy (`taxonomy.ts`) has no lab field. Declaring labs here keeps the
 * blast radius at one file instead of 876, and mirrors how `tracks.ts` already
 * layers curation on top of the raw tree.
 *
 * Not every chapter earns a lab. A chapter is a lab candidate only when DOING
 * beats reading — writing a loop, a locator, a query, a bug report. Conceptual
 * chapters stay note-and-XP only, and `note-labs.test.ts` asserts only that
 * every declared lab points at a real chapter, never that coverage is total.
 */

import type { LabCheck } from "@qa-mastery/grading";
import { NOTES_TAXONOMY } from "./taxonomy";

/**
 * How a lab is assessed.
 *   code_run    — learner writes code, we run it and assert on the output.
 *   bug_report  — learner hunts a seeded bug in a practice app and files it.
 *   test_design — learner authors test cases; graded on count + coverage.
 */
export type NoteLabKind = "code_run" | "bug_report" | "test_design";

export interface NoteLab {
  /**
   * "module/chapter" from the taxonomy — the lab's stable id and the value
   * written to `code_runs.note_slug` / `bug_reports.note_slug`. Immutable once
   * shipped, same rule as note slugs.
   */
  chapterSlug: string;
  title: string;
  /** One or two sentences: what to build, and what "done" looks like. */
  brief: string;
  kind: NoteLabKind;
  /** XP awarded on the first pass. Labs are worth more than a note read. */
  xp: number;

  // ── code_run only ────────────────────────────────────────────────────────
  /** Language id from SIMULATOR_LANGUAGES. */
  language?: string;
  /** Pre-filled editor content — a skeleton with the work left undone. */
  starter?: string;
  /** Assertions over the run. Empty means "clean exit is enough" (avoid). */
  checks?: readonly LabCheck[];

  // ── bug_report / test_design only ────────────────────────────────────────
  /** Which practice app hosts the hunt. */
  target?: "buggyshop" | "buggyapi";
  /** How many valid bug reports / test cases are required to pass. */
  minValidBugs?: number;
  minTestCases?: number;
}

/**
 * The lab set. Seeded with the Phase B vertical slice; the curated ~60 land in
 * Phase C. Ordered by track, then by where the chapter sits in the spine.
 */
export const NOTE_LABS: readonly NoteLab[] = [
  {
    chapterSlug: "logic-and-control-flow/loops",
    title: "Loop the failing test names",
    brief:
      "You have a list of test results. Print only the names of the tests that failed, one per line, in the order they appear. Use a loop — hardcoding the two names will not pass.",
    kind: "code_run",
    xp: 40,
    language: "python",
    starter: [
      "results = [",
      '    ("login_valid", "pass"),',
      '    ("login_empty_password", "fail"),',
      '    ("logout", "pass"),',
      '    ("cart_total_rounding", "fail"),',
      "]",
      "",
      "# Print the name of every test whose status is 'fail'.",
      "# One name per line, nothing else.",
    ].join("\n"),
    checks: [
      {
        label: "Prints both failing test names",
        contains: "login_empty_password",
      },
      {
        label: "Prints the second failure too",
        contains: "cart_total_rounding",
      },
      {
        label: "Does not print the passing tests",
        absent: "logout",
      },
      {
        label: "Uses a loop rather than hardcoding",
        sourceContains: "for",
      },
    ],
  },
];

/** Look up the lab that closes out a chapter, if there is one. */
export function labForChapter(chapterSlug: string): NoteLab | undefined {
  return NOTE_LABS.find((lab) => lab.chapterSlug === chapterSlug);
}

/** Every lab in a module, in taxonomy chapter order. */
export function labsForModule(moduleSlug: string): NoteLab[] {
  const mod = NOTES_TAXONOMY.find((m) => m.slug === moduleSlug);
  if (!mod) return [];
  return mod.chapters
    .map((chapter) => labForChapter(`${moduleSlug}/${chapter.slug}`))
    .filter((lab): lab is NoteLab => lab != null);
}

/**
 * Resolve a lab's chapter back to the taxonomy. Returns undefined when the
 * chapter does not exist — the guard the server action uses before letting a
 * submission through, so an unknown note_slug can never reach a runner.
 */
export function chapterForLab(chapterSlug: string):
  | { moduleSlug: string; chapterSlug: string; topicSlugs: string[] }
  | undefined {
  const [moduleSlug, chapter] = chapterSlug.split("/");
  if (!moduleSlug || !chapter) return undefined;

  const mod = NOTES_TAXONOMY.find((m) => m.slug === moduleSlug);
  const found = mod?.chapters.find((c) => c.slug === chapter);
  if (!mod || !found) return undefined;

  return {
    moduleSlug: mod.slug,
    chapterSlug: found.slug,
    // Only file-backed topics gate the lab; planned stubs would deadlock it.
    topicSlugs: found.topics.filter((t) => !t.planned).map((t) => t.slug),
  };
}
