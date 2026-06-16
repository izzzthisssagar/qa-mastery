# 07 — Development

## Prerequisites

- **Docker** — runs the local Supabase stack.
- **pnpm** (workspace package manager) and **Node** (≥ 20).
- Supabase CLI is invoked through pnpm scripts (no global install needed).

## First-time setup

```bash
pnpm install
cp .env.example apps/platform/.env.local   # then fill from `pnpm db:status`
pnpm db:start                              # boots local Supabase (needs Docker)
pnpm db:reset                              # applies all migrations + seed
pnpm --filter @qa-mastery/curriculum sync --apply   # publish lessons to the DB registry
pnpm dev                                   # platform :3000, buggyshop :3001
```

`.env.local` values (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, …) come from `pnpm db:status` once the stack is up.
The placeholders in `.env.example` fail fast on purpose.

> `sync --apply` needs `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
> in the environment. If you get `permission denied for table tracks`, the
> public-schema grants (migration 0004) didn't apply — re-run `pnpm db:reset`.

## Commands

| Command | What |
|---|---|
| `pnpm dev` | Both apps in dev (platform :3000, buggyshop :3001). |
| `pnpm lint` / `pnpm typecheck` | Turbo-cached across all packages. |
| `pnpm test` | Unit tests (Vitest) — grading, curriculum, shared. No DB needed. |
| `pnpm test:rls` | RLS regression suite (`@qa-mastery/db`). Needs the live local stack + a synced lesson; pass the Supabase env vars. |
| `pnpm build` | Production build of everything. |
| `pnpm e2e` | `turbo build` then Playwright on **Chromium + WebKit** against `next start` of both apps. |
| `pnpm db:start` / `db:stop` / `db:status` | Local Supabase stack. |
| `pnpm db:reset` | Re-apply all migrations + seed (destroys local data). |
| `pnpm --filter @qa-mastery/curriculum sync [--apply]` | Validate (CI gate) / publish the lesson registry. |

## How to add a lesson

1. Create `packages/curriculum/content/<track>/<module>/<slug>.mdx` with valid
   frontmatter (see [05](./05-curriculum-and-content.md)) and a co-located
   `<slug>.quiz.json` if it has a quiz.
2. Make sure the `module` code exists in `taxonomy.ts` and the `track` matches.
3. Reference only widgets listed in `packages/widgets/src/names.ts`.
4. `pnpm --filter @qa-mastery/curriculum sync` to validate, then `--apply` to
   publish to the DB. The slug is immutable once published.

## How to add a widget

1. Build the component in `packages/widgets/src/<name>.tsx` (`"use client"`),
   accepting `WidgetProps` (`{ lessonSlug, onMilestone? }`).
2. Register it: add the name to `WIDGET_NAMES` in `src/names.ts`, a lazy loader
   in `src/registry.ts`, and the export in `src/index.ts`.
3. Reference it from a lesson's frontmatter `widgets:` and embed its tag in the
   MDX. The platform's `globals.css` already `@source`s the widgets package, so
   its Tailwind classes are scanned.

## The testing bar

This platform teaches QA — its own suite is marketing. The bar (`CLAUDE.md`):

- **Unit tests for every pure function** — grading especially (Vitest).
- **Playwright e2e for every learner-facing flow on Chromium AND WebKit** — the
  iframe/token handoff must stay Safari-proof. e2e always runs production builds
  (`next start`); dev-mode cold compiles swallow clicks pre-hydration.
- **RLS regression tests** — `pnpm test:rls` (`packages/db/test/rls.test.ts`):
  proves read-own/can't-read-others on progress, no self-written scores
  (quiz/XP/bug-report), and the sealed buggyshop schema. Run in the DB-backed stage.

Locators use `data-testid`s; see `e2e/tests/learn.spec.ts` for the pattern
(inline `signUpFreshLearner()` helper, `getByTestId`, both browser projects).

## CI

`ci.yml` runs lint, typecheck, unit tests, the curriculum sync validation, the
production build, the manifest-leak grep (`.next/static`, invariant 1), and the
Playwright e2e against a fresh local Supabase stack on Chromium + WebKit.

## Deploy

`deploy.yml` deploys **both apps to Vercel production on every push to `main`**
(Vercel CLI token; Vercel's own build gates it). For a local one-off deploy,
move `.git` aside first so Vercel doesn't block on the commit author, and pass
`--archive=tgz`. Full runbook + the two deploy gotchas:
[09 — Deployment](./09-deployment.md).

Next: [08 — Decisions](./08-decisions.md).
