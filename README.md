# QA Mastery

The hands-on QA learning platform — **"Don't watch testing. Do it."**

**Live:** [qa-mastery-platform.vercel.app](https://qa-mastery-platform.vercel.app)
· practice app [qa-mastery-buggyshop.vercel.app](https://qa-mastery-buggyshop.vercel.app)
· a green CI run on `main` auto-deploys both, the exact commit CI verified (see
[`docs/09-deployment.md`](./docs/09-deployment.md)). A third practice app,
BuggyAPI, exists in the monorepo (`apps/buggyapi`) but isn't provisioned on
Vercel yet.

Learners study every QA concept visually, practice on a deliberately flawed
e-commerce app (**BuggyShop**), and get their work auto-graded. We've transformed theoretical testing education into a highly interactive, gamified, and premium experience.

## Features & Philosophy

- **No "Wall of Text":** Lessons are powered by MDX and broken up by beautiful, interactive React widgets built with Framer Motion.
- **Track A (Manual Testing):** Students interact with an SDLC Visualizer, an interactive Kanban Jira Board, a Testing Types sorter, and a Session-Based Exploratory Testing timer.
- **Track B (Automation):** Students interact with a Boundary Value slider, the Automation Pyramid, WebDriver architecture flows, TestNG Lifecycles, and a Page Object Model (POM) visualizer.
- **The "Prove it" Loop:** Every lesson ends with a Quiz Panel. Passing (>70%) fires a dopamine-inducing confetti explosion and unlocks Spaced Repetition Flashcards.
- **Integrated Practice (BuggyShop):** A purpose-built, sandboxed Next.js e-commerce app (port 3001) seeded with intentional defects for students to hunt, write test plans for, and automate against.

## Layout

| Path                              | What it is                                                                                            |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apps/platform`                   | The learning platform (Next.js, port 3000) — auth, notes wiki, grading, tutor, talent                 |
| `apps/buggyshop`                  | The practice app (Next.js, port 3001) — fake auth, sandboxed data, seeded bugs                        |
| `apps/buggyapi`                   | A second practice app (Next.js, port 3002) — REST/GraphQL/SOAP API with seeded bugs, not yet deployed |
| `services/buggyapi-ws`            | BuggyAPI's WebSocket practice surface, deployed to Fly.io                                             |
| `packages/curriculum`             | Notes wiki + lesson MDX, frontmatter schemas, content→DB sync script, RAG embedding                   |
| `packages/widgets`                | Interactive lesson widgets (registry-validated & animated)                                            |
| `packages/grading`                | Pure scoring functions: quizzes, bug-report matching, runner seam                                     |
| `packages/agent`                  | Tutor LLM adapter (provider failover, streaming guard)                                                |
| `packages/shared`                 | Sandbox token contract (platform ↔ BuggyShop/BuggyAPI handoff)                                       |
| `packages/db`                     | Supabase client factories + generated types                                                           |
| `packages/ui` / `packages/config` | Design-system primitives / shared tsconfig + eslint config                                            |
| `supabase/`                       | Migrations, seed, local-stack config (one DB, `public` + `buggyshop` + `buggyapi` schemas)            |
| `e2e/`                            | Cross-app Playwright suite (Chromium + WebKit), sharded in CI                                         |

## Getting started

```bash
pnpm install
# local Supabase stack (requires Docker Desktop):
pnpm db:start          # prints anon/service keys
pnpm db:status         # copy keys into apps/*/.env.local (template: .env.example)
pnpm dev               # platform :3000, buggyshop :3001, buggyapi :3002
```

Quality gates (all must stay green; CI runs the same):

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e
pnpm --filter @qa-mastery/curriculum sync --apply   # validate and sync lesson content
```

### Help-agent tutor (free)

The in-app tutor resolves an LLM provider **free-first**: Ollama (local) →
Gemini → Groq, and only uses a paid provider (xAI/OpenAI) when one is selected
explicitly via `HELP_AGENT_PROVIDER`. The zero-cost, no-quota path is Ollama:

```bash
brew install ollama           # or https://ollama.com/download
brew services start ollama    # local server on :11434
ollama pull llama3.2:3b       # ~2 GB, one-time
# then in apps/platform/.env.local:
#   OLLAMA_BASE_URL=http://127.0.0.1:11434
```

With that set, the tutor runs entirely locally for free. A Gemini free-tier key
(`GEMINI_API_KEY`, from aistudio.google.com) works too and is the recommended
free option for hosted deploys. See `.env.example` for all provider vars.

## Status — Phase 1 LIVE

Phase 1 of the [product plan](../My%20Qa%20Projecct/QA-Learning-Platform-Plan.md)
(Web MVP: Manual + Automation) is **built, deployed, and verified** — platform
and BuggyShop run on Vercel, the full learner loop (signup → note → widget →
graded quiz → completion + XP) is confirmed in production, and a green CI run
on `main` redeploys the exact verified commit automatically. Built:

- **Curriculum** — the notes wiki: ~900 topics across modules/chapters as MDX,
  read directly (no DB registry) — server-only quiz/lab answer keys where a
  chapter has one. A separate, older lessons system (`packages/curriculum/src/
load.ts`) exists in the code but has no live content in this checkout.
- **Interactive widgets** — boundary slider, decision table, state machine,
  pairwise visualiser, automation pyramid, and more (all motion + reduced-motion).
- **Practice apps** — BuggyShop (release-flagged seeded bugs) and BuggyAPI (a
  REST/GraphQL/SOAP API with sandbox-mode-flagged seeded bugs; not yet deployed).
- **Graded work** — quizzes, structured bug reports (matched to the seeded
  manifest), a rubric-graded capstone, and a live **code runner** (Wandbox by
  default, Judge0/Docker as an opt-in override) for automation labs.
- **AI tutor** — Socratic help-agent, free-first LLM (Ollama/Gemini), with a
  streaming answer-leak guard.
- **Platform** — XP/progress dashboard, Pro entitlements + lock badge + Paddle
  checkout (config-gated), spaced-repetition review queue, a talent marketplace.
- **Production hardening** — RLS throughout, audit trail, per-day rate limits +
  ownership on code runs, baseline security headers, `/api/health` probes,
  founder analytics views + retention, a sharded CI pipeline (lint/types/test/
  build/e2e + a reusable secret-scan/dep-audit security workflow + a merged
  Playwright report) and a gated, exact-commit staging-deploy workflow.

- **Deployment** — Vercel projects per app (platform + BuggyShop live,
  BuggyAPI not yet provisioned) from this monorepo, deployed via the Vercel
  CLI token; `.github/workflows/deploy.yml` triggers on CI's own completion
  and deploys exactly the commit CI verified. See
  [`docs/09-deployment.md`](./docs/09-deployment.md).

**Remaining owner toggles** (not code — config): Supabase email-confirm off, a
free `GEMINI_API_KEY` for the tutor, optional Paddle keys. See
[`DEPLOYMENT.md`](./DEPLOYMENT.md) §2–§4. Architecture in
[`ARCHITECTURE.md`](./ARCHITECTURE.md); full docs in [`docs/`](./docs/README.md).

**Phase 2 (later):** API/perf/security/DB tracks, richer stateful BuggyShop
defects, Playwright/JS secondary stack, Android app.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the local setup, the
`pnpm verify` quality gate, seeded-bug rules, and migration conventions.
Participation is governed by the
[Contributor Covenant](./CODE_OF_CONDUCT.md). Found a security issue? Don't
open a public issue — see [`SECURITY.md`](./SECURITY.md).

## License

[MIT](./LICENSE)
