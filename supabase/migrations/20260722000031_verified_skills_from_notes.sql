-- 0031 — Verified skills also derive from note-spine bug-hunt labs.
--
-- 0018's derivation only reads quiz_attempts -> lessons -> modules -> tracks —
-- the legacy lesson system's DB-backed tables. The notes wiki (0029/0030) is
-- now where a learner actually reaches a bug-hunt lab (see labs.ts's
-- defect-management/writing-bug-reports entry), but notes have NO db-backed
-- track/module registry by design (ADR-15: pure MDX, taxonomy.ts is the only
-- source of truth, and it's a TypeScript file this SQL function can't read).
-- So instead of joining to a title the way the lesson path does, the skill
-- label is derived straight from the note_slug's module segment
-- ("defect-management" -> "Defect Management") — self-maintaining for any
-- future note-chapter bug-hunt lab, no synced list to keep current.
--
-- Known simplification: this credits a skill on ANY matched bug report for a
-- module, not on clearing a lab's full minValidBugs requirement (that
-- threshold lives in labs.ts, unreachable from SQL). Correct for the current
-- single lab (minValidBugs: 1, so any match IS a pass); a future lab
-- requiring >1 bug would over-credit here. Flagging rather than silently
-- shipping it as exact — revisit if/when a minValidBugs > 1 lab lands.
--
-- score=100 (not a percentage like the quiz path) because this is pass/fail,
-- not partial credit. greatest()-on-conflict keeps the file's own invariant
-- ("a re-derive only ever raises a score") even if a lesson-track title ever
-- collides with a note-module label.

create or replace function public.derive_verified_skills(target uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.talent_verified_skills (tester_id, skill, score, source, earned_at)
  select
    best.user_id,
    t.title,
    greatest(0, least(100,
      round(avg(best.score::numeric / nullif(best.max_score, 0)) * 100)
    ))::smallint,
    'lab',
    max(best.created_at)
  from (
    select distinct on (qa.user_id, qa.lesson_id)
      qa.user_id, qa.lesson_id, qa.score, qa.max_score, qa.passed, qa.created_at
    from public.quiz_attempts qa
    where target is null or qa.user_id = target
    order by qa.user_id, qa.lesson_id, qa.score desc, qa.created_at desc
  ) best
  join public.lessons l on l.id = best.lesson_id
  join public.modules m on m.id = l.module_id
  join public.tracks  t on t.id = m.track_id
  join public.talent_profiles tp on tp.id = best.user_id
  group by best.user_id, t.id, t.title
  having bool_or(best.passed)
  on conflict (tester_id, skill) do update
    set score = greatest(talent_verified_skills.score, excluded.score),
        earned_at = greatest(talent_verified_skills.earned_at, excluded.earned_at),
        updated_at = now();

  -- NEW: note-spine bug-hunt lab passes.
  insert into public.talent_verified_skills (tester_id, skill, score, source, earned_at)
  select
    br.user_id,
    initcap(replace(split_part(br.note_slug, '/', 1), '-', ' ')),
    100,
    'lab',
    max(br.created_at)
  from public.bug_reports br
  join public.talent_profiles tp on tp.id = br.user_id
  where br.note_slug is not null
    and br.matched_bug_id is not null
    and (target is null or br.user_id = target)
  group by br.user_id, split_part(br.note_slug, '/', 1)
  on conflict (tester_id, skill) do update
    set score = greatest(talent_verified_skills.score, excluded.score),
        earned_at = greatest(talent_verified_skills.earned_at, excluded.earned_at),
        updated_at = now();
end;
$$;

revoke all on function public.derive_verified_skills(uuid) from public;
grant execute on function public.derive_verified_skills(uuid) to service_role;
