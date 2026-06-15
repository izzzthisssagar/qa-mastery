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

## Status — Feature Complete (V1)

**Done:** 
- Full monorepo scaffolding and Supabase RLS migrations.
- Both Tracks (Manual & Automation) are fully mapped with MDX content.
- 10+ premium, animated interactive widgets deployed.
- UX Gamification (Milestone Unlocked badges, Quiz Confetti, Flashcard queues).
- Full sync pipeline for the curriculum.

**Next Horizons:**
- Integrate the grading engine with a Sandbox execution environment to safely run user-submitted Playwright scripts.
- Expand BuggyShop features with more complex, stateful defects.
- Deploy to Vercel and Supabase Cloud.
