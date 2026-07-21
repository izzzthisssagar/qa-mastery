-- 0029 — Note progression: real XP + completion for the notes-wiki corpus.
--
-- The 876-note wiki becomes the graded spine (the thin track-a/b lessons
-- retire). Notes live on the filesystem — the taxonomy keys them by a
-- module/chapter/topic slug, with no `lessons` FK — so completion is keyed by
-- that path slug rather than a lesson_id.
--
-- Completing a note awards XP, so like xp_events / user_task_grades this table
-- is service-role WRITE only; learners read-own. The completeNote server action
-- writes both this row and the matching xp_events row under the service role,
-- which structurally preserves the learners-never-write-scores invariant.

create table public.note_progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  note_slug text not null
    check (note_slug = lower(note_slug) and char_length(note_slug) between 3 and 160),
  status text not null default 'completed'
    check (status in ('completed')),
  completed_at timestamptz not null default now(),
  primary key (user_id, note_slug)
);

create index note_progress_user on public.note_progress (user_id);

alter table public.note_progress enable row level security;

-- read-own; no insert/update/delete policy — written by the service role only
-- (XP-linked, authoritative). Mirrors xp_events / user_task_grades.
create policy "users read own note progress" on public.note_progress for select
  using ((select auth.uid()) = user_id);
