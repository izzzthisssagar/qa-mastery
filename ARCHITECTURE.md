# Architecture

QA Mastery is a hands-on QA learning platform. Three Next.js apps plus a
standalone WebSocket service share a Supabase (Postgres + Auth + Storage)
backend through a set of internal packages, deployed on Vercel (apps) and
Fly.io (the WebSocket service). This doc is the system overview; `CLAUDE.md`
holds the engineering conventions + invariants, and `DEPLOYMENT.md` the go-live
steps.

## System context

- **platform** (`:3000`) — the learner-facing app: lessons, interactive widgets,
  graded quizzes/labs/capstone, dashboard/XP, the help-agent tutor, code labs.
- **buggyshop** (`:3001`) — a deliberately-buggy practice e-commerce app the
  curriculum tests against. Fake (cookie-free) auth; every bug is seeded behind
  a release flag.
- **buggyapi** (`:3002`) — "TaskFlight", a deliberately-buggy practice REST API
  with generated OpenAPI docs, covering REST/GraphQL/SOAP/OAuth surfaces for
  API-testing curriculum modules. Same fake-auth, seeded-bug-behind-a-flag
  model as buggyshop (`apiBugFlag`, `ba_sandbox_state`).
- **buggyapi-ws** (`services/buggyapi-ws`) — BuggyAPI's WebSocket practice
  service, deployed separately on Fly.io since Vercel's serverless functions
  can't hold long-lived socket connections.
- **Supabase** — Postgres (RLS), Auth, Storage. One client per request;
  `auth.getUser()` for the real boundary; a service-role client bypasses RLS for
  server-side writes.
- **LLM** — the tutor resolves a provider free-first (Ollama → Gemini → Groq);
  paid (xAI/OpenAI) is opt-in only.

## Package dependency graph

A strict DAG — apps consume packages, packages never depend on apps or on each
other cyclically, and `config` is the universal leaf.

```mermaid
graph TD
    subgraph Apps
      platform
      buggyshop
      buggyapi
    end
    subgraph Services
      buggyapi_ws["buggyapi-ws"]
    end
    curriculum
    subgraph "Domain / leaf packages"
      agent; db; grading; shared; ui; widgets
    end
    config

    platform --> agent & curriculum & db & grading & shared & ui & widgets
    buggyshop --> db & shared & ui
    buggyapi --> db & shared & ui
    buggyapi_ws --> config
    curriculum --> db & shared & config
    widgets --> shared & config
    agent & db & grading & shared & ui --> config
```

| Layer | Packages | Role |
|---|---|---|
| 3 — apps/services | `platform`, `buggyshop`, `buggyapi` (Next.js App Router), `buggyapi-ws` (standalone WS service) | consume packages only |
| 2 — composite | `curriculum` (MDX→registry), `widgets` (teaching UI) | depend on `shared`/`db` |
| 1 — domain | `agent` (tutor LLM), `grading`, `db`, `ui`, `shared` | depend on `config` |
| 0 — leaf | `config` (tsconfig/eslint) | nothing |

**Pattern:** modular monolith on a shared Postgres — right for a small team +
rapid iteration. Internal packages ship TS source; apps list them in
`transpilePackages`. Runtime-heavy/server-only code is fenced behind subpath
exports (`@qa-mastery/grading/runners` keeps `node:child_process` out of client
bundles).

## Data model (Postgres, 36 migrations)

**`public` schema — learner data.** RLS read-own; scores/XP/entitlements are
written only by the service role (invariant 2 — learners never write scores).

- Identity/content: `profiles`, `tracks`, `modules`, `lessons`, `sandboxes`
- Progress + grading: `progress`, `quiz_attempts`, `review_queue`, `xp_events`,
  `bug_reports` (+`evidence_url`), `capstone_submissions`, `entitlements`
- Code labs: `code_runs` (rate-limit counting + run ownership)
- Help agent: `help_agent_profiles` / `_messages` / `_memories`
- `audit_events` — append-only trail of sensitive ops; **RLS-on, no policies**
  (service-role only, never learner-readable)

**`buggyshop` schema — sandbox.** Deny-all RLS; all access is service-role via
route handlers, every row scoped by `sandbox_id` (invariants 3 & 4). The
seeded-bug manifest (`bs_bug_manifest`) is server-only — its internal fields
never reach a client bundle (invariant 1, CI-checked).

## Key request flows

- **Auth boundary.** `src/proxy.ts` does optimistic redirects only; the
  `(app)/layout.tsx` server check is the real gate, and every mutating server
  action re-checks via `requireAccessibleLesson` (free vs Pro).
- **Grading.** Pure graders live in `@qa-mastery/grading` (`scoreQuiz`,
  `matchBugReport`, `gradeCapstone`, `validateCodeSubmission`) — answer keys are
  server-only; server actions persist scores via the service role.
- **Code labs.** `submitCodeLab` validates → rate-limits (per-day quota) →
  forwards to a runner → records the run; `pollCodeRun` checks run ownership
  before returning a result.
- **Tutor.** Chat route authenticates → rate-limits (DB-backed daily count) →
  builds lesson/learner context → streams via `guardedStream` (a streaming-safe
  guard that withholds any answer/manifest leak before it reaches the client) →
  persists + audit-logs.

## Deployment & CI/CD

Three Vercel projects (one per Next.js app, rooted at `apps/platform` /
`apps/buggyshop` / `apps/buggyapi`) build from this monorepo on a shared
Supabase cloud project; `buggyapi-ws` deploys separately to Fly.io.
`.github/workflows/deploy.yml` ships to production via `workflow_run`, gated
on `ci.yml` (lint/typecheck/unit/RLS/e2e) completing successfully on `main` —
a red CI run blocks the deploy entirely, and Vercel's own build is a second
gate on top of that (a red build leaves the live alias on the last good one).
The platform's `next.config.ts` traces
`packages/curriculum/content` into the serverless bundle so lesson/quiz/tutor
routes can read it at request time. Full runbook, the two deploy gotchas, and
the design system: [`docs/09-deployment.md`](./docs/09-deployment.md).

## Invariants

The seven invariants in `CLAUDE.md` are the load-bearing rules (manifest
secrecy, learners-never-write-scores, fake BuggyShop auth, sandbox scoping,
immutable slugs, registry-validated widgets, bug flags). They're enforced in
code (RLS + service-role writes + the streaming guard) and guarded by the RLS
regression suite, the manifest-leak CI grep, and unit tests.
