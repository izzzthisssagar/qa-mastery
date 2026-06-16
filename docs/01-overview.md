# 01 — Overview

## What this is

**QA Mastery** is a learning platform that teaches software testing by *doing it*,
not watching it. Learners practise against a real, deliberately-buggy web app
(**BuggyShop**) instead of reading slides. The product is built from the QA study
corpus in the sibling notes repo (`../QA-Learning-Platform-Plan.md`, `../Product/`).

The system is a **two-app monorepo**:

| App | Port | Role |
|---|---|---|
| `apps/platform` | 3000 | The learning platform — lessons, quizzes, progress, the learner identity. |
| `apps/buggyshop` | 3001 | A fake e-commerce app seeded with real bugs. The practice ground learners test against. |

The split is deliberate and load-bearing — see [04 — Invariants](./04-invariants.md)
and [08 — Decisions](./08-decisions.md).

## Who it's for

Aspiring QA / automation testers learning the craft from manual testing through
Selenium + Java automation. The platform mirrors the two roadmaps in the notes
repo as two **tracks**:

| Track | Focus | Status |
|---|---|---|
| **Track A — Manual Testing Foundation** | SDLC → test design techniques → bug reports → a full test-cycle capstone | Authored across modules A1–A6 |
| **Track B — Automation Foundation** | "Just enough Java" → Selenium WebDriver → TestNG + Page Object Model → CI | Authored across modules B0–B5 |

The two tracks total **59 lessons**, all live.

Module/track metadata lives in `packages/curriculum/src/taxonomy.ts`.

## The mental model: See it · Try it · Do it · Prove it

Every lesson follows one pedagogy, encoded in the lesson MDX and the learn page:

1. **See it** — a live interactive *widget* shows the concept. For Boundary Value
   Analysis, the **Boundary Hunter** lets the learner walk a numeric field's edges
   and *discover* a seeded off-by-one bug themselves.
2. **Try it** — a guided worked example the learner reasons through.
3. **Do it** — a lab against the live BuggyShop app: find a seeded bug on the
   products page, then file a structured bug report that's graded against the
   server-only manifest. (Built for BVA against the BS-008 price-filter bug.)
4. **Prove it** — a quiz, graded server-side. Passing (≥70%) completes the
   lesson, awards XP, and seeds the lesson's flashcards into a spaced-repetition
   review queue.

**Boundary Value Analysis** (Track A, module A3) is the reference vertical these
docs walk through end to end — see [06 — The Learn feature](./06-learn-feature.md).

## What exists today

Phase 1 is **built, deployed, and verified in production**. Current build state:

| Capability | State |
|---|---|
| Monorepo, both apps, all packages | Built |
| Auth (signup/login, Supabase SSR), authenticated app shell | Built |
| Data model: registry, progress, quiz, XP, review queue, bug reports, capstone, entitlements, code runs, tutor memory, audit | Built (migrations 0001–0013) |
| Curriculum pipeline: MDX → DB registry sync | Built |
| Lessons: 59 across Track A (A1–A6) + Track B (B0–B5), MDX + server-only quiz keys | Built |
| Interactive widgets (boundary slider, decision table, state machine, automation pyramid, …) | Built |
| Graded work: quizzes, manifest-matched bug reports, rubric capstone, code runner (Judge0/Docker) | Built |
| AI tutor (free-first LLM, streaming answer-leak guard) | Built |
| Entitlements / Pro + Paddle checkout | Built (config-gated by `NEXT_PUBLIC_BILLING_ENABLED`) |
| RLS regression suite (`pnpm test:rls`) + manifest-leak CI grep | Built |
| Deployment: two Vercel projects + `deploy.yml` auto-deploy on push to `main` | Built — **live** |
| Fuller stateful BuggyShop defects, API/perf/security/DB tracks, Android | Phase 2 |

Next: [02 — Architecture](./02-architecture.md).
