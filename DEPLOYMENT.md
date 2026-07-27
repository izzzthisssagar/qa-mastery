# Deployment

**Status: LIVE.** Both apps run on Vercel and redeploy after CI finishes
verifying a commit on `main` — not on the raw push itself
(`.github/workflows/deploy.yml`, Task 12: deploy only the exact verified
commit). This file is the config reference; the operational runbook + the two
deploy gotchas are in [`docs/09-deployment.md`](./docs/09-deployment.md).

State: GitHub `izzzthisssagar/qa-mastery` (private) ✓ · Supabase
`qa-mastery-staging` (`rnmxbtokqebkqibsjmrt`, ap-south-1) — **all 13 migrations
applied + `schema_migrations` repaired to file-versions** ✓ · Curriculum registry
synced to staging (59 lessons) ✓ · `buggyshop` schema exposed to the API ✓ ·
Vercel: **both apps deployed via CLI** ✓ · CI/CD auto-deploy ✓ · Prod Supabase:
deferred to launch.

> **Why CLI, not dashboard import:** Vercel's GitHub integration is connected to
> account `temporary-fun111`, but the repo is owned by `izzzthisssagar` — so the
> dashboard "import the repo" path can't see it. We deploy with the Vercel CLI
> token instead, which sidesteps GitHub entirely (`docs/09-deployment.md`).

## 1. Vercel projects (done — via CLI token)

Both projects already exist and deploy from this monorepo; the table below is the
**reference** for the env vars set on each (e.g. to re-set or rotate them). To
re-create from scratch you'd configure each project as:

| Setting                      | Project 1             | Project 2              |
| ---------------------------- | --------------------- | ---------------------- |
| Project name                 | `qa-mastery-platform` | `qa-mastery-buggyshop` |
| Root Directory (click Edit!) | `apps/platform`       | `apps/buggyshop`       |
| Framework                    | Next.js (auto)        | Next.js (auto)         |

Environment variables (Production + Preview), both projects unless noted:

| Variable                        | Value                                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://rnmxbtokqebkqibsjmrt.supabase.co`                                                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the `anon` legacy key — Supabase dashboard → Project Settings → API Keys                        |
| `SUPABASE_SERVICE_ROLE_KEY`     | `service_role` key from the same page. **Secret — only ever in Vercel env, never in git**       |
| `SANDBOX_JWT_SECRET`            | run `openssl rand -base64 32` once; paste the SAME value into BOTH projects                     |
| `NEXT_PUBLIC_PLATFORM_URL`      | platform project's URL (e.g. `https://qa-mastery-platform.vercel.app`) — set after first deploy |
| `NEXT_PUBLIC_BUGGYSHOP_URL`     | buggyshop project's URL — set after first deploy                                                |
| `BILLING_ENABLED`               | `false` (platform only)                                                                         |

After both first deploys: fill the two `*_URL` vars in (they reference each
other) and redeploy. Custom domain later replaces the `.vercel.app` URLs
(subdomains of ONE domain: `app.…` + `shop.…` — required for the iframe).

## 2. Supabase staging — auth config (last manual step)

1. ~~**Data API → Exposed schemas**: add `buggyshop`~~ — **DONE via SQL**
   (`alter role authenticator set pgrst.db_schemas = 'public, graphql_public, buggyshop'`).
   No dashboard action needed.
2. **Authentication → Sign In / Providers → Email → Confirm email = OFF** — for an
   instant-signup demo. Supabase cloud defaults this **ON**, so otherwise every new
   learner must click an emailed confirmation link before they can log in. This is
   the one thing currently blocking a frictionless signup on the live site.
3. **Authentication → URL Configuration** (only if you KEEP email confirm ON):
   - Site URL = `https://qa-mastery-platform.vercel.app`
   - Redirect URLs: add `https://qa-mastery-platform.vercel.app/**` and
     `https://*-qa-mastery-platform.vercel.app/**`.
     Without this the confirmation-email link redirects to localhost and fails.

## 3. Help-agent tutor LLM (free by default)

The tutor resolves a provider free-first (Ollama → Gemini → Groq); paid (xAI/
OpenAI) only when chosen via `HELP_AGENT_PROVIDER`. For a hosted deploy, set the
recommended free option in **both** Vercel projects' env (platform needs it):

| Variable              | Value                                                                 |
| --------------------- | --------------------------------------------------------------------- |
| `GEMINI_API_KEY`      | a free-tier key from aistudio.google.com (`AIza…`). The free default. |
| `HELP_AGENT_PROVIDER` | leave unset (`auto`) for free-first, or pin a provider                |

(Ollama is the local-dev free path — not available on Vercel serverless.)

## 4. Billing (Paddle) — when you flip Pro live

The checkout + webhook are built; activating them is config only:

