# WEB-S03 — Acceptance and regression record

**Status (2026-10-10):** DRAFT PR #163 / CI #418 TEST-HEAD PASS + CI #419 DOCS-ONLY E2E RECHECK PASS / SECURITY AND RELEASE GATES FAIL / NOT DEPLOYED / LEARNER ACCEPTANCE NOT RUN
**Worktree:** `work/v2-sprint03`, starting commit `c1ba7c5d5037b3f52be72ed06e1ec57832eca3b1`.
**Runtime:** macOS, Next.js 16.2.12, BuggyShop local isolated production build; no live data or hosted learner account.

| Gate                                                 | Status                                  | Recorded evidence                                                                                                                                                                                                                                  |
| ---------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Isolated Git source baseline                         | PASS                                    | Fresh worktree, baseline `pnpm install --frozen-lockfile` and 25/25 curriculum tests plus typecheck                                                                                                                                                |
| Screenshot truth                                     | PASS                                    | Real Chrome capture, HTTP 200, quantity 1→2, no page errors; unedited screenshot hash and visual review in manifest                                                                                                                                |
| Manual-first text/asset regression                   | PASS                                    | Focused `manual-bva-v2-pilot.test.ts` RED 3 failed before integration (missing subsection/template/reference); GREEN 3/3 after                                                                                                                     |
| Existing code path preserved                         | PASS (source review)                    | Original Python + Java CodePlayground examples and exactly one `<Complete xp={10} />` remain. Existing chapter Python code_run XP lab intentionally untouched, and worksheet explicitly ungraded                                                   |
| All curriculum/MDX/link checks                       | PASS (fresh final run)                  | 28/28 curriculum tests, 44/44 BuggyShop tests, all 876 notes link-checked and MDX compiled, curriculum and platform typechecks exited 0 after final MDX edit                                                                                       |
| Platform build and public image/template delivery    | PASS (build rerun after final MDX edit) | Next 16.2.12 platform production build exit 0 with dummy env; local HTTP 200 for image/png (36,580 bytes) and text/markdown (2,945 bytes), both byte-identical to public source files. Local authenticated note setup remains BLOCKED by disk safety; CI #418 core authenticated tests passed                       |
| Authenticated note responsive/dark-light/keyboard QA | CI PASS (#418) / LOCAL BLOCKED | Core E2E and the Enter-activation check passed in Chromium and WebKit. Local Supabase remains blocked by disk safety; #418 screenshots were not decoded here |
| Independent beginner exercise                        | NOT RUN                                 | Needs real learner to write, execute and explain three cases without coaching                                                                                                                                                                      |
| Hosted BuggyShop student environment                 | NOT VERIFIED                            | Local run only; do not assume public provision                                                                                                                                                                                                     |
| Public BuggyShop responsive/keyboard E2E             | PASS (6/6)                              | `pnpm --filter @qa-mastery/e2e exec playwright test --config playwright.manual-bva-v2.config.ts`; real installed Chrome at 390/768/1440, quantity update, no overflow, keyboard Enter/Space, products route, visible policy; e2e TypeScript passed |
| Public responsive screenshot evidence                | PASS                                    | Three original, unedited full-page Chrome captures preserved under `assets/buggyshop-cart-responsive-{390,768,1440}.png`, checksums in `SCREENSHOT_MANIFEST.md`                                                                                    |
| New UX/accessibility candidate findings              | OPEN                                    | Footer/release control overlap reproduced at 390; quantity controls need more descriptive accessible names; see `BUG_BACKLOG.md`                                                                                                                   |
| Branch publication / merge / deploy              | PARTIAL / NOT MERGED     | Draft PR #163 is updated by the explicitly authorized additive commit; no merge or production deploy is authorized or performed |

**Observed environment issue:** Development-mode BuggyShop port 3001 cart was server-rendered but click failed to update quantity (also logged HMR WebSocket handshake errors); production-mode build port 3011 accepted the click. This difference is a test-environment finding, not proven product defect.

**Next:** Automated authenticated QA passed on test-bearing head `e21a374` in CI #418 and was re-run on docs-only head `46e5220` in CI #419. Local authenticated setup remains BLOCKED by the Mac disk-safety limit. The #418 Playwright artifact (ID `11670103530`) has not had its screenshots decoded; #410's 72/72 screenshot set remains the directly reviewed visual baseline. Independent human learner acceptance remains NOT RUN; automated runs do not establish learner comprehension, grading correctness or WCAG conformance. Public Chrome screenshots document unauthenticated cart behavior and do not establish protected-route behavior. No XP/grader/hosted DB mutation. New finding triage in `BUG_BACKLOG.md`.

## Final runtime cleanup and commands

The dedicated Sprint 03 preview servers on **3001**, **3011**, and **3013** were terminated gracefully after final testing, with exact owned PID matching. Older local QA Mastery/other project servers on **3000** and **3002** were preserved. Colima remains stopped and only the original Docker resource inventory remains. Approximate macOS free-memory percentage after shutting down Sprint 03 previews was **70%**, and free disk was **5.1 GiB**. No permanent daemon or scheduled job was left behind.

To replay the public, **unauthenticated** cart tests later, from the isolated worktree run `pnpm --filter @qa-mastery/buggyshop build`, then start `pnpm --filter @qa-mastery/buggyshop exec next start -p 3011` in one terminal, and run `pnpm --filter @qa-mastery/e2e exec playwright test --config playwright.manual-bva-v2.config.ts` in another. Run only when space allows; these commands do not validate protected lesson content.

Final automated re-run after the new browser test was added: curriculum **28/28**, BuggyShop **44/44**, standalone public Chrome **6/6**, all relevant TypeScript checks, diff whitespace checks and screenshot hash/manifest verification PASS. Source had previously passed platform production build and all 876 note MDX/link checks; neither source note nor platform changed during the later environment investigation.

## Authenticated CI acceptance preparation — 2026-10-10

**Status: PREPARED / NOT EXECUTED ON CLOUD RUNNER.** Workstream WEB-S03-07 reuses the existing four-shard GitHub Actions E2E core runner, which starts a per-runner local Supabase database and seeds the curriculum. No new workflow, secret, service, database, or production credential was created. No Git commit, push, PR or remote CI run was triggered.

- **New test:** `e2e/tests/manual-bva-v2-auth.spec.ts` is auto-discovered for Chromium and WebKit (2 browser projects), signs up a disposable learner on **HTTP localhost only** using the existing hydration-safe helper, opens the real protected manual BVA note, checks the figure/alt/caption, worksheet URL and content, and keyboard Enter on a checklist step.
- **Visual evidence planned:** 390, 768 and 1440 px in light and dark themes (six **article-only screenshots** per browser run), attached to the existing Playwright blob report. No login headers, real email, storage state or tokens are intentionally captured. Trace, video, and automatic failure screenshot recording are switched off for this spec.
- **Non-grading:** No `Mark complete` click, XP award, code execution, hidden seeded bug manifest or production API mutation. A script pass will not be called human usability acceptance.
- **Red→green contract:** `e2e/test/manual-bva-v2-auth-ci.test.mjs` failed before the E2E spec existed; passed **3/3** after implementation. The full E2E Node test suite passed **10/10**.
- **Fresh verification:** `pnpm --filter @qa-mastery/e2e typecheck` PASS; `playwright test --list --config playwright.config.ts manual-bva-v2-auth.spec.ts` finds **2 tests (Chromium + WebKit)**; existing `node scripts/check-e2e-ci-shape.mjs` PASS; curriculum unit tests **28/28**; `git diff --check` PASS.
- **Unverified:** Actual authenticated rendering, photo evidence, live form interactions and cloud CI results are **NOT RUN**. Local Supabase cannot be retried safely with only 5.1 GiB free Mac disk; see the isolated-environment recovery report.
- **To execute:** Review and approve branch publication/PR, then examine the existing e2e-core jobs, merged Playwright report and attached screenshots. Keep deployment/merge as separate explicit decisions.

See `CI_AUTHENTICATED_ACCEPTANCE.md` for exact CI paths, safe scope and next gate.

## PR #163 initial GitHub CI and remediation — 2026-10-10

The pre-publication entries above remain an historical record. **At the time of this entry, draft PR #163 had been published and initial GitHub Actions run `38033582326` failed; no merge/deploy**. Exact failure logs and test-only corrections are documented in `CI_FAILURES_AND_REMEDIATION.md`.

- Core shard 1 (Chromium) and shard 3 (WebKit): six new BuggyShop cart tests each failed from relative `page.goto("/cart")` because the **existing core Playwright config deliberately has no baseURL**. Now use explicit localhost/127.0.0.1 BuggyShop origin, preferring `BVA_PUBLIC_ORIGIN` for standalone tests and the existing CI `NEXT_PUBLIC_BUGGYSHOP_URL` for core runs.
- Core shard 4 (WebKit): the complete note's screenshot exceeded WebKit's maximum 32,767-pixel dimension. Now capture only the **actual BuggyShop Figure and the guided manual QA checklist** separately for each viewport/theme (12 element-only images per browser). No fake UI, CSS changes or account chrome.
- Core shard 4 existing v1.1 release-switch quantity-zero test had a flaky failure, passed on retry. It now waits for release v1.1 hydration, checks the input before clicking and asserts both rejection and absence of an accepted cart line. **Seeded product behavior untouched**.
- New contract guards were **RED 2/2 before changes and GREEN 5/5 overall** after fixes. E2E TypeScript pass. Standalone local Chrome cart tests **6/6 pass** at widths 390, 768 and 1440; 10/10 additional Chrome fresh-page trials passed after the release-switch sync guard (previous unsynchronized Chrome observation 30/30).
- **WebKit authenticated capture, WebKit release-switch and new 12-per-browser screenshot attachments remain NOT VERIFIED** until the next GitHub CI run; WebKit's local binary was absent on the Mac. The PR's separate security gate remains blocked by inherited vulnerable `main` until independently reviewed security draft PR #164 is accepted and merged.
- Actual independent beginner BVA learning acceptance remains **NOT RUN**. No changes to learner XP/grading, auth, seeded bug manifests, SQL/RLS, or hosted services.

The old release and deployment status in the preflight table is superseded by this dated PR update. Its next-step statement is historical and was superseded by CI #409, #410, #411 and #418. PR #163 remains draft and unmerged.

## CI #409 and visual-review follow-up — 2026-10-10

- **Technical GitHub core CI:** run `38038368128`, commit `8a857dd`: core shards **1/2/3/4 PASS**, authenticated note WebKit and Chromium test PASS; E2E BuggyAPI, first-paint and RLS PASS; **one unrelated flaky** Talent Title locator in WebKit shard 4, which succeeded on retry.
- **Security gate:** failed on inherited old-main dependency graph; separate security draft PR #164 has green GitHub audit/CI but is **not merged**. Do not suppress audit or claim PR #163 release-ready.
- **Evidence review:** examined the actual core4 Playwright artifact ZIP and twelve WebKit screenshots. Long checklist element screenshot contains floating nav/Feedback controls over text because screenshot stitching traverses a taller-than-viewport section. Short Figure image also shows Feedback overlay. This is **visual acceptance FAIL/INCONCLUSIVE**, not automatically a user-facing product defect.
- **Second screenshot capture candidate at #409:** choose the real Figure and **five individual checklist steps**, scroll each into the unobscured center of a normal 900px viewport, and fail unless each actual element's measured bounding box stays clear of header/footer controls. Capture **36 genuine unmodified element screenshots per browser** across light/dark and 390/768/1440. **At the time of #409, this had not run; CI #410 later generated the set and its 72/72 evidence was manually verified** as recorded in `SCREENSHOT_MANIFEST.md`.
- **Unaffected:** no modified app UI, seeded bugs, grading, DB, auth; no production deployment, no merge. Independent beginner manual-QA practice remains **NOT RUN**.

More detail: `CI_FAILURES_AND_REMEDIATION.md` and updated `CI_AUTHENTICATED_ACCEPTANCE.md`.

## Sprint 03 authenticated acceptance update — CI run #410

- All four core E2E shard jobs, RLS, first-paint, and BuggyAPI jobs **PASS** at `cdfa6f9`; the two authenticated manual BVA browser tests passed in Chromium and WebKit.
- Verified **72 real scoped Playwright screenshots** (36 per browser), six light/dark × viewport combinations and six components per combination, with real source files and representative manual visual inspection. See `SCREENSHOT_MANIFEST.md`.
- Mobile readability improvement made after reviewing actual artifacts: shorten authentic Figure caption and link to full 1440px source PNG for zoom. The **red-first test** passed 6/6 locally with E2E TypeScript; CI #411 ran the link URL/resource checks, and CI #418 passed mobile Enter activation in Chromium and WebKit.
- Security gate **FAILS due inherited clean-main vulnerabilities**, not the BVA changes; the separate security-only PR #164 has a successful audit and E2E run but is still draft/unmerged.
- Independent novice manual QA exercise remains **NOT RUN**, and no XP, grader, seeded product behavior or hosted learner data has been changed.


## Sprint 03 authenticated acceptance update — CI #411 (historical; followed by #418)

- CI run `38044152969` passed all four core E2E shards at prior PR head `3e0db7195bfd1087870f777c3e80b586fb09b59d`. This predates the mobile keyboard activation test in the current authorized update.
- The production dependency audit reported 47 findings: 7 low, 27 moderate, 10 high and 3 critical. The security and release gates failed downstream; `e2e-full` was skipped by workflow policy. PR #164 remains a separate draft and unmerged; no audit suppression or security lockfile copying.
- A merged `playwright-report` artifact (ID `11666901713`, listed expiry 2026-10-17) exists for #411, but its ZIP contents were not decoded here. The PR description's 72/72 screenshot claim for #411 is **not independently verified**; #410's 72/72 and representative review remain verified in `SCREENSHOT_MANIFEST.md`.
- The authorized follow-up added an authenticated 390px keyboard path: focus the full-size image anchor, press Enter, verify the navigation response is 200 `image/png`, then return to the lesson and continue its checks. CI #418 passed the test in Chromium and WebKit.
- Local isolated Supabase remains **BLOCKED** by the Mac disk-safety limit. Independent beginner BVA acceptance remains **NOT RUN**. No learner XP/grading, seeded bug behavior, database, production service or deployment changed.



## Sprint 03 authenticated acceptance update — CI #418 (2026-10-10)

CI run #418 [38053684497](https://github.com/izzzthisssagar/qa-mastery/actions/runs/38053684497) tested code/test head `e21a374b4b226fcb4153aafbbb6086ba6940fdb0`. All four core shards passed, including the authenticated image-link Enter activation in Chromium and WebKit. Three unrelated WebKit tests passed on retry (notes bug-hunt, notes capstone, notification bell). Checks, live RLS, first-paint and BuggyAPI passed; `e2e-full` was skipped by workflow policy. The production dependency audit still found 47 items (7 low, 27 moderate, 10 high, 3 critical), so the security and release gates failed.

- Core shard summaries: 40 passed (core-1), 40 passed (core-2), 38 passed (core-3), and 39 passed (core-4). Three unrelated WebKit tests passed after retries; none concerned the new image link or authenticated lesson.
- The mobile full-size image link is visible at 390px, receives keyboard focus, and opens the same-origin PNG on Enter with a 200 `image/png` response in both Chromium and WebKit. The test returns to the lesson and completes the remaining assertions.
- The merged `playwright-report` artifact (ID `11670103530`, expiry 2026-10-17) exists but was not decoded for direct visual screenshot review. The #410 visual review remains the verified screenshot baseline.
- Security run #386 failed the production dependency audit with the same 47 findings; secret scan and Dependabot validation passed. The security and release gates remain blocked. PR #164 remains separate, draft and unmerged.
- Local Supabase remains **BLOCKED** by disk safety, and independent beginner BVA acceptance remains **NOT RUN**. No learner XP/grading, seeded bug behavior, database, production service or deployment changed.
