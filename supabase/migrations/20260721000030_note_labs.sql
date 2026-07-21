-- 0030 — Graded labs move into the notes spine.
--
-- Labs used to exist only inside the thin track-a/b lessons, so both graded
-- artifact tables keyed their work by `lesson_id`. The notes wiki is now the
-- graded spine (0029), and a lab hangs off a CHAPTER — "module/chapter" — not
-- off a lesson row. Notes live on the filesystem with no `lessons` FK, so the
-- key is the taxonomy path slug, exactly as `note_progress` does it.
--
-- Both `lesson_id` columns are already nullable (0025 for BuggyAPI reports,
-- 0026 for standalone simulator runs), so this is purely additive: add
-- `note_slug`, and constrain each row to exactly one owner.
--
-- Invariant 2 is untouched. Neither table gains an insert/update policy — the
-- score-bearing writes stay service-role only inside the lab server actions.

alter table public.code_runs
  add column note_slug text
  check (
    note_slug is null
    or (note_slug = lower(note_slug) and char_length(note_slug) between 3 and 160)
  );

alter table public.bug_reports
  add column note_slug text
  check (
    note_slug is null
    or (note_slug = lower(note_slug) and char_length(note_slug) between 3 and 160)
  );

-- A run/report belongs to a lesson lab, a note lab, or neither (a standalone
-- simulator run / a BuggyAPI report) — but never to both at once. Ambiguous
-- ownership would let progress be credited twice.
alter table public.code_runs
  add constraint code_runs_single_owner
  check (lesson_id is null or note_slug is null);

alter table public.bug_reports
  add constraint bug_reports_single_owner
  check (lesson_id is null or note_slug is null);

-- Lab status lookup: "has this learner passed the lab for this chapter?"
create index code_runs_note_slug on public.code_runs (user_id, note_slug)
  where note_slug is not null;

create index bug_reports_note_slug on public.bug_reports (user_id, note_slug)
  where note_slug is not null;
