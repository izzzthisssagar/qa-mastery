# Sprint 03 — CI-backed authenticated acceptance plan (WEB-S03-07)

**Date:** 2026-10-10 · **Candidate branch:** `work/v2-sprint03`
**Scope:** existing QA Mastery GitHub Actions CI, without adding hosted infrastructure or a new database. **Not committed, not pushed, not run on CI yet.**

## Existing CI resources, verified from source

- `.github/workflows/ci.yml`: pull-request E2E core matrix, 4 shards, gated checks and merge/release reports.
- `.github/workflows/e2e-shard.yml`: per-runner `pnpm exec supabase start` on Ubuntu, export **local** API and auth keys into temporary job environment; `pnpm --filter @qa-mastery/curriculum sync --apply` seeds course registry, `pnpm build`, Playwright with pinned browser container and blob reporter.
- `e2e/playwright.config.ts`: existing core suite starts the built platform on `localhost:3000`; Chromium and WebKit projects.
- `e2e/tests/signup-helper.ts`: user-facing signup into local Supabase using a unique `@e2e.local` identity, with email confirmation disabled in local config. No service-role admin creation is needed.
- A change to an uncommitted worktree **cannot be exercised by a remote GitHub Actions runner**. Only a later authorized branch push/PR makes the new test available to CI; the current action was preparation and local static verification.

## New candidate

`e2e/tests/manual-bva-v2-auth.spec.ts` is auto-collected by the existing **core** suite. It safeguards the origin to **HTTP localhost / 127.0.0.1**; never targets production or staging. It signs up a disposable learner, opens the protected existing BVA note, checks the actual manual-first heading, instructions, genuine figure image/alt/caption, blank worksheet HTTP 200, and runs one ungraded five-step checklist item with keyboard Enter.

The test then checks layout width at **390, 768, 1440px in both light and dark themes**, making six **article-only** screenshots for review and attaching them to the existing Playwright blob report. Article-only evidence avoids account-header email, session UI and cookies. Explicitly disabled traces, videos and automatic failure screenshots for this sensitive authenticated test. It does **not** click the XP completion button, run code, access hidden bug manifest or submit a graded exercise.

`e2e/test/manual-bva-v2-auth-ci.test.mjs` is a contract test: proves current CI path still starts/seeds **local** Supabase, the new spec is auto-collected, no credential-bearing reporting behavior was introduced, and the note/template/asset paths match the pilot.

## Quality gates and results

| Gate                                       | Result                  | Evidence                                                                                                                |
| ------------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Source-plan inspection                     | PASS                    | Existing CI reusable workflow provides local Supabase, curriculum seed, browser reports                                 |
| Test-first guard RED                       | PASS (expected failure) | `node --test e2e/test/manual-bva-v2-auth-ci.test.mjs` failed before spec file existed                                   |
| Guard GREEN                                | PASS                    | 3/3 contract checks, Node test runner                                                                                   |
| E2E TypeScript                             | PASS                    | `pnpm --filter @qa-mastery/e2e typecheck` after fixing browser type                                                     |
| Playwright collection                      | PASS                    | `playwright test --list --config playwright.config.ts manual-bva-v2-auth.spec.ts`, 2 tests collected: Chromium + WebKit |
| Authenticated CI execution                 | **NOT RUN**             | No feature branch pushed/PR; Mac local Supabase blocked by disk-space incident                                          |
| Screenshot visual/keyboard review          | **NOT RUN**             | Six screenshot attachments will be produced _only during future CI execution_; manual reviewer must inspect them        |
| Human beginner test and release acceptance | **NOT RUN**             | Auth CI can verify UI contract, not usability/mastery                                                                   |
| Production service/database                | UNCHANGED               | No hosted action, push, deployment, or schema alteration                                                                |

## Future gated remote execution

1. Confirm isolated Sprint 03 source changes satisfy review, decide on combining Sprint 02/Postman and Sprint 03/BVA changes into one release candidate (they are currently **separate, uncommitted worktrees**).
2. With user approval, create a feature commit/PR in the appropriate reviewed branch. **Do not merge to `main` or deploy as an implication of these tests.**
3. Let the existing `ci.yml` pull-request workflow run. Check full e2e-core shard and Playwright merged HTML/Blob report, not just the fast lint/typecheck jobs.
4. Verify the new signed-in test passed in both browsers, and inspect attached **six article-only screenshots**, including light/dark mobile text wrapping, image and keyboard focus.
5. Investigate any failures with local/test-only evidence; do not weaken authentication checks or substitute a mocked note.
6. Run one actual independent beginner session, collect real case-design/evidence feedback, classify the known BuggyShop UX/a11y findings, and approve release separately.

## Constraints

- The existing preflight had only ~5.1 GiB free on Mac after successful recovery. Re-running local Supabase/Colima on that Mac is disallowed until there is adequate disk (recommend 12–15 GiB) or a disposable CI runner.
- A successful CI run would establish **authenticated rendering and scripted interactions**; it would not certify WCAG conformance, independent learner comprehension, graded test-case quality or hosted BuggyShop provisioning.
- Do not store access tokens, authenticated storage state, real email or personal account metadata in CI screenshot artifacts. Do not upload trace files of the auth flow.
- Existing CI is automatic for PRs and creates local disposable users/DBs; it is not a remote Supabase data reset. Actual remote CI usage is outside this unpushed turn.

### Remote-branch publication caveat

Read-only workflow audit confirmed `.github/workflows/deploy.yml` and `deploy-staging.yml` run after CI only when `head_branch == 'main'`, so a feature PR is not eligible for those two production/staging deploy jobs. However, `deploy-staging.yml` itself notes that Vercel's **separate Git integration** may auto-deploy preview builds on branch pushes. No preview-deployment setting was inspected or changed here. Branch push/PR is therefore an explicit external-action approval gate, not a zero-side-effect action; check Vercel preview settings before publication.
