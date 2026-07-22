-- 0033 — The graded capstone moves onto the notes spine too.
--
-- Same shape as 0030 (code_runs/bug_reports): `lesson_id` was the only key
-- because the capstone used to live inside a track-a lesson. It now closes out
-- the whole Manual QA track instead of one lesson, so it needs a `note_slug`
-- key the same way a chapter lab does — here that slug is the "module/chapter"
-- of the track's LAST chapter (ui-ux-design-qa/usability-evaluation), which is
-- where a learner who finished the track actually lands. `gradeCapstone()`
-- itself (packages/grading/src/capstone.ts) is untouched — same rubric, new key.
--
-- lesson_id was NOT NULL before this (0007) — relax it the same way 0025/0026
-- already relaxed code_runs/bug_reports, so this stays purely additive.

alter table public.capstone_submissions
  alter column lesson_id drop not null;

alter table public.capstone_submissions
  add column note_slug text
  check (
    note_slug is null
    or (note_slug = lower(note_slug) and char_length(note_slug) between 3 and 160)
  );

-- One owner per submission — a lesson capstone or a track capstone, never
-- both, so progress can't double-credit.
alter table public.capstone_submissions
  add constraint capstone_submissions_single_owner
  check ((lesson_id is null) or (note_slug is null));

-- Mirrors 0008's per-lesson uniqueness for the note-keyed path: one submission
-- per learner per track capstone, upserted on resubmission. A plain (not
-- partial) unique constraint is required here, not just an index restricted
-- to `where note_slug is not null` — Postgres's ON CONFLICT column-list
-- inference cannot target a partial index unless the query also repeats its
-- predicate, and supabase-js's `.upsert({ onConflict: "user_id,note_slug" })`
-- has no way to do that. A plain unique constraint still allows unlimited
-- lesson-keyed rows (note_slug null) for the same user, since SQL never
-- treats two NULLs as equal — no partial predicate needed for that either.
alter table public.capstone_submissions
  add constraint capstone_submissions_user_note_slug_key unique (user_id, note_slug);
