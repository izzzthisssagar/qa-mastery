# QA Mastery

The hands-on QA learning platform — **"Don't watch testing. Do it."**

Learners study every QA concept visually, practice on a deliberately flawed
e-commerce app (**BuggyShop**), and get their work auto-graded. We've transformed theoretical testing education into a highly interactive, gamified, and premium experience.

## Features & Philosophy

- **No "Wall of Text":** Lessons are powered by MDX and broken up by beautiful, interactive React widgets built with Framer Motion. 
- **Track A (Manual Testing):** Students interact with an SDLC Visualizer, an interactive Kanban Jira Board, a Testing Types sorter, and a Session-Based Exploratory Testing timer.
- **Track B (Automation):** Students interact with a Boundary Value slider, the Automation Pyramid, WebDriver architecture flows, TestNG Lifecycles, and a Page Object Model (POM) visualizer.
- **The "Prove it" Loop:** Every lesson ends with a Quiz Panel. Passing (>70%) fires a dopamine-inducing confetti explosion and unlocks Spaced Repetition Flashcards.
- **Integrated Practice (BuggyShop):** A purpose-built, sandboxed Next.js e-commerce app (port 3001) seeded with intentional defects for students to hunt, write test plans for, and automate against.

## Layout

| Path | What it is |
|---|---|
| `apps/platform` | The learning platform (Next.js, port 3000) — auth, lessons, grading |
| `apps/buggyshop` | The practice app (Next.js, port 3001) — fake auth, sandboxed data, seeded bugs |
| `packages/curriculum` | Lesson MDX + frontmatter schema + content→DB sync script |
| `packages/widgets` | Interactive lesson widgets (registry-validated & animated) |
| `packages/grading` | Pure scoring functions: quizzes, bug-report matching, runner seam |
| `packages/shared` | Sandbox token contract (platform ↔ BuggyShop handoff) |
| `packages/db` | Supabase client factories + generated types |
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
pnpm --filter curriculum sync --apply   # validate and sync lesson content
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

## Status — Phase 1 complete (code), deploy-ready

Phase 1 of the [product plan](../QA-Learning-Platform-Plan.md) (Web MVP: Manual +
Automation) is **feature-complete and green** (`main` CI passes). Built:

- **Curriculum** — 59 lessons (Track A manual ×30, Track B automation ×29) as MDX
  + server-only quiz keys, synced into a Supabase registry.
- **Interactive widgets** — boundary slider, decision table, state machine,
  pairwise visualiser, automation pyramid, and more (all motion + reduced-motion).
- **Practice app** — BuggyShop with release-flagged seeded bugs across its pages.
- **Graded work** — quizzes, structured bug reports (matched to the seeded
  manifest), a rubric-graded capstone, and a live **code runner** (Judge0/Docker)
  for automation labs.
- **AI tutor** — Socratic help-agent, free-first LLM (Ollama/Gemini), with a
  streaming answer-leak guard.
- **Platform** — XP/progress dashboard, Pro entitlements + lock badge + Paddle
  checkout (config-gated), spaced-repetition review queue.
- **Production hardening** — RLS throughout, audit trail, per-day rate limits +
  ownership on code runs, baseline security headers, `/api/health` probes,
  founder analytics views + retention, green CI (lint/types/test/build/e2e +
  gitleaks + dep-audit) and a gated staging-deploy workflow.

**To publish:** the code is done; going live is now a config checklist — see
[`DEPLOYMENT.md`](./DEPLOYMENT.md) §6 (Vercel import, Supabase env, tutor key,
optional Paddle). Architecture overview in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

**Phase 2 (later):** API/perf/security/DB tracks, richer stateful BuggyShop
defects, Playwright/JS secondary stack, Android app.
