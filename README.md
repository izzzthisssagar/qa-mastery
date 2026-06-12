# QA Mastery

The hands-on QA learning platform — **"Don't watch testing. Do it."**
Learners study every QA concept visually, practice on a deliberately flawed
e-commerce app (**BuggyShop**), and get their work auto-graded.

Product plan & curriculum live in the notes repo
(`../My Qa Projecct/QA-Learning-Platform-Plan.md` + `Product/`). This repo is
the platform itself.

## Layout

| Path | What it is |
|---|---|
| `apps/platform` | The learning platform (Next.js, port 3000) — auth, lessons, grading |
| `apps/buggyshop` | The practice app (Next.js, port 3001) — fake auth, sandboxed data, seeded bugs |
| `packages/curriculum` | Lesson MDX + frontmatter schema + content→DB sync script |
| `packages/widgets` | Interactive lesson widgets (registry-validated) |
| `packages/grading` | Pure scoring functions: quizzes, bug-report matching, runner seam |
| `packages/shared` | Sandbox token contract (platform ↔ BuggyShop handoff) |
| `packages/db` | Supabase client factories + (soon) generated types |
| `packages/ui` / `packages/config` | Design-system primitives / shared tsconfig |
| `supabase/` | Migrations, seed, local-stack config (one DB, `public` + `buggyshop` schemas) |
| `e2e/` | Cross-app Playwright suite (Chromium + WebKit) |

## Getting started

```bash
pnpm install
# local Supabase stack (requires Docker Desktop):
pnpm db:start          # prints anon/service keys
pnpm db:status         # copy keys into apps/*/.env.local (template: .env.example)
pnpm dev               # platform on :3000, buggyshop on :3001
```

Quality gates (all must stay green; CI runs the same):

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e
pnpm --filter @qa-mastery/curriculum sync   # validate lesson content
```

## Status — M0 scaffold

Done: monorepo, both apps, packages, migration 0001 (profiles/registry/
progress/sandboxes + RLS), email+password auth, dashboard shell, BuggyShop
shell + `/enter` handoff stub, CI workflow, 17 unit tests + 4 e2e smoke tests.

Pending cloud wiring (needs accounts): Docker Desktop (local DB), GitHub
remote, Vercel projects ×2, Supabase cloud projects (staging + prod), domain,
PostHog. Then M1: the walking skeleton (first lesson + mini-BuggyShop + first
graded bug report).
