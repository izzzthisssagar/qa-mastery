# 03 — Data model

The schema lives in `supabase/migrations/`, applied in order:

| Migration | Adds |
|---|---|
| `20260612000001_init.sql` | `profiles`, the registry (`tracks`/`modules`/`lessons`), `progress`, and the `buggyshop` schema scaffold + its grants/default-privileges |
| `20260613000002_buggyshop.sql` | `buggyshop.bs_*` sandbox tables, the seeded-bug manifest, `provision_sandbox`/`reset_sandbox` RPCs |
| `20260613000003_progress_tables.sql` | `quiz_attempts`, `review_queue`, `xp_events` |
| `20260613000004_public_grants.sql` | Role grants for the `public` schema (bug fix — see below) |
| `20260613000005_bug_reports.sql` | `bug_reports` — graded bug-report lab submissions |

**RLS is the authorization model.** Every table has Row-Level Security enabled.
Table-level GRANTs (migration 0004) decide which roles may touch a table at all;
RLS policies then decide which rows. A role with `INSERT` granted is still denied
unless a row-level policy permits the row.

## Domain: profiles & auth

| Table | Purpose | Writer | RLS |
|---|---|---|---|
| `profiles` | One row per auth user (created on signup). | trigger on `auth.users` | read/update own |

Auth itself (users, sessions, passwords) lives in Supabase's `auth` schema,
managed by GoTrue — not in these migrations.

## Domain: curriculum registry

The DB mirror of the MDX content. Populated by `curriculum sync --apply`
(see [05](./05-curriculum-and-content.md)). Clients read **published rows only**.

| Table | Key columns | Writer | RLS |
|---|---|---|---|
| `tracks` | `slug`, `title`, `order_index`, `status` | service role (sync) | `select` where `status='published'` |
| `modules` | `track_id`, `code`, `title`, `order_index`, `status` | service role (sync) | `select` where `status='published'` |
| `lessons` | `slug` (immutable), `module_id`, `free`, `lab_type`, `requires_release`, `content_hash`, `status` | service role (sync) | `select` where `status='published'` |

The published-only policies apply to `anon` and `authenticated` alike, which is
why an anonymous visitor can browse the catalog but never sees drafts.

## Domain: learner progress

| Table | Purpose | Key columns | Writer | RLS |
|---|---|---|---|---|
| `progress` | Per-lesson step state | `(user_id, lesson_id)` PK, `status` (`started`/`completed`), `step_state` jsonb (`{see,try,do,prove}`), `completed_at` | **owner** (self-reported, low stakes) | read / insert / update own |
| `quiz_attempts` | Graded quiz attempts | `attempt_no`, `score`, `max_score`, `passed`, `answers` jsonb | **service role only** | read own — **no insert/update policy** |
| `review_queue` | Spaced-repetition flashcards (SM-2-lite) | `(user_id, card_key)` PK, `front`, `back`, `due_at`, `interval_days`, `ease`, `reps`, `lapses` | owner (scheduling is self-reported) | read / insert / update own |
| `xp_events` | Append-only XP ledger | `amount`, `reason`, `ref_id` | **service role only** | read own — **no insert policy** |
| `bug_reports` | Graded "Do it" lab submissions | `matched_bug_id`, `page`, `feature`, `category`, `severity`, `score`, `matched`, `duplicate`, `feedback` | **service role only** | read own — **no insert policy** |

The split is the heart of **invariant 2** ([04](./04-invariants.md)): anything a
score depends on (`quiz_attempts`, `xp_events`) has *read-own RLS and no write
policy*, so even with table-level `INSERT` granted, a learner's JWT cannot write
it — only the service role (which bypasses RLS, inside `submitQuiz`) can. Progress
and the review queue are low-stakes, so the owner writes them directly.

## Domain: BuggyShop sandbox (`buggyshop` schema)

A separate schema, **deny-all by design**: no grants to `anon`/`authenticated`,
zero RLS policies. Only the `service_role` touches it, via route handlers.

| Object | Purpose |
|---|---|
| `buggyshop.bs_*` | Per-sandbox e-commerce data (users, sessions, products, cart, orders…). Every row scoped by `sandbox_id` (**invariant 4**). |
| `buggyshop.bs_bug_manifest` | The seeded-bug answer key (`title_internal`, `repro_steps_internal`). **Never reaches a client bundle** (**invariant 1**); grading reads it server-side. |
| `provision_sandbox(uuid)`, `reset_sandbox(uuid)` | SECURITY-relevant RPCs; `execute` is revoked from `public/anon/authenticated` — service role only. |

## Migration 0004 — the grants fix

The `init` migration set up default privileges for the `buggyshop` schema but
**omitted the equivalent for `public`**. Several later comments assumed "grants
come from 0001 default privileges", but for `public` they never existed. The
result: every service-role write (all server actions, the curriculum sync) and
even RLS-gated learner reads failed with `permission denied for table …`. It
stayed hidden until the first `public` *write* — `curriculum sync --apply` —
was run.

`20260613000004_public_grants.sql` grants, and sets default privileges for
future tables, in the `public` schema:

- `service_role` → all (bypasses RLS; the server-action writer).
- `authenticated` → `select/insert/update/delete` (RLS policies gate the rows).
- `anon` → `select` only (reaches just the published registry).

RLS remains the boundary; this only restores the table-level access RLS sits on
top of. Verified by the learn e2e: the quiz-pass path performs a service-role
write and now succeeds on both Chromium and WebKit.

Next: [04 — Invariants](./04-invariants.md).
