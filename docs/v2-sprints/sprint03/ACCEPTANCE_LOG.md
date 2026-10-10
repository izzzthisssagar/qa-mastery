# WEB-S03 — Acceptance and regression record

**Status:** ISOLATED PILOT / NOT DEPLOYED / LEARNER ACCEPTANCE NOT RUN
**Worktree:** `work/v2-sprint03`, starting commit `c1ba7c5d5037b3f52be72ed06e1ec57832eca3b1`.
**Runtime:** macOS, Next.js 16.2.12, BuggyShop local isolated production build; no live data or hosted learner account.

| Gate                                                 | Status                                  | Recorded evidence                                                                                                                                                                                                                                  |
| ---------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Isolated Git source baseline                         | PASS                                    | Fresh worktree, baseline `pnpm install --frozen-lockfile` and 25/25 curriculum tests plus typecheck                                                                                                                                                |
| Screenshot truth                                     | PASS                                    | Real Chrome capture, HTTP 200, quantity 1→2, no page errors; unedited screenshot hash and visual review in manifest                                                                                                                                |
| Manual-first text/asset regression                   | PASS                                    | Focused `manual-bva-v2-pilot.test.ts` RED 3 failed before integration (missing subsection/template/reference); GREEN 3/3 after                                                                                                                     |
| Existing code path preserved                         | PASS (source review)                    | Original Python + Java CodePlayground examples and exactly one `<Complete xp={10} />` remain. Existing chapter Python code_run XP lab intentionally untouched, and worksheet explicitly ungraded                                                   |
| All curriculum/MDX/link checks                       | PASS (fresh final run)                  | 28/28 curriculum tests, 44/44 BuggyShop tests, all 876 notes link-checked and MDX compiled, curriculum and platform typechecks exited 0 after final MDX edit                                                                                       |
| Platform build and public image/template delivery    | PASS (build rerun after final MDX edit) | Next 16.2.12 platform production build exit 0 with dummy env; local HTTP 200 for image/png (36,580 bytes) and text/markdown (2,945 bytes), both byte-identical to public source files. Authenticated note UI remains BLOCKED                       |
| Authenticated note responsive/dark-light/keyboard QA | BLOCKED                                 | Local Supabase 2.106.0 isolated stack attempted; disk fell under 1 GiB during Docker image pulls. All test-only DB resources were removed, VM stopped, source untouched; no learner session was created. See `LOCAL_AUTH_ENVIRONMENT_REPORT.md`    |
| Independent beginner exercise                        | NOT RUN                                 | Needs real learner to write, execute and explain three cases without coaching                                                                                                                                                                      |
| Hosted BuggyShop student environment                 | NOT VERIFIED                            | Local run only; do not assume public provision                                                                                                                                                                                                     |
| Public BuggyShop responsive/keyboard E2E             | PASS (6/6)                              | `pnpm --filter @qa-mastery/e2e exec playwright test --config playwright.manual-bva-v2.config.ts`; real installed Chrome at 390/768/1440, quantity update, no overflow, keyboard Enter/Space, products route, visible policy; e2e TypeScript passed |
| Public responsive screenshot evidence                | PASS                                    | Three original, unedited full-page Chrome captures preserved under `assets/buggyshop-cart-responsive-{390,768,1440}.png`, checksums in `SCREENSHOT_MANIFEST.md`                                                                                    |
| New UX/accessibility candidate findings              | OPEN                                    | Footer/release control overlap reproduced at 390; quantity controls need more descriptive accessible names; see `BUG_BACKLOG.md`                                                                                                                   |
| Git commit/merge/deploy                              | NOT RUN                                 | Explicit approval gate                                                                                                                                                                                                                             |

**Observed environment issue:** Development-mode BuggyShop port 3001 cart was server-rendered but click failed to update quantity (also logged HMR WebSocket handshake errors); production-mode build port 3011 accepted the click. This difference is a test-environment finding, not proven product defect.

