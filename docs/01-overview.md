# 01 — Overview

## What this is

**QA Mastery** is a learning platform that teaches software testing by _doing it_,
not watching it. Learners practise against real, deliberately-buggy web apps
(**BuggyShop**, **BuggyAPI**) instead of reading slides. The product is built
from the QA study corpus in the sibling notes repo
(`../My Qa Projecct/QA-Learning-Platform-Plan.md`, `../My Qa Projecct/Product/`).

The system context (apps, service, package DAG) is canonical in
[`ARCHITECTURE.md`](../ARCHITECTURE.md) — not repeated here to avoid two
copies drifting apart. Short version: platform (`:3000`, the learning
platform) plus two deliberately-buggy practice apps, BuggyShop (`:3001`) and
BuggyAPI (`:3002`, not yet deployed), plus a Fly.io WebSocket service for
BuggyAPI's practice surface.

The split is deliberate and load-bearing — see [04 — Invariants](./04-invariants.md)
and [08 — Decisions](./08-decisions.md).

## Who it's for

Aspiring QA / automation testers learning the craft from manual testing through
Selenium + Java automation. The platform mirrors the two roadmaps in the notes
repo as two **tracks**:

| Track                                   | Focus                                                                     | Status                        |
| --------------------------------------- | ------------------------------------------------------------------------- | ----------------------------- |
| **Track A — Manual Testing Foundation** | SDLC → test design techniques → bug reports → a full test-cycle capstone  | Authored across modules A1–A6 |
| **Track B — Automation Foundation**     | "Just enough Java" → Selenium WebDriver → TestNG + Page Object Model → CI | Authored across modules B0–B5 |

The pedagogy below was authored against **lessons** — MDX files under
`packages/curriculum/content/<track>/**`, backed by a DB registry
(`packages/curriculum/src/load.ts`). This checkout has **zero** live lesson
`.mdx` files (`pnpm --filter @qa-mastery/curriculum sync` reports 0); the
live curriculum surface today is the **notes wiki**
(`packages/curriculum/src/notes/**`, MDX under `content/notes/**`, ~900
topics), which embeds a similar set of interactive elements directly in note
content rather than through the separate lesson/quiz/lab pipeline described
below. Treat this section as the pedagogy design intent, not a description of
what's live — see [05 — Curriculum and content](./05-curriculum-and-content.md)
for the notes wiki itself.

Module/track metadata lives in `packages/curriculum/src/taxonomy.ts`.

## The mental model: See it · Try it · Do it · Prove it

Every lesson follows one pedagogy, encoded in the lesson MDX and the learn page:

1. **See it** — a live interactive _widget_ shows the concept. For Boundary Value
   Analysis, the **Boundary Hunter** lets the learner walk a numeric field's edges
   and _discover_ a seeded off-by-one bug themselves.
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

| Capability                                                                                                                   | State                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Monorepo: 3 apps, 1 service, all packages                                                                                    | Built                                                                             |
| Auth (signup/login, Supabase SSR), authenticated app shell                                                                   | Built                                                                             |
| Data model: registry, progress, quiz, XP, review queue, bug reports, capstone, entitlements, code runs, tutor memory, audit  | Built (`supabase/migrations/`, count grows over time)                             |
| Curriculum pipeline: MDX → DB registry sync (lessons), direct filesystem read (notes wiki)                                   | Built                                                                             |
| Notes wiki: ~900 topics across modules/chapters, MDX + server-only quiz/lab keys where present                               | Built — **live** (lessons system exists but has no live content in this checkout) |
| Interactive widgets (boundary slider, decision table, state machine, automation pyramid, …)                                  | Built                                                                             |
| Graded work: quizzes, manifest-matched bug reports, rubric capstone, code runner (Wandbox by default, Judge0/Docker opt-in)  | Built                                                                             |
| AI tutor (free-first LLM, streaming answer-leak guard)                                                                       | Built                                                                             |
| Entitlements / Pro + Paddle checkout                                                                                         | Built (config-gated by `NEXT_PUBLIC_BILLING_ENABLED`)                             |
| RLS regression suite (`pnpm test:rls`) + manifest-leak CI grep                                                               | Built                                                                             |
| Deployment: Vercel projects (platform + BuggyShop live, BuggyAPI pending) + `deploy.yml` gated on CI's exact verified commit | Built — **live**                                                                  |
| Fuller stateful BuggyShop defects, API/perf/security/DB tracks, Android                                                      | Phase 2                                                                           |

Next: [02 — Architecture](./02-architecture.md).
