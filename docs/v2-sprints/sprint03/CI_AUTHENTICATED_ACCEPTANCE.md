# Sprint 03 — CI-backed authenticated acceptance plan (WEB-S03-07)

**Date:** 2026-10-10 · **Candidate branch:** `work/v2-sprint03`
**Scope:** existing QA Mastery GitHub Actions CI, without adding hosted infrastructure or a new database.
**Latest completed baseline before this follow-up (2026-10-10):** PR #163 remains draft/unmerged. At head `93b44a8` against `main` `fdb33c2`, CI #423 and security #391 passed: all required CI jobs, RLS, first-paint, BuggyAPI, four core shards, report aggregation, and release gate are green; `e2e-full` is skipped by PR policy. The run reported 187 E2E cases, one WebKit retry, and no final failures. Security #391 passed the production dependency audit with 29 findings (6 low, 23 moderate, zero high/critical); the separately accepted development-only `braces@3.0.3` advisory remains disclosed and unsuppressed.

**Still open:** #418 artifact `11670103530` has not had its screenshot count or images visually reviewed here. Independent beginner acceptance remains NOT RUN. CI's local Supabase exists only inside the hosted test runner; it does not provide a human-accessible learner URL. No authorized resettable learner sandbox or verified PR preview has been confirmed. Do not use live aliases backed by shared Supabase data without a reset boundary. PR #164 merged separately and its production health checks passed; staging/Fly were skipped. The #418/#419 sections below are historical run records; use this as the latest completed baseline. This follow-up adds accessible checklist state and truthful completion copy; fresh CI/security runs are pending.

## Existing CI resources, verified from source

- `.github/workflows/ci.yml`: pull-request E2E core matrix, 4 shards, gated checks and merge/release reports.
- `.github/workflows/e2e-shard.yml`: per-runner `pnpm exec supabase start` on Ubuntu, export **local** API and auth keys into temporary job environment; `pnpm --filter @qa-mastery/curriculum sync --apply` seeds course registry, `pnpm build`, Playwright with pinned browser container and blob reporter.
- `e2e/playwright.config.ts`: existing core suite starts the built platform on `localhost:3000`; Chromium and WebKit projects.
- `e2e/tests/signup-helper.ts`: user-facing signup into local Supabase using a unique `@e2e.local` identity, with email confirmation disabled in local config. No service-role admin creation is needed.
- The original feature branch was published as **draft PR #163**. Its initial GitHub CI run (`38033582326`) executed against disposable local Supabase and exposed browser-test issues. See `CI_FAILURES_AND_REMEDIATION.md` for exact job evidence and scoped corrections.

## New candidate

`e2e/tests/manual-bva-v2-auth.spec.ts` is auto-collected by the existing **core** suite. It safeguards the origin to **HTTP localhost / 127.0.0.1**; never targets production or staging. It signs up a disposable learner, opens the protected existing BVA note, checks the actual manual-first heading, instructions, genuine figure image/alt/caption, blank worksheet HTTP 200, and runs one ungraded five-step checklist item with keyboard Enter.

The test then checks layout width at **390, 768, 1440px in both light and dark themes**, making **six viewport/theme evidence groups** (36 real, bounded **Figure + five checklist-step** element screenshots per browser run), attached to the existing Playwright blob report. Scoped element evidence avoids the old 32,767-pixel WebKit screenshot limit and keeps account-header email, session UI and cookies out of the images. Explicitly disabled traces, videos and automatic failure screenshots for this sensitive authenticated test. It does **not** click the XP completion button, run code, access hidden bug manifest or submit a graded exercise.

`e2e/test/manual-bva-v2-auth-ci.test.mjs` is a contract test: proves current CI path still starts/seeds **local** Supabase, the new spec is auto-collected, no credential-bearing reporting behavior was introduced, and the note/template/asset paths match the pilot.

## Quality gates and results