**Next:** Candidate has passed its automated code/content and public browser checks. Authenticated page QA requires a disposable test stack with **at least 12–15 GiB available disk** or an ephemeral test runner; independent human learner acceptance is a separate gate. Do not infer authenticated correctness or graded mastery from public Chrome screenshots. No XP/grader/hosted DB mutation. New finding triage in `BUG_BACKLOG.md`.

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

The pre-publication entries above remain an historical record. **Current status: published draft PR #163, initial GitHub Actions run `38033582326` failed, no merge/deploy**. Exact failure logs and test-only corrections are documented in `CI_FAILURES_AND_REMEDIATION.md`.

- Core shard 1 (Chromium) and shard 3 (WebKit): six new BuggyShop cart tests each failed from relative `page.goto("/cart")` because the **existing core Playwright config deliberately has no baseURL**. Now use explicit localhost/127.0.0.1 BuggyShop origin, preferring `BVA_PUBLIC_ORIGIN` for standalone tests and the existing CI `NEXT_PUBLIC_BUGGYSHOP_URL` for core runs.
- Core shard 4 (WebKit): the complete note's screenshot exceeded WebKit's maximum 32,767-pixel dimension. Now capture only the **actual BuggyShop Figure and the guided manual QA checklist** separately for each viewport/theme (12 element-only images per browser). No fake UI, CSS changes or account chrome.
- Core shard 4 existing v1.1 release-switch quantity-zero test had a flaky failure, passed on retry. It now waits for release v1.1 hydration, checks the input before clicking and asserts both rejection and absence of an accepted cart line. **Seeded product behavior untouched**.
- New contract guards were **RED 2/2 before changes and GREEN 5/5 overall** after fixes. E2E TypeScript pass. Standalone local Chrome cart tests **6/6 pass** at widths 390, 768 and 1440; 10/10 additional Chrome fresh-page trials passed after the release-switch sync guard (previous unsynchronized Chrome observation 30/30).
- **WebKit authenticated capture, WebKit release-switch and new 12-per-browser screenshot attachments remain NOT VERIFIED** until the next GitHub CI run; WebKit's local binary was absent on the Mac. The PR's separate security gate remains blocked by inherited vulnerable `main` until independently reviewed security draft PR #164 is accepted and merged.
- Actual independent beginner BVA learning acceptance remains **NOT RUN**. No changes to learner XP/grading, auth, seeded bug manifests, SQL/RLS, or hosted services.

The old release and deployment status in the preflight table is superseded by this dated PR update. The next step is a new additive commit and draft-PR CI rerun, with **no merge**.

## CI #409 and visual-review follow-up — 2026-10-10

- **Technical GitHub core CI:** run `38038368128`, commit `8a857dd`: core shards **1/2/3/4 PASS**, authenticated note WebKit and Chromium test PASS; E2E BuggyAPI, first-paint and RLS PASS; **one unrelated flaky** Talent Title locator in WebKit shard 4, which succeeded on retry.
- **Security gate:** failed on inherited old-main dependency graph; separate security draft PR #164 has green GitHub audit/CI but is **not merged**. Do not suppress audit or claim PR #163 release-ready.
- **Evidence review:** examined the actual core4 Playwright artifact ZIP and twelve WebKit screenshots. Long checklist element screenshot contains floating nav/Feedback controls over text because screenshot stitching traverses a taller-than-viewport section. Short Figure image also shows Feedback overlay. This is **visual acceptance FAIL/INCONCLUSIVE**, not automatically a user-facing product defect.
- **Second screenshot capture candidate:** choose the real Figure and **five individual checklist steps**, scroll each into the unobscured center of a normal 900px viewport, and fail unless each actual element's measured bounding box stays clear of header/footer controls. Capture **36 genuine unmodified element screenshots per browser** across light/dark and 390/768/1440. **NOT RUN on CI yet**; needs fresh Chromium/WebKit screenshots and manual inspection.
- **Unaffected:** no modified app UI, seeded bugs, grading, DB, auth; no production deployment, no merge. Independent beginner manual-QA practice remains **NOT RUN**.

More detail: `CI_FAILURES_AND_REMEDIATION.md` and updated `CI_AUTHENTICATED_ACCEPTANCE.md`.
