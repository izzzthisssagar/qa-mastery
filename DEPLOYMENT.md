# Deployment — one-time setup

State: GitHub `izzzthisssagar/qa-mastery` (private) ✓ · Supabase staging
`qa-mastery-staging` (`rnmxbtokqebkqibsjmrt`, ap-south-1, migrations applied) ✓
· Vercel projects: **pending (steps below)** · Prod Supabase: deferred to launch.

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

## 2. Supabase staging — two dashboard switches

1. **Settings → Data API → Exposed schemas**: add `buggyshop`
   (local config.toml handles this locally; cloud is a dashboard setting).
2. **Authentication → URL Configuration**: Site URL = platform URL;
   add `https://*-qa-mastery-platform.vercel.app/**` to Redirect URLs
   (covers preview deploys).

## 3. What stays manual vs automatic

- Every `git push` → CI runs (GitHub Actions: lint/types/tests/builds/e2e
  against a fresh local Supabase) and Vercel builds previews/production.
- Schema changes: new files in `supabase/migrations/` — applied to staging
  via MCP/CLI for now; the gated `deploy-staging.yml` workflow can take over
  once `SUPABASE_ACCESS_TOKEN` + project ref are added as GitHub secrets.
- Prod Supabase project: create at launch (M3/M4) — keeps the free-tier slot
  open until then.
