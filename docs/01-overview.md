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
| **Track A — Manual Testing Foundation** | SDLC → test design techniques → bug reports → a full test-cycle capstone | Ships first; the opening lesson exists today |
| **Track B — Automation Foundation** | "Just enough Java" → Selenium WebDriver → TestNG + Page Object Model → CI | **Planned** |

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

The one fully-built vertical today is **Boundary Value Analysis** (Track A,
module A3). It is the reference example for everything in these docs — see
[06 — The Learn feature](./06-learn-feature.md).

## What exists today vs. Planned

| Capability | State |
|---|---|
| Monorepo, both apps, all packages, CI | Built (M0) |
| Auth (signup/login, Supabase SSR), authenticated app shell | Built |
| Data model: registry, progress, quiz, XP, review queue, BuggyShop sandbox | Built (migrations 0001–0004) |
| Curriculum pipeline: MDX → DB registry sync | Built |
| First lesson end-to-end: BVA lesson + Boundary Hunter widget + graded quiz | Built (M1) |
| Live "Do it" lab: BuggyShop products page + bug-report form, graded against the manifest | Built (M1) |
| `bugFlag(id, release)` seeded-bug wrapper | Built (one bug — BS-008 — wired so far) |
| RLS regression suite (`pnpm test:rls`) | Built |
| BuggyShop beyond the products page (cart, checkout, the other ~19 bugs) | **Planned** |
| Entitlements / billing (Pro lessons) | **Planned** (M3) |
| Code runner (Track B automation labs) | **Planned** (`NullRunner` stub exists) |

Next: [02 — Architecture](./02-architecture.md).
