# QA Mastery — Engineering Documentation

> Maintained by **Sagar** (izzzthisssagar). Last updated June 2026.

This folder documents the **QA Mastery** monorepo: the learning platform
(`apps/platform`), the deliberately-buggy practice app (`apps/buggyshop`), the
shared packages, and the Supabase data model. It answers *what / why / how* for
every major part so a new engineer can understand and extend the system.

These docs describe **what the code actually does today**. Where something is
designed-for-but-not-yet-built (entitlements, the live BuggyShop lab, the
runner), it is labelled **Planned**. The source of engineering truth is the
code; the product "why" comes from the sibling notes repo
(`../QA-Learning-Platform-Plan.md`, `../Product/`).

## Start here

New to the codebase? Read in this order:

1. [01 — Overview](./01-overview.md) — what the product is and the mental model.
2. [02 — Architecture](./02-architecture.md) — monorepo layout, stack, auth flow.
3. [04 — Invariants](./04-invariants.md) — the seven non-negotiable rules. **Read before changing anything.**
4. [06 — The Learn feature](./06-learn-feature.md) — the one end-to-end vertical that exists today.
5. [07 — Development](./07-development.md) — get it running locally.

## Index

| Doc | What it covers |
|---|---|
| [01-overview.md](./01-overview.md) | Product, audience, the two-app model, the two tracks, the See/Try/Do/Prove pedagogy. |
| [02-architecture.md](./02-architecture.md) | Monorepo layout, tech stack + rationale, package graph, the three-layer auth boundary. |
| [03-data-model.md](./03-data-model.md) | Every table by domain: registry, learner progress, BuggyShop sandbox, profiles. RLS + who writes. |
| [04-invariants.md](./04-invariants.md) | The 7 invariants from `CLAUDE.md` — what, why, and how each is enforced. |
| [05-curriculum-and-content.md](./05-curriculum-and-content.md) | MDX + frontmatter, server-only quiz keys, the registry sync, taxonomy, flashcards. |
| [06-learn-feature.md](./06-learn-feature.md) | Deep dive on the M1 learn route: RSC MDX, the lesson flow, server actions, answer-key secrecy. |
| [07-development.md](./07-development.md) | Runbook: prerequisites, commands, env setup, adding a lesson/widget, the testing bar. |
| [08-decisions.md](./08-decisions.md) | ADR-style records for the notable engineering decisions. |

## Conventions in these docs

- File paths are repo-relative, e.g. `apps/platform/src/app/(app)/learn/[slug]/page.tsx`.
- **Planned** marks behaviour that is designed but not yet implemented.
- Milestones referenced throughout: **M0** = scaffold (done), **M1** = walking
  skeleton / first lesson + lab, **M2–M4** = depth, **M3** = billing &
  entitlements. These come from the product plan.
