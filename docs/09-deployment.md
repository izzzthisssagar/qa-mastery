# 09 — Deployment, CI/CD & the design system

How QA Mastery ships. Both apps are **live** and redeploy automatically on every
push to `main`.

## Live URLs

| App | URL |
|---|---|
| Platform | https://qa-mastery-platform.vercel.app |
| BuggyShop | https://qa-mastery-buggyshop.vercel.app |

Backed by one Supabase cloud project (`qa-mastery-staging`, ref
`rnmxbtokqebkqibsjmrt`, ap-south-1) holding all migrations + the synced
curriculum.

## Hosting model

Two Vercel projects, one per app, both rooted in this monorepo:

| Vercel project | Root directory | Project ID |
|---|---|---|
| `qa-mastery-platform` | `apps/platform` | `prj_uel7mjbbm6PuwQWZSc0k3CpCl3xi` |
| `qa-mastery-buggyshop` | `apps/buggyshop` | `prj_EJ7hkDillvusf6IJofsMCZZHtRyP` |

Both were created via the Vercel REST API with `rootDirectory` set, so Vercel
installs at the repo root (detecting the pnpm workspace) and builds the app at
its subdirectory — the same way a dashboard monorepo import behaves. Env vars
(Supabase URL/keys, `SANDBOX_JWT_SECRET`, the cross-app URLs, billing flags) are
set per project; see `DEPLOYMENT.md` for the inventory.

## CI/CD — auto-deploy on push to main

`.github/workflows/deploy.yml` runs on every push to `main` and deploys **both
apps** to Vercel production via the Vercel CLI (a matrix job, one per app).
Vercel runs the real build, so a broken build fails the deploy and the live
alias stays on the last good build. Quality gates (lint / typecheck / unit /
e2e + manifest-leak grep) run in parallel in `ci.yml`.

Repo secrets/variables it depends on (already configured via `gh`):

| Kind | Name | Value |
|---|---|---|
| secret | `VERCEL_TOKEN` | the Vercel deploy token |
| secret | `VERCEL_ORG_ID` | `team_rQLbEbEW2DZewv9Aklt688bN` |
| variable | `VERCEL_PLATFORM_PROJECT_ID` | platform project id |
| variable | `VERCEL_BUGGYSHOP_PROJECT_ID` | buggyshop project id |

## Two deploy gotchas (both solved — keep in mind)

1. **`TEAM_ACCESS_REQUIRED` block.** Vercel attaches the git commit author to a
   deploy and blocks it when that email isn't a member of the Vercel team. Fix:
   deploy with **no git metadata attached**. CI does `rm -rf .git` before
   `vercel deploy` (the runner is ephemeral; the project is targeted via
   `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID`, not git). For a **local** one-off deploy,
   move `.git` aside instead: `mv .git /tmp/x && vercel deploy … ; mv /tmp/x .git`.
2. **"Upload aborted".** `.turbo` (multi-GB build cache) + pnpm's symlinked
   `node_modules` overwhelm the uploader. Fix: a `.vercelignore` excluding
   `node_modules` / `.next` / `.turbo`, plus `--archive=tgz` so the upload is a
   single tarball.

A canonical local production deploy from the repo root:

```bash
set -a; . ./.env.deploy; set +a          # token + staging keys (gitignored)
export VERCEL_ORG_ID=team_rQLbEbEW2DZewv9Aklt688bN
export VERCEL_PROJECT_ID=prj_uel7mjbbm6PuwQWZSc0k3CpCl3xi   # or the buggyshop id
mv .git /tmp/qam-git && \
  pnpm dlx vercel@latest deploy --prod --yes --archive=tgz ; \
  mv /tmp/qam-git .git
```

## Runtime file tracing (don't remove)

Lesson pages, quiz grading, and the tutor read lesson MDX / quiz JSON from
`packages/curriculum/content` **at request time**. Next's tracer can't follow a
computed path, so `apps/platform/next.config.ts` sets `outputFileTracingRoot`
(repo root) + `outputFileTracingIncludes` to bundle that content into the
serverless functions. Without it, every lesson/quiz/tutor route returns 500 on
Vercel. (This was the original "can't open any lesson" bug.)

## Schema changes

Migrations are **not** auto-applied on deploy (no Supabase access token is wired
into CI). Apply new `supabase/migrations/` to the cloud project via the Supabase
MCP/CLI, or add a `SUPABASE_ACCESS_TOKEN` secret + a `supabase db push` step.
Locally, `pnpm db:reset` applies everything. The cloud `schema_migrations`
history was repaired to match file versions, so `supabase db push` is clean.

## Design system

Dark-first, "engineering precision" aesthetic. Tokens in
`apps/platform/src/app/globals.css`, fonts in `app/layout.tsx`.

- **Type.** `Bricolage Grotesque` (display, `--font-display`), `Geist` (body),
  `Geist Mono` (eyebrows/labels), and `Instrument Serif` italic
  (`.font-serif-accent`) as a deliberate editorial accent on a few words.
- **Colour.** `--accent` emerald (primary) + `--bug` amber (sparing "bug-hunt"
  highlights). Utilities: `.text-glow-accent`, `.bg-glow`, `.bg-glow-bug`.
- **Atmosphere.** A faint blueprint grid (`.bg-grid`), radial glow, and SVG film
  grain (`.grain`) so no surface is a flat fill; a fixed background gradient on
  `body`. All motion respects `prefers-reduced-motion`.
- **Primitives.** `packages/ui` (gradient/glow primary `Button`, `Card`,
  `Badge`); marketing/widget components in `apps/platform/src/components`.

## Tutor — RAG + brain (live)

The help-agent tutor answers grounded in the curriculum and remembers each
learner.

- **Chat:** free-first `auto` chain = Gemini → Groq failover (`GEMINI_API_KEY`,
  `GROQ_API_KEY` set on the platform Vercel project). If Gemini chat is
  quota-limited the chain serves answers via Groq automatically.
- **RAG:** every lesson is chunked + embedded (Gemini `gemini-embedding-001`,
  768-dim) into `public.lesson_chunks` (pgvector). For each question the context
  builder embeds it, calls `match_lesson_chunks`, and injects the top chunks —
  best-effort, so it degrades to current-lesson context if embeddings are down.
  **Re-index after editing lessons:**
  `pnpm --filter @qa-mastery/curriculum embed` (needs `GEMINI_API_KEY` +
  `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` for the target DB).
- **Brain (kept):** per-learner profile (stages new→mentor), topic mastery from
  quizzes, episodic memories, nightly consolidation — `packages/agent` +
  `help_agent_*` tables.

## Ops

- Health probes: `GET /api/health` on both apps (platform returns
  `{status:ok,db:up}` / 503 if the DB is unreachable; buggyshop is a liveness
  ping). Point an uptime monitor at them.
- Remaining config toggles (owner action) live in `DEPLOYMENT.md` §2–§4:
  Supabase email-confirm, the tutor `GEMINI_API_KEY`, and optional Paddle keys.

Back to the [index](./README.md).
