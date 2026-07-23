-- 0035 — Notes schema: updated_at + client-stable id.
--
-- Playbook §1.2 asks that every notes-adjacent row carry `updated_at` and a
-- client-generatable stable id, ahead of P1-4 (optimistic local save) and
-- P2-3 (offline notes / IndexedDB background sync), both of which depend on
-- this ticket. Purely additive — no existing column, constraint, policy, or
-- RLS predicate changes. No table gains a new write path: every touched
-- table already has "service-role writes only" and stays that way.
--
-- Numbered 0035 (not 0034) because P0-8's index-audit migration
-- (20260723000034_hot_column_indexes.sql) was planned in the same session
-- and also claimed 0034 — sequenced after it to avoid a filename collision.
--
-- Correction vs. the original plan (plan-P1-5.md): the plan's audit missed
-- that `capstone_submissions` ALREADY has `updated_at` + an auto-bump
-- trigger, added by 20260615000008_capstone_one_per_lesson.sql — and that
-- `public.set_updated_at()` (defined in 0001_init.sql) is an established
-- repo-wide trigger convention already used on `review_queue` (0003),
-- `capstone_submissions` (0008), `test_cases` (0016), `tasks` (0028), and
-- `streaks` (0032). The plan claimed no such trigger existed anywhere in the
-- repo, which was wrong, and consequently proposed re-adding a column that
-- already exists (would have failed with "column already exists"). Fixed
-- here two ways: (1) `capstone_submissions` is no longer touched for
-- `updated_at` — only gains `client_id`, matching the other tables; (2) the
-- other three tables get the SAME trigger pattern, not a manual
-- app-code-sets-updated_at approach — consistent with repo convention, and
-- means P1-4/completeNote/submitNoteCapstone need no app-code change for
-- updated_at to work (upserts fire the UPDATE branch's trigger same as any
-- other UPDATE).

-- ── note_progress: completion marker, keyed by (user_id, note_slug) ─────────
-- `(user_id, note_slug)` is already a natural, client-computable idempotent
-- key (same pattern as talent_verified_skills' `unique(tester_id, skill)`),
-- so no separate `id` PK is added here. `client_id` is a correlation handle
-- for the future offline queue (P2-3) to match a locally-queued mutation to
-- the row it lands in; it is NOT used for conflict resolution on this table.
alter table public.note_progress
  add column updated_at timestamptz not null default now();

create trigger note_progress_updated_at
  before update on public.note_progress
  for each row execute function public.set_updated_at();

alter table public.note_progress
  add column client_id uuid;

create index note_progress_client_id
  on public.note_progress (user_id, client_id)
  where client_id is not null;

-- ── capstone_submissions: already has updated_at + trigger (0008) ──────────
-- Only client_id is new here, for schema consistency with the other notes
-- tables and the same future offline-queue correlation as note_progress;
-- conflict resolution stays on `unique(user_id, note_slug)` (0033), unchanged.
alter table public.capstone_submissions
  add column client_id uuid;

create index capstone_submissions_client_id
  on public.capstone_submissions (user_id, client_id)
  where client_id is not null;

-- ── code_runs / bug_reports: per-attempt lab logs, note_slug-tagged (0030) ──
-- Real gap: no natural per-attempt idempotency key exists today — a retried
-- offline-queued submission (P2-3) would insert a second row for the same
-- logical attempt. `client_id` + a partial unique constraint closes that:
-- once the client mints and sends a `client_id`, a resend upserts onto the
-- same row instead of duplicating; every existing service-role insert that
-- omits `client_id` (all current app code) is untouched by the constraint.
--
-- Postgres unique constraints treat NULL as distinct from every other NULL
-- (standard SQL semantics), so `unique (user_id, client_id)` does NOT reject
-- the many existing/future rows with `client_id is null` — it only enforces
-- uniqueness among rows that DO supply a client_id. Same reasoning already
-- used for `capstone_submissions_user_note_slug_key` (0033): a plain, not
-- partial, unique constraint, because supabase-js's
-- `.upsert({ onConflict: "..." })` can't target a partial index.
alter table public.code_runs
  add column updated_at timestamptz not null default now();

create trigger code_runs_updated_at
  before update on public.code_runs
  for each row execute function public.set_updated_at();

alter table public.code_runs
  add column client_id uuid;

alter table public.code_runs
  add constraint code_runs_user_client_id_key unique (user_id, client_id);

alter table public.bug_reports
  add column updated_at timestamptz not null default now();

create trigger bug_reports_updated_at
  before update on public.bug_reports
  for each row execute function public.set_updated_at();

alter table public.bug_reports
  add column client_id uuid;

alter table public.bug_reports
  add constraint bug_reports_user_client_id_key unique (user_id, client_id);
