# Sprint 03 — CI-backed authenticated acceptance plan (WEB-S03-07)

**Date:** 2026-10-10 · **Candidate branch:** `work/v2-sprint03`
**Scope:** existing QA Mastery GitHub Actions CI, without adding hosted infrastructure or a new database. **Current status (2026-10-10):** draft PR #163's run #411 (`38044152969`) passed all four core E2E shards on prior head `3e0db7195bfd1087870f777c3e80b586fb09b59d`; its production dependency audit and downstream security/release gates failed. This update adds a mobile keyboard activation assertion for the full-size PNG link, so that change requires a fresh exact-head CI run. Local Supabase on the Mac remains blocked by the recorded disk-safety limit; CI uses disposable local Supabase on hosted runners.

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
| Authenticated CI execution                 | **CORE CI PASS (#411)** | All four core shards passed at prior PR head; the merged Playwright report exists but the per-spec report was not decoded in this review. Current mobile Enter-activation assertion is pending a fresh run |
| Screenshot visual/keyboard review          | **PARTIAL / UNVERIFIED** | #410's 72/72 screenshot references and representative images were verified; #411's report artifact (ID 11666901713) exists but was not decoded. Mobile keyboard activation is pending the current commit's CI |
| Human beginner test and release acceptance | **NOT RUN**             | Auth CI can verify UI contract, not usability/mastery                                                                                                                                                                                                 |
| Production service/database                | UNCHANGED               | A feature branch/PR was pushed; no production merge, hosted schema modification or application deployment was initiated by this work                                                                                                                  |

## Next gated CI verification

1. Allow the authorized additive update to draft PR #163 to trigger a fresh exact-head CI run; keep the PR in draft and do not merge.
2. Confirm the full-size image link is visible at 390px, receives keyboard focus, and Enter navigates to the same-origin PNG with a successful `image/png` response in both Chromium and WebKit. Confirm the lesson checks continue after returning to the note.
3. Inspect the merged Playwright report and screenshot attachments if the available artifact can be decoded. The #411 artifact is retained through 2026-10-17 but was not decoded in this review; do not treat its PR-body 72/72 count as independently verified.
4. Keep the separate security PR #164 as an unresolved release prerequisite. PR #163 remains based on the vulnerable production dependency graph; do not suppress the audit or copy the security lockfile into Sprint 03.
5. Retain independent beginner acceptance as a separate human-learning gate. Scripted browser success does not certify grading, user comprehension or WCAG conformance.

## Constraints

- The existing preflight had only ~5.1 GiB free on Mac after successful recovery. Re-running local Supabase/Colima on that Mac is disallowed until there is adequate disk (recommend 12–15 GiB) or a disposable CI runner.
- A successful CI run would establish **authenticated rendering and scripted interactions**; it would not certify WCAG conformance, independent learner comprehension, graded test-case quality or hosted BuggyShop provisioning.
- Do not store access tokens, authenticated storage state, real email or personal account metadata in CI screenshot artifacts. Do not upload trace files of the auth flow.
- Existing CI is automatic for PRs and creates local disposable users/DBs; it is not a remote Supabase data reset. Run #411 tested the prior PR head. The mobile keyboard activation assertion in this update is pending its own fresh CI result.

### Remote-branch publication caveat

Read-only workflow audit confirmed `.github/workflows/deploy.yml` and `deploy-staging.yml` run after CI only when `head_branch == 'main'`, so a feature PR is not eligible for those two production/staging deploy jobs. However, `deploy-staging.yml` itself notes that Vercel's **separate Git integration** may auto-deploy preview builds on branch pushes. No preview-deployment setting was inspected or changed here. A branch push may create a Vercel preview. The user explicitly authorized this additive update to draft PR #163; preview settings were not inspected or changed.
