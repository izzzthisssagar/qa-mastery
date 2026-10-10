# Sprint 03 — CI failure reproduction and test-only remediation

**Date:** 2026-10-10 · **PR:** [#163](https://github.com/izzzthisssagar/qa-mastery/pull/163)
**Original SHA:** `0a2304981b5baa5715ef3f41e44d34564ccfcbf2`
**Failed CI run:** `38033582326` · **Historical status:** the scoped corrections passed core E2E in CI #411; the later mobile Enter-activation assertion passed in CI #418 at code/test head `e21a374`. The unresolved production dependency audit remains the release blocker.

## Failure evidence from actual GitHub Actions logs

| Job                           | Failed symptom                                                                                                                           | Root cause / disposition                                                                                                                                                                                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e2e-core (1)/run` Chromium   | Six `manual-bva-v2-browser.spec.ts` tests failed with `Page.navigate: Cannot navigate to invalid URL`, pointing to `page.goto("/cart")`  | The **existing core config does not set Playwright `baseURL`** (it boots platform on port 3000 and BuggyShop on 3001). The standalone pilot config supplied `baseURL:3011`, so these tests had previously appeared green only under the standalone configuration |
| `e2e-core (3)/run` WebKit     | Same six `page.goto("/cart")` invalid URL errors                                                                                         | Cross-browser replay of same test configuration defect                                                                                                                                                                                                           |
| `e2e-core (4)/run` WebKit     | Authenticated `manual-bva-v2-auth.spec.ts` failed `locator.screenshot: Cannot take screenshot larger than 32767 pixels on any dimension` | The **complete old and new MDX note** is taller than WebKit's screenshot limit. Capturing the entire article is unnecessary and unsafe for privacy. Visual evidence should target the genuine practice figure and checklist                                      |
| `e2e-core (4)/run` WebKit     | Existing `release-switch.spec.ts`: v1.1 quantity-zero rejection not visible in one attempt, but retried and passed as **flaky**          | Product's release is selected in a hydration effect; original test clicked before checking that the release had committed. More deterministic setup/assertions needed. **Do not alter seeded BS-007/BS-022 behavior**                                            |
| `security / dependency-audit` | Production audit blocked whole run (3 critical, 10 high inherited from `main`)                                                           | Independently fixed in **security-only draft PR #164**; PR #163 cannot be security-green while still based on the old `main`. Do not copy the security lockfile into this feature branch or bypass the audit                                                     |

## Test-only fixes applied to PR #163's isolated worktree

1. `e2e/tests/manual-bva-v2-browser.spec.ts`: resolve `BVA_PUBLIC_ORIGIN` (standalone) or `NEXT_PUBLIC_BUGGYSHOP_URL` (existing CI's `http://localhost:3001`) with a `http://127.0.0.1:3011` local fallback. Enforce HTTP loopback hostname and navigate by absolute `${BUGGYSHOP}/cart` in all four call sites. Do not call hosted endpoints.
2. `e2e/tests/manual-bva-v2-auth.spec.ts`: keep the real local learner signup and all lesson/worksheet/checklist/theme/responsiveness assertions; stop taking a giant `article.screenshot()`. Capture **two genuine DOM subsections** per width/theme: the exact BuggyShop Figure and the five-step mission section. These are real untouched browser screenshots, clipped by element scope, not altered or fabricated. The first corrected CI run produced **12 attachments per browser** (six responsive/theme combinations × Figure + long checklist); reviewers discovered fixed-position overlays in the long-checklist captures, so a later follow-up changes these to **36 shorter element captures per browser**, with no account header or email. The test retains `trace:off`, `video:off`, automatic `screenshot:off` to avoid leaking test-session data.
3. `e2e/tests/release-switch.spec.ts`: use production network-idle navigation, explicitly wait for public release selector to show v1.1, verify quantity input is 0 before clicking, and assert rejection with no accepted cart line. The test never fakes bug flags, intercepts requests, touches product logic or suppresses failed assertions.
4. `e2e/test/manual-bva-v2-auth-ci.test.mjs`: add **red-first contract tests** proving the public browser target is local and absolute and that authenticated screenshots are bounded to the practice regions. Tests moved from 3/5 to 5/5 as intended.

## Actual verification results and remaining gates

- **Contract TDD:** 2 new tests failed before correction and then **5/5 passed** after correction.
- **TypeScript:** `pnpm --filter @qa-mastery/e2e typecheck` **PASS** after source edits.
- **Standalone public Chrome:** `BVA_PUBLIC_ORIGIN=http://127.0.0.1:3011 pnpm --filter @qa-mastery/e2e exec playwright test --config playwright.manual-bva-v2.config.ts` **6/6 PASS**, with real local Next production-mode BuggyShop.
- **Release-switch:** 30/30 Chrome fresh-page original behavior observed rejecting zero under v1.1, plus **10/10 Chrome runs** with explicit release/hydration assertions. Neither result proves WebKit compatibility.
- **WebKit on Mac:** **NOT RUN locally**; the installed Playwright package had no WebKit executable and the machine had only ~4.8 GiB free. The pinned GitHub runner later executed the WebKit checks successfully in CI #411 and #418.
- **Authenticated note page in CI:** CI #418 passed all four core E2E shards, including the mobile Enter-activation assertion in Chromium and WebKit. The #418 report artifact exists but was not decoded for direct screenshot count/appearance review.
- **Security:** PR [#164](https://github.com/izzzthisssagar/qa-mastery/pull/164) has green GitHub security/CI and a zero critical/high _production_ audit; it remains **draft/unmerged**, so PR #163 still inherits the old vulnerable `main` baseline.
- **Human learning acceptance:** **NOT RUN**, regardless of future green technical CI. A beginner still must write and execute test cases independently and provide reviewed evidence.

## Original release gates (historical; latest results are below)

1. Publish the scoped corrections to the existing Sprint 03 branch. **Completed** in draft PR #163 through explicit authorization; the branch remains unmerged.
2. Confirm core E2E shards and the bounded screenshot flow. **Passed** in #411, then again in #418. The new image-link keyboard activation passed in Chromium and WebKit in #418; three unrelated WebKit tests passed after retry.
3. Keep security dependency ordering separate. **Still open:** the production audit fails on inherited dependencies; do not merge PR #164 implicitly or bypass audit.
4. Keep PR #163 in draft. No product grading changes or human-signoff claims.
5. Independent beginner acceptance remains **NOT RUN**.

## CI #409: All technical E2E shards green; screenshot evidence requires another iteration

**Follow-up SHA:** `8a857dd5667ecd7f4207ecb883ff7f8ea270a7e6` · GitHub CI run `38038368128`.

All four core E2E shards **passed** and the existing real Supabase-backed authenticated lesson executed in both Chromium and WebKit. The original relative-URL and oversize WebKit screenshot failures were resolved. Shard 4 showed **39 pass / one unrelated flaky** WebKit Talent "Title" selector strict-mode violation; one retry passed. This is an independent test-quality backlog, not a QA Mastery BVA failure. Security and overall release gates remain **red** because this branch uses vulnerable base `main`; security PR #164 is green but unmerged.

### Visual evidence review (actual WebKit blob report, not mocked images)

Downloaded raw `blob-report-core-core-4` artifact from this exact CI run and inspected the genuine images. The 12 bounded screenshots from the first improvement are authentic but **not suitable as clean visual acceptance evidence**:

- The Figure capture at 390px includes a fixed **Feedback** floating control crossing its lower caption.
- The five-step checklist `section` is still taller than the 900px mobile viewport. Playwright's stitched element screenshot includes fixed header/navigation and **Feedback** controls over instructional text. This is evidence contamination and **not proof that a learner cannot scroll to see the content in a normal viewport**.
- Original unmodified CI artifacts remain retained by GitHub (run `38038368128`); do not discard or repaint evidence.

### Second evidence-design improvement — CI #411 and #418 execution

- Keep the real `Figure` screenshot and capture each of the **five individual interactive checklist `<li>` elements** in place, rather than a single tall checklist `section`.
- Scroll each element into a **normal 900px viewport** with generous top/bottom space outside fixed controls, then assert its measured rectangle fits **between y=95 and y=785**, with height at most 620 CSS px. If that cannot be achieved the test must **fail**, not silently crop the obstruction.
- Capture the real DOM with untouched CSS, no Playwright `mask`/`style` option and no generated or edited screenshots. The resulting target is **36 element screenshots per browser**: 390, 768 and 1440 × light/dark × (1 Figure + 5 steps).
- After a contract test went red, the implemented method passed source contract and E2E TypeScript checks. CI #411 passed the prior core suite; CI #418 then passed all four core shards, including the mobile keyboard activation assertion in Chromium and WebKit. The #418 report artifact exists but was not decoded for direct screenshot verification.

**Other release gates remain unchanged:** no seeded bug/XP/grader/source product edits; no security-bypass; independent human BVA worksheet acceptance NOT RUN; separate security PR #164 cannot be implicitly merged.


## CI #411 follow-up — 2026-10-10

Run `38044152969` tested PR #163 head `3e0db7195bfd1087870f777c3e80b586fb09b59d`. All four core E2E shards passed. The production dependency audit reported 47 findings (7 low, 27 moderate, 10 high, 3 critical); the security/release gates failed downstream, while `e2e-full` was skipped by workflow policy. The separate security PR #164 remains draft and unmerged.

A merged `playwright-report` artifact (ID `11666901713`) is available until 2026-10-17. Its ZIP contents could not be inspected through the available connector, so the PR description's 72/72 screenshot count and visual appearance for #411 remain unverified in this review. CI #410's verified 72/72 evidence remains documented separately in `SCREENSHOT_MANIFEST.md`.

CI #418 executed that mobile-width focus and Enter activation check on code/test head `e21a374b4b226fcb4153aafbbb6086ba6940fdb0`; it passed in Chromium and WebKit. Local Supabase remains unrun on the Mac because of the documented disk-space safety limit. Independent beginner acceptance remains **NOT RUN**.


## CI #418 completion — 2026-10-10

CI run #418 [38053684497](https://github.com/izzzthisssagar/qa-mastery/actions/runs/38053684497) tested code/test head `e21a374b4b226fcb4153aafbbb6086ba6940fdb0`. All four core shards passed, including the authenticated image-link Enter activation in Chromium and WebKit. Three unrelated WebKit tests passed on retry (notes bug-hunt, notes capstone, notification bell). Checks, live RLS, first-paint and BuggyAPI passed; `e2e-full` was skipped by workflow policy. The production dependency audit still found 47 items (7 low, 27 moderate, 10 high, 3 critical), so the security and release gates failed.

The shard summaries were core-1 40 passed, core-2 40 passed, core-3 38 passed with two unrelated WebKit retries (notes bug-hunt and notes capstone), and core-4 39 passed with one unrelated WebKit retry (notification bell). All retries passed; none involved the authenticated lesson or image link. The new Enter activation passed in both browser projects. Run #418's merged report artifact is ID `11670103530` (expiry 2026-10-17); its screenshot contents remain unreviewed here.
