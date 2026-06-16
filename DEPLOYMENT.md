# Deployment — one-time setup

State: GitHub `izzzthisssagar/qa-mastery` (private) ✓ · Supabase staging
`qa-mastery-staging` (`rnmxbtokqebkqibsjmrt`, ap-south-1) — **all 13 migrations
applied + `schema_migrations` history repaired to file-versions (clean for
`supabase db push`)** ✓ · Curriculum registry on staging: pending (needs staging
service key / `deploy-staging.yml`) · Vercel projects: **pending — blocked on the
GitHub-account decision below** · Prod Supabase: deferred to launch.

> **Vercel blocker (must decide first):** Vercel is connected to GitHub account
> `temporary-fun111`, but the repo is `izzzthisssagar/qa-mastery`. Vercel can't
> see the repo until you connect the owning account (or install the Vercel
> GitHub App on it). Resolve this before §1.

## 1. Vercel — import the repo TWICE (once per app)

At https://vercel.com/new → Import `izzzthisssagar/qa-mastery`:

| Setting | Project 1 | Project 2 |
|---|---|---|
| Project name | `qa-mastery-platform` | `qa-mastery-buggyshop` |
| Root Directory (click Edit!) | `apps/platform` | `apps/buggyshop` |
| Framework | Next.js (auto) | Next.js (auto) |

Environment variables (Production + Preview), both projects unless noted:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rnmxbtokqebkqibsjmrt.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the `anon` legacy key — Supabase dashboard → Project Settings → API Keys |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key from the same page. **Secret — only ever in Vercel env, never in git** |
| `SANDBOX_JWT_SECRET` | run `openssl rand -base64 32` once; paste the SAME value into BOTH projects |
| `NEXT_PUBLIC_PLATFORM_URL` | platform project's URL (e.g. `https://qa-mastery-platform.vercel.app`) — set after first deploy |
| `NEXT_PUBLIC_BUGGYSHOP_URL` | buggyshop project's URL — set after first deploy |
| `BILLING_ENABLED` | `false` (platform only) |

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

| Variable | Value |
|---|---|
| `GEMINI_API_KEY` | a free-tier key from aistudio.google.com (`AIza…`). The free default. |
| `HELP_AGENT_PROVIDER` | leave unset (`auto`) for free-first, or pin a provider |

(Ollama is the local-dev free path — not available on Vercel serverless.)

## 4. Billing (Paddle) — when you flip Pro live

The checkout + webhook are built; activating them is config only:

| Variable | Where | Value |
|---|---|---|
| `NEXT_PUBLIC_BILLING_ENABLED` | platform (Vercel) | `true` to switch from mock-grant to Paddle checkout |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | platform | Paddle → Developer Tools → Authentication (client-side token) |
| `PADDLE_API_KEY` | platform (secret) | Paddle API key — webhook uses it |
| `PADDLE_WEBHOOK_SECRET` | platform (secret) | Paddle → Notifications → webhook signing secret |

In Paddle: create the Pro product + price, point a webhook at
`https://<platform-url>/api/webhooks/paddle` for `transaction.completed`. The
handler grants the `pro` entitlement (same row the mock `grantPro` writes).

## 5. CI/CD — automatic Vercel deploy (LIVE)

`.github/workflows/deploy.yml` ships **both apps to Vercel production on every
push to `main`**, via the Vercel CLI token (sidesteps the GitHub-account tangle
— see §1). Vercel runs the real build, so a broken build fails the deploy and
the live alias stays on the last good build. Quality gates (lint / typecheck /
unit / e2e) run in parallel in `ci.yml`.

Already configured on the repo (via `gh secret/variable set` — no action needed):

| GitHub | Name | Value |
|---|---|---|
| secret | `VERCEL_TOKEN` | the deploy token |
| secret | `VERCEL_ORG_ID` | `team_rQLbEbEW2DZewv9Aklt688bN` |
| variable | `VERCEL_PLATFORM_PROJECT_ID` | `prj_uel7mjbbm6PuwQWZSc0k3CpCl3xi` |
| variable | `VERCEL_BUGGYSHOP_PROJECT_ID` | `prj_EJ7hkDillvusf6IJofsMCZZHtRyP` |

The workflow runs `rm -rf .git` before `vercel deploy` so Vercel doesn't block
on the commit author not being a team member (`TEAM_ACCESS_REQUIRED`).

> Schema changes: new `supabase/migrations/` are NOT auto-applied (no Supabase
> access token wired). Apply them via the Supabase MCP/CLI, or add a
> `SUPABASE_ACCESS_TOKEN` secret + a `supabase db push` step later.

## 6. Go-live checklist

- [ ] **Rotate** any API keys shared outside a vault; put real ones only in Vercel/GitHub env.
- [ ] Vercel: both projects imported (§1), env vars set, `*_URL` vars back-filled + redeployed.
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
  against a fresh local Supabase, **seeded via `sync --apply`**) and Vercel
  builds previews/production.
- Schema changes: new files in `supabase/migrations/` — auto-applied to staging
  by `deploy-staging.yml` once §5 secrets are set.
- Prod Supabase project: create at launch (M3/M4) — keeps the free-tier slot
  open until then.
