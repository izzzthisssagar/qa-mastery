-- 0036 — Server-side XP aggregation.
--
-- dashboard/page.tsx summed a learner's whole xp_events history client-side
-- (`select("amount")` then a JS reduce) — RLS already scopes those rows to
-- `auth.uid()` (see 0003_progress_tables's "users read own xp" policy), so
-- this was never a cross-tenant leak, just an unbounded row transfer that
-- only grows as a learner racks up more lesson/task/note completions.
-- `security invoker` (not definer) means this function carries no more
-- privilege than the caller already has — it still runs under the caller's
-- RLS, so it can only ever sum that caller's own rows. The explicit
-- revoke/grant below is what actually prevents an anonymous caller from
-- invoking it at all, independent of what RLS would have filtered anyway.

create or replace function public.my_xp_total()
returns bigint
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(sum(amount), 0)::bigint
  from public.xp_events
  where user_id = auth.uid();
$$;

revoke all on function public.my_xp_total() from public;
grant execute on function public.my_xp_total() to authenticated;
