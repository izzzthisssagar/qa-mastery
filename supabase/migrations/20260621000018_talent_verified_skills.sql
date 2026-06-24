-- 0018 — talent verified-skills derivation (M2). Replaces the M0 watermark-only
-- stub with the real mapping: a verified skill = a track the tester has passed
-- at least one graded lesson in; the score is their average best-attempt quiz
-- percentage across that track. Derived from grading data, written ONLY by the
-- service role — learners have no write path, so badges are forge-proof
-- (Architecture ADR-004). Best-attempt-per-lesson means a re-derive only ever
-- raises a score, so upsert-without-delete converges.

-- Re-derive verified skills for one tester (target) or all (target is null).
-- security definer + service-role-only execute: callable from the nightly cron
-- and from a service-role RPC (the tester's "refresh my badges"), never by a
-- learner directly.
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
    -- best attempt per (user, lesson)
    select distinct on (qa.user_id, qa.lesson_id)
      qa.user_id, qa.lesson_id, qa.score, qa.max_score, qa.passed, qa.created_at
    from public.quiz_attempts qa
    where target is null or qa.user_id = target
    order by qa.user_id, qa.lesson_id, qa.score desc, qa.created_at desc
  ) best
  join public.lessons l on l.id = best.lesson_id
  join public.modules m on m.id = l.module_id
  join public.tracks  t on t.id = m.track_id
  -- only learners who have opted into a tester profile (FK target)
  join public.talent_profiles tp on tp.id = best.user_id
  group by best.user_id, t.id, t.title
  having bool_or(best.passed)             -- ≥1 graded pass in the track
  on conflict (tester_id, skill) do update
    set score = excluded.score,
        earned_at = excluded.earned_at,
        updated_at = now();
end;
$$;

revoke all on function public.derive_verified_skills(uuid) from public;
grant execute on function public.derive_verified_skills(uuid) to service_role;

-- PATH B (nightly reconcile, scheduled in 0017) now delegates to the real
-- derivation for all testers, then advances the watermark.
create or replace function analytics.reconcile_verified_skills()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.derive_verified_skills(null);
  update public.talent_sync_state set last_reconciled_at = now() where id;
end;
$$;
