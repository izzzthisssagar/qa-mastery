-- 0034 — index audit on RLS/FK hot columns (P0-8).
--
-- Closes real gaps found between existing indexes and the columns actually
-- filtered in RLS `using`/`with check` predicates and in server-action query
-- patterns (see plan-P0-8.md for the file:line audit trail). Additive only —
-- no table, column, policy, or grant changes. Every index below is CREATE
-- INDEX IF NOT EXISTS so this migration is safe to re-run.

-- audit_events: rate-limit check filters actor_id + action + created_at
-- together on every talent write (contact/message/project-post/application/
-- report); existing (actor_id, created_at) and (action, created_at) each
-- cover only two of the three columns.
create index if not exists audit_events_actor_action_created
  on public.audit_events (actor_id, action, created_at);

-- notifications: unread-count + mark-read run on every page load, filtering
-- user_id + read_at is null; existing (user_id, created_at) doesn't encode
-- the read_at predicate so it scans read rows too.
create index if not exists notifications_user_unread_only
  on public.notifications (user_id, created_at desc)
  where read_at is null;

-- xp_events: idempotent award check on every task-grade pass filters
-- user_id + reason + ref_id together; existing index is user_id-only.
create index if not exists xp_events_user_reason_ref
  on public.xp_events (user_id, reason, ref_id);

-- bug_reports: task-grading evidence count filters user_id + matched +
-- not duplicate; no existing composite covers those two flag columns.
create index if not exists bug_reports_user_matched_not_dup
  on public.bug_reports (user_id)
  where matched and not duplicate;

-- bug_reports: portfolio + reusable-artifacts list sort created_at desc
-- scoped to user_id; no existing composite leads with both.
create index if not exists bug_reports_user_created
  on public.bug_reports (user_id, created_at desc);

-- talent_conversations: RLS predicate and app .or(client_id/tester_id) query
-- both need an efficient tester_id-led path; only a client_id-led index
-- exists today.
create index if not exists talent_conversations_tester
  on public.talent_conversations (tester_id, client_id);

-- community_posts: per-post-creation quota check filters author_id +
-- created_at range; existing index is author_id-only.
create index if not exists community_posts_author_created
  on public.community_posts (author_id, created_at);

-- help_agent_profiles: scheduled brain-consolidation sweep filters
-- last_active_at with no user_id qualifier at all; table has zero secondary
-- index today.
create index if not exists help_agent_profiles_last_active
  on public.help_agent_profiles (last_active_at);

-- quiz_attempts: nightly weak-topic scan filters user_id + passed=false +
-- created_at range; existing (user_id, lesson_id) doesn't cover it. Low
-- traffic today but a real gap against the RLS-adjacent read path.
create index if not exists quiz_attempts_user_passed_created
  on public.quiz_attempts (user_id, passed, created_at);

-- bs_bug_manifest: repeatedly filtered by release with zero index beyond
-- the bug_id PK. Table is small today (seeded rows); future-proofing.
create index if not exists bs_bug_manifest_release
  on buggyshop.bs_bug_manifest (release);

-- Cleanup candidate — uncomment only after confirming no read path depends
-- on a standalone user_id index (the PK (user_id, note_slug) already serves
-- every observed query filtering by user_id alone or by user_id+note_slug):
-- drop index if exists public.note_progress_user;
