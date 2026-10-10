# Sprint 03 — CI failure reproduction and test-only remediation

**Date:** 2026-10-10 · **PR:** [#163](https://github.com/izzzthisssagar/qa-mastery/pull/163)
**Original SHA:** `0a2304981b5baa5715ef3f41e44d34564ccfcbf2`
**Failed CI run:** `38033582326` · **Status of corrections:** local GREEN, awaiting updated GitHub CI.

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
2. `e2e/tests/manual-bva-v2-auth.spec.ts`: keep the real local learner signup and all lesson/worksheet/checklist/theme/responsiveness assertions; stop taking a giant `article.screenshot()`. Capture **two genuine DOM subsections** per width/theme: the exact BuggyShop Figure and the five-step mission section. These are real untouched browser screenshots, clipped by element scope, not altered or fabricated. There will be **12 attachments per browser** (6 responsive/theme combinations × 2 regions), with no account header or email. The test retains `trace:off`, `video:off`, automatic `screenshot:off` to avoid leaking test-session data.
3. `e2e/tests/release-switch.spec.ts`: use production network-idle navigation, explicitly wait for public release selector to show v1.1, verify quantity input is 0 before clicking, and assert rejection with no accepted cart line. The test never fakes bug flags, intercepts requests, touches product logic or suppresses failed assertions.
4. `e2e/test/manual-bva-v2-auth-ci.test.mjs`: add **red-first contract tests** proving the public browser target is local and absolute and that authenticated screenshots are bounded to the practice regions. Tests moved from 3/5 to 5/5 as intended.

## Actual verification results and remaining gates

- **Contract TDD:** 2 new tests failed before correction and then **5/5 passed** after correction.
- **TypeScript:** `pnpm --filter @qa-mastery/e2e typecheck` **PASS** after source edits.
- **Standalone public Chrome:** `BVA_PUBLIC_ORIGIN=http://127.0.0.1:3011 pnpm --filter @qa-mastery/e2e exec playwright test --config playwright.manual-bva-v2.config.ts` **6/6 PASS**, with real local Next production-mode BuggyShop.
- **Release-switch:** 30/30 Chrome fresh-page original behavior observed rejecting zero under v1.1, plus **10/10 Chrome runs** with explicit release/hydration assertions. Neither result proves WebKit compatibility.
- **WebKit on Mac:** **NOT RUN**; the locally installed Playwright package has no WebKit executable and the machine has only ~4.8 GiB free. The GitHub runner contains pinned WebKit and will rerun.
- **Authenticated note page in CI:** actual first PR Chromium route/test passed; WebKit screenshot too tall. Both browsers' new bounded figure+checklist screenshots and full acceptance test are **NOT YET VERIFIED** and must be reviewed after the new CI run.
- **Security:** PR [#164](https://github.com/izzzthisssagar/qa-mastery/pull/164) has green GitHub security/CI and a zero critical/high _production_ audit; it remains **draft/unmerged**, so PR #163 still inherits the old vulnerable `main` baseline.
- **Human learning acceptance:** **NOT RUN**, regardless of future green technical CI. A beginner still must write and execute test cases independently and provide reviewed evidence.

## Release gates

1. Push only these test/verification corrections to the same Sprint 03 feature branch (no rewrite or force-push).
2. Confirm **core E2E shard 1/3/4** pass on fresh GitHub Actions, including the non-flaky WebKit release assertion. Inspect actual bounded screenshot attachments from both browsers for mobile light/dark.
3. Resolve security dependency merge ordering through separate explicit approval; do not silently merge PR #164 or downgrade PR #163's audit requirements.
4. Keep PR #163 **draft**; no production deploy, grading changes or human-signoff claims.
