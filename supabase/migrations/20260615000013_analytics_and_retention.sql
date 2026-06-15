-- 0013 — founder analytics views + retention for append-only tables.
--
-- Analytics live in a dedicated `analytics` schema that is NOT in the API's
-- exposed-schemas list and is granted only to service_role — so these
-- cross-learner aggregates (which necessarily see past per-user RLS) are
-- reachable only from the Supabase dashboard / service role, never the public
-- API. This is the leak guard: the views must never be queryable by anon or
-- authenticated.

create schema if not exists analytics;
revoke all on schema analytics from anon, authenticated;
grant usage on schema analytics to service_role;

-- Per-lesson completion funnel: how many learners attempt vs complete.
create or replace view analytics.lesson_completion as
select
  l.slug,
  l.title,
  count(distinct qa.user_id)                                          as learners_attempted,
  count(distinct p.user_id) filter (where p.status = 'completed')     as learners_completed
from public.lessons l
left join public.quiz_attempts qa on qa.lesson_id = l.id
left join public.progress p       on p.lesson_id = l.id
where l.status = 'published'
group by l.id, l.slug, l.title;

-- Where learners struggle: low quiz pass-rate = a lesson to revisit.
create or replace view analytics.stuck_lessons as
select
  l.slug,
  l.title,
  count(qa.*)                                                                   as attempts,
  count(qa.*) filter (where qa.passed)                                          as passes,
  round(count(qa.*) filter (where qa.passed)::numeric / nullif(count(qa.*), 0) * 100, 1) as pass_rate_pct
from public.lessons l
join public.quiz_attempts qa on qa.lesson_id = l.id
group by l.id, l.slug, l.title
order by pass_rate_pct asc nulls last;

-- Daily active learners, from the audit trail (any sensitive action).
create or replace view analytics.daily_active_learners as
select date_trunc('day', created_at)::date as day,
       count(distinct actor_id)            as active_learners
from public.audit_events
group by 1
order by 1 desc;

-- One-row engagement snapshot.
create or replace view analytics.engagement_overview as
select
  (select count(*) from public.profiles)                                   as learners,
  (select count(*) from public.entitlements where kind = 'pro')            as pro_learners,
  (select count(*) from public.progress where status = 'completed')        as lessons_completed,
  (select coalesce(sum(amount), 0) from public.xp_events)                  as total_xp,
  (select count(*) from public.code_runs)                                  as code_runs,
  (select count(*) from public.bug_reports where matched)                  as bugs_matched;

grant select on all tables in schema analytics to service_role;

-- Retention for high-churn append-only tables. Guarded: pg_cron is a Supabase
-- cloud extension and may be absent locally / in CI — if so, skip cleanly so
-- db:reset never breaks. On cloud it schedules nightly pruning.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('prune-audit-events', '0 3 * * *',
    $q$delete from public.audit_events where created_at < now() - interval '180 days'$q$);
  perform cron.schedule('prune-help-agent-messages', '0 3 * * *',
    $q$delete from public.help_agent_messages where created_at < now() - interval '90 days'$q$);
  perform cron.schedule('prune-code-runs', '0 3 * * *',
    $q$delete from public.code_runs where created_at < now() - interval '90 days'$q$);
exception when others then
  raise notice 'pg_cron unavailable — retention jobs skipped (enable in Supabase cloud)';
end
$$;