| Variable                          | Where             | Value                                                         |
| --------------------------------- | ----------------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_BILLING_ENABLED`     | platform (Vercel) | `true` to switch from mock-grant to Paddle checkout           |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | platform          | Paddle → Developer Tools → Authentication (client-side token) |
| `PADDLE_API_KEY`                  | platform (secret) | Paddle API key — webhook uses it                              |
| `PADDLE_WEBHOOK_SECRET`           | platform (secret) | Paddle → Notifications → webhook signing secret               |

In Paddle: create the Pro product + price, point a webhook at
`https://<platform-url>/api/webhooks/paddle` for `transaction.completed`. The
handler grants the `pro` entitlement (same row the mock `grantPro` writes).

## 5. CI/CD — deploy only the exact commit CI verified (LIVE)

`.github/workflows/deploy.yml` triggers on CI's own completion
(`workflow_run: { workflows: [CI], ... }`), not a raw push — a push that
fails CI can never reach a deploy job, and there's no window where a deploy
could run against a commit CI hasn't finished checking. Each release job
re-checks `github.event.workflow_run.conclusion == 'success'` **and**
`head_branch == 'main'` itself (a `workflow_run` event fires for every CI run
on every branch and outcome), then checks out and deploys exactly
`github.event.workflow_run.head_sha` — the same commit CI ran against, not
whatever HEAD happens to be when the deploy job starts. Vercel runs the real
build, so a broken build fails the deploy and the live alias stays on the
last good build. After each deploy, a health-check step curls the app's
`/api/health` and fails the release if it doesn't return 200.

Already configured on the repo (via `gh secret/variable set` — no action needed):

| GitHub   | Name                          | Value                              |
| -------- | ----------------------------- | ---------------------------------- |
| secret   | `VERCEL_TOKEN`                | the deploy token                   |
| secret   | `VERCEL_ORG_ID`               | `team_rQLbEbEW2DZewv9Aklt688bN`    |
| variable | `VERCEL_PLATFORM_PROJECT_ID`  | `prj_uel7mjbbm6PuwQWZSc0k3CpCl3xi` |
| variable | `VERCEL_BUGGYSHOP_PROJECT_ID` | `prj_EJ7hkDillvusf6IJofsMCZZHtRyP` |

The workflow runs `git archive <head_sha> | tar -x` into a scratch directory
and deploys from that — no git metadata, no stray untracked files, and (same
as the old blanket delete) Vercel never sees a commit author to block on
(`TEAM_ACCESS_REQUIRED`); selection is via `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID`.

> Schema changes: new `supabase/migrations/` are NOT auto-applied (no Supabase
> access token wired). Apply them via the Supabase MCP/CLI, or add a
> `SUPABASE_ACCESS_TOKEN` secret + a `supabase db push` step later (§ below —
> `deploy-staging.yml` does exactly this once those secrets are set, plus a
> `--dry-run` re-check that nothing is left pending and an optional REST-API
> smoke check, enabled by also setting the `STAGING_SUPABASE_ANON_KEY`
> variable).

## 6. Go-live checklist

- [ ] **Rotate** any API keys shared outside a vault; put real ones only in Vercel/GitHub env.
- [x] Vercel: both apps deployed via CLI (§1), env vars set, cross-app URLs correct.
- [x] CI/CD: a green CI run on `main` auto-deploys both apps, the exact commit CI verified (`.github/workflows/deploy.yml`).
- [x] Supabase staging: migrations `0001–0013` applied + history repaired (done).
- [ ] Supabase staging: schemas exposed + auth URLs (§2) — dashboard switches still pending.
- [ ] Tutor: `GEMINI_API_KEY` set with free-tier quota (§3) — verify a reply.
- [ ] Billing (optional at launch): Paddle product/webhook + the §4 vars; flip `NEXT_PUBLIC_BILLING_ENABLED=true`.
- [ ] CI green on `main` (lint/types/test/build/e2e + security + deploy-staging).
- [ ] Point an uptime monitor at `https://<platform-url>/api/health` (readiness:
      200 `{status:ok,db:up}` / 503 if the DB is unreachable) and
      `https://<shop-url>/api/health` (liveness).

## What stays manual vs automatic

- Every `git push` → CI runs (GitHub Actions: lint/types/tests/builds/e2e
  against a fresh local Supabase, **seeded via `sync --apply`**).
- Only once that CI run finishes with `conclusion: success` on `main` do
  `deploy.yml` and `deploy-staging.yml` fire (`workflow_run`) — both deploy
  the exact `head_sha` CI just verified, not whatever HEAD is by the time the
  deploy job starts.
- Schema changes: new files in `supabase/migrations/` — auto-applied to staging
  by `deploy-staging.yml` once §5 secrets are set, with a `--dry-run`
  re-check that nothing is left pending afterward.
- Prod Supabase project: create at launch (M3/M4) — keeps the free-tier slot
  open until then.
