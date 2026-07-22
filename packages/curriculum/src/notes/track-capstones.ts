/**
 * Track-level capstones — the one graded artifact that closes out an entire
 * TRACK rather than a chapter. `labs.ts` is deliberately chapter-scoped (one
 * lab per "module/chapter"), and a capstone that synthesizes an entire track
 * doesn't have a single chapter it's "about" — it needs an anchor point to
 * render at, not a topic to grade. `chapterSlug` here is that anchor: the last
 * chapter of the track's last module, the same "renders after the last
 * file-backed topic" position a chapter lab uses (see notes/[module]/[chapter]/
 * [topic]/page.tsx), reused for anchoring rather than topic-gating.
 *
 * Grading is NOT the code_run/bug_report NoteLab pipeline — it's the same
 * free-form rubric (scope/risks/approach/ship-call) `gradeCapstone()` in
 * @qa-mastery/grading already used by the legacy lesson capstone, now keyed by
 * `note_slug` (migration 0033) instead of `lesson_id`.
 */

export interface NoteTrackCapstone {
  trackSlug: string;
  /** "module/chapter" — the anchor this renders after and the note_slug key. */
  chapterSlug: string;
  title: string;
  brief: string;
}

export const NOTE_TRACK_CAPSTONES: readonly NoteTrackCapstone[] = [
  {
    trackSlug: "manual-qa",
    chapterSlug: "ui-ux-design-qa/usability-evaluation",
    title: "Capstone — Full Test Cycle on BuggyShop",
    brief:
      "Everything in this track converges here. BuggyShop is shipping a new coupon feature and you own the release: a mini test plan, cases that cover the requirements using the techniques from this track, an executed run, real bug reports, and a summary with a ship / no-ship call a release manager could act on.",
  },
];

/** The track capstone anchored at this chapter, if there is one. */
export function trackCapstoneForChapter(chapterSlug: string): NoteTrackCapstone | undefined {
  return NOTE_TRACK_CAPSTONES.find((c) => c.chapterSlug === chapterSlug);
}