| Gate                                       | Result                  | Evidence                                                                                                                                                                                                                                              |
| ------------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source-plan inspection                     | PASS                    | Existing CI reusable workflow provides local Supabase, curriculum seed, browser reports                                                                                                                                                               |
| Test-first guard RED                       | PASS (expected failure) | `node --test e2e/test/manual-bva-v2-auth-ci.test.mjs` failed before spec file existed                                                                                                                                                                 |
| Guard GREEN                                | PASS                    | 5/5 contract checks after two red-first CI-failure regression cases                                                                                                                                                                                   |
| E2E TypeScript                             | PASS                    | `pnpm --filter @qa-mastery/e2e typecheck` after fixing browser type                                                                                                                                                                                   |
| Playwright collection                      | PASS                    | `playwright test --list --config playwright.config.ts manual-bva-v2-auth.spec.ts`, 2 tests collected: Chromium + WebKit                                                                                                                               |
| Authenticated CI execution                 | **PASS (#418)** | All four core shards passed; the new full-size image link was focused and activated with Enter in Chromium and WebKit. Three unrelated WebKit tests passed on retry |
| Screenshot visual/keyboard review          | **KEYBOARD PASS / VISUAL PARTIAL** | Keyboard activation passed in #418. The #418 Playwright report artifact (ID 11670103530) exists but its screenshots were not decoded; #410's 72/72 references and representative images remain verified |
| Human beginner test and release acceptance | **NOT RUN**             | Auth CI can verify UI contract, not usability/mastery                                                                                                                                                                                                 |
| Production service/database                | UNCHANGED               | A feature branch/PR was pushed; no production merge, hosted schema modification or application deployment was initiated by this work                                                                                                                  |

## Historical CI #418 result and continuing acceptance gates

- CI run #418 [38053684497](https://github.com/izzzthisssagar/qa-mastery/actions/runs/38053684497) tested code/test head `e21a374b4b226fcb4153aafbbb6086ba6940fdb0`. All four core shards passed, including the authenticated image-link Enter activation in Chromium and WebKit. Three unrelated WebKit tests passed on retry (notes bug-hunt, notes capstone, notification bell). Checks, live RLS, first-paint and BuggyAPI passed; `e2e-full` was skipped by workflow policy. The production dependency audit still found 47 items (7 low, 27 moderate, 10 high, 3 critical), so the security and release gates failed.
- The full-size image anchor is visible and keyboard-focusable at 390px; Enter activates a same-origin navigation with a 200 `image/png` response, then the test returns to the lesson and completes its remaining assertions. Chromium and WebKit both passed.
- The merged `playwright-report` artifact (ID `11670103530`) is retained through 2026-10-17. It has not been decoded for direct screenshot-count or visual review; #410 remains the manually reviewed screenshot baseline.
- At the time of #418, security PR #164 was still open and unmerged. It later merged as `fdb33c2`; current production/security status is recorded above. The development-only `braces@3.0.3` advisory remains disclosed and unsuppressed. No security lockfile was copied into Sprint 03.
- Retain independent beginner acceptance as a separate human-learning gate. Scripted browser success does not certify grading, user comprehension or WCAG conformance.

## Historical docs-only CI recheck — CI #419 (2026-10-10)

CI run [#419](https://github.com/izzzthisssagar/qa-mastery/actions/runs/38054501484) tested docs-only head `46e5220`; the application and test code were unchanged from the `e21a374` head validated by #418. Checks, live RLS, first-paint, BuggyAPI, all four core shards, and report aggregation passed: 183 E2E tests total, with no E2E failures. `e2e-full` was skipped by workflow policy. The production dependency audit reported 47 findings (7 low, 27 moderate, 10 high, 3 critical), so security and release gates failed downstream; secret scan and Dependabot validation passed.

The separate AI code-scanning workflow #13 could not create its review because the monthly quota was exhausted (HTTP 402). Its log reported no vulnerabilities in the changed documentation/static regions before that tooling failure. The #418 screenshots have not been decoded, local authenticated setup remains blocked by disk safety, and independent beginner acceptance remains NOT RUN.

## Constraints

- The existing preflight had only ~5.1 GiB free on Mac after successful recovery. Re-running local Supabase/Colima on that Mac is disallowed until there is adequate disk (recommend 12–15 GiB) or a disposable CI runner.
- CI #418 establishes **authenticated rendering and scripted interactions** for test-bearing head `e21a374`; those same tests passed again in CI #419 on docs-only head `46e5220`. These runs do not certify WCAG conformance, independent learner comprehension, graded test-case quality or hosted BuggyShop provisioning.
- Do not store access tokens, authenticated storage state, real email or personal account metadata in CI screenshot artifacts. Do not upload trace files of the auth flow.
- Existing CI is automatic for PRs and creates local disposable users/DBs; it is not a remote Supabase data reset. The mobile keyboard activation check passed in CI #418 at code/test head `e21a374`; the current follow-up only records that result.

### Remote-branch publication caveat

Read-only workflow audit confirmed `.github/workflows/deploy.yml` and `deploy-staging.yml` run only for `head_branch == 'main'`; PR #163 is not eligible for those production/staging jobs. Repository notes disagree about whether Vercel's separate Git integration can deploy this repository, and the connected deployment view provides no verifiable preview URL for head `93b44a8`. Treat preview availability as unconfirmed. The documented live aliases use shared `qa-mastery-staging` Supabase data and have no verified reset boundary, so they are not approved for learner acceptance.
