-- 0004 — Supabase role grants for the public schema.
--
-- Bug fix: migration 0001 set up default privileges for the `buggyshop` schema
-- (grant all to service_role) but omitted the equivalent for `public`. Other
-- migrations assumed "grants come from 0001 default privileges", but for public
-- they never existed — so every service-role write (all server actions: grading,
-- progress, the curriculum sync) and even RLS-gated learner reads failed with
-- `permission denied for table ...`. The first thing to exercise a public write
-- was `curriculum sync --apply`, which is where it surfaced.
--
-- RLS stays the security boundary. These are table-level GRANTs that RLS then
-- filters: a role with INSERT here is still denied unless a row-level policy
-- permits it (e.g. quiz_attempts has no insert policy, so learners still cannot
-- write scores — invariant 2 holds). service_role bypasses RLS by design and is
-- the only writer for score/XP tables.

grant usage on schema public to anon, authenticated, service_role;

-- ── service_role: full access, bypasses RLS (server actions + sync) ──────
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;

-- ── authenticated: DML on every table, gated by each table's RLS policies ─
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ── anon: read-only — only the published registry (tracks/modules/lessons)
--    is actually reachable, via their `status = 'published'` SELECT policies ─
grant select on all tables in schema public to anon;

-- ── future tables inherit the same grants (so later migrations need no boilerplate)
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
alter default privileges in schema public grant all on functions to service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;
alter default privileges in schema public grant select on tables to anon;
