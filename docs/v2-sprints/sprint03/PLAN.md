# QA Mastery V2 — Sprint 03, Manual QA to BuggyShop Practice

**Record:** WEB-S03 / MANUAL-BVA-V2-P01 | **Date:** 2026-10-10
**Source base:** GitHub main commit `c1ba7c5d5037b3f52be72ed06e1ec57832eca3b1`; isolated worktree `work/v2-sprint03`.
**Status (2026-10-10):** pilot implementation is committed in draft PR #163. CI #411 passed all four core E2E shards at its prior head, while the production dependency audit/security-release gates failed. The current mobile keyboard test update is pending fresh CI. Not signed off, merged, or deployed.

## Problem and user outcome

V2 must support genuine manual QA learning before automation. In the existing `test-design-techniques/boundary-value-analysis` module the graded lab requires Python, and the worked-example note introduces code generation before a learner writes a real manual case. Sprint 03 supplies a beginner-friendly BuggyShop exercise and blank evidence template, with real product imagery while preserving optional Python/Java depth.

## Non-negotiable invariants

- Web-first; mobile application out of scope. Preserve 876-note taxonomy and all old topic slugs/content; do not replace the notes renderer or XP completion semantics.
- Do not query hidden BuggyShop truth/manifest as a learner, reveal internal seeded IDs/expected defects, or advertise a graded result for an ungraded worksheet.
- No DB migration, production access, app defect-flags, authentication or grading edits, or production deployment. The user separately approved additive test/status updates to draft PR #163; merge remains unauthorized.
- The screenshot is an actual local BuggyShop production-mode UI at quantity two, not a mock; label it a reference, not evidence of learner execution. Keep original unedited; do not paste tokens/account data.
- A value that cannot be reached through supported UI controls is **BLOCKED / NOT RUN**, not fabricated PASS/FAIL.

## Proven architecture/entry paths

- Curriculum: `packages/curriculum/content/notes/test-design-techniques/boundary-value-analysis/bva-worked-example.mdx`, rendered by existing notes getNote/MDX integration.
- Current code-run lab: `packages/curriculum/src/notes/labs.ts`, chapter `test-design-techniques/boundary-value-analysis`, `language:"python"`, `xp:40`; untouched in this sprint.
- BuggyShop public cart: `apps/buggyshop/src/app/cart/page.tsx`, local `/cart` screenshot/interaction; existing hidden bug flags/grading are untouched.
- Artifact: `apps/platform/public/labs/manual-qa-v2/BVA_EVIDENCE_TEMPLATE.md`, read-only static learner template.
- Screenshot: `apps/platform/public/notes/test-design-techniques/boundary-value-analysis/buggyshop-cart-v2-original.png`, identical to versioned original in sprint assets.
- Auth: platform protected notes cannot be fully browser-tested without an authorized local learner fixture; local Supabase/Docker was offline at preflight.

## SDLC and STLC work cards

| Card                 | Outcome                                                                                     | Inputs / owned paths                                                      | Acceptance and failure/rollback                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| S03-01 Baseline      | Safe, separate checkout and verified baseline                                               | .worktrees/v2-sprint03; preflight/status evidence                         | 25/25 initial curriculum tests and typecheck; original source status unaltered; no Git commit                                              |
| S03-02 Manual lesson | One existing BVA note gains manual-first QA exercise **before** language-dependent material | only `bva-worked-example.mdx`                                             | New section teaches requirement → three designed cases → reachable execution → evidence, and original CodePlayground + one Complete remain |
| S03-03 Real evidence | One genuine BuggyShop UI reference screenshot + blank test artifact                         | image original/public copy; static markdown template; screenshot manifest | URL, dimensions, PNG bytes, copy hash, no secrets/hidden seeded bug IDs; template distinguishes PASS/FAIL/BLOCKED/NOT RUN                  |
| S03-04 Regression    | Test-first source/asset contract and wider curriculum checks                                | `packages/curriculum/test/manual-bva-v2-pilot.test.ts`                    | RED observed before code; GREEN 3/3 after; full curriculum/link/MDX/typecheck and platform build with dummy env                            |
| S03-05 Acceptance    | Real authenticated note visual review + independent beginner exercise                       | acceptance log, real learner evidence (when available)                    | blocked/not run rather than invented; no XP/mastery claims or release without user sign-off                                                |

Dependency order: S03-01 → S03-02/03 → S03-04 → S03-05. One integrator owns note links, screenshot destination and release report; do not parallel-write the same MDX or shared taxonomy.

## Source-backed lesson scope

The product's cart describes a numeric shipping rule and a quantity selector; neither the exercise nor template supplies a seeded defect answer. A beginner must extract the rule, identify representable versus unreachable values, prewrite expected results independently, execute UI-reachable cases and report observed outcomes. An advanced learner can later automate the same cases, but no new grader or lesson schema is introduced.

The existing analogy worked example had contradictory wording about equality at a posted clearance; this pilot makes the simplified strict-boundary requirement internally consistent without claiming a universal real-world bridge safety rule.

## Explicit risk and release gates

- A screenshot showing the seeded threshold mismatch would leak the answer, so the reference was captured with quantity two and assessed visually.
- Real BuggyShop dev mode displayed an unresponsive quantity button. A separate Next production build (localhost:3011) returned 200, hydrated and updated quantity 1 → 2 correctly, with no page errors. Do not infer a production product defect from the dev-only observation.
- No live user has independently followed the three-case exercise. Protected QA Mastery MDX route screenshot/accessibility remains blocked by local Supabase unavailable; no Docker/Colima startup or database side effects approved.
- Release criteria: curriculum/test and platform checks pass, static download resolves, authenticated note page verified at multiple widths/theme/keyboard, independent learner evidence and SDLC/STLC sign-off. Until then **NOT RELEASE-READY**.

## Next bounded iteration after pilot

Draft test-design technique practice packs for equivalence classes, decision tables, state transitions and defect-report quality. The proposed scenario backlog is in `SCENARIO_MATRIX.md`; no new hidden-manifest behavior or grading is approved by drafting it.
