# Sprint 03 — Authentic BuggyShop screenshot provenance

| Field                      | Verified value                                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Screenshot                 | `assets/buggyshop-cart-original.png`                                                                                                       |
| Public byte-identical copy | `apps/platform/public/notes/test-design-techniques/boundary-value-analysis/buggyshop-cart-v2-original.png`                                 |
| Source                     | Real local QA Mastery BuggyShop Next.js 16.2.12 production-mode build (no production server/data)                                          |
| Capture                    | 2026-10-10 Asia/Kathmandu, installed macOS Google Chrome via Playwright Chrome channel, 1440 × 900 viewport, headless                      |
| Target                     | `http://127.0.0.1:3011/cart` (local-only test server)                                                                                      |
| Trigger                    | Public Cart page, click quantity increment after hydration; control changed from 1 to 2; subtotal shown as $1998.00; HTTP 200              |
| Runtime evidence           | zero uncaught page errors, zero request failures, input control responded in production-mode build                                         |
| Screenshot SHA-256         | `a8a3bfb8a188c19c948178047d7b664e5a8336cf2c8d612d4d5cd92c03faf4be` (original and public copy)                                              |
| Privacy                    | visually reviewed: no email, token, handoff fragment, customer data, browser account profile or credentials                                |
| Alterations                | original unedited, public copy byte-identical; no cropping, masking, annotation or simulated UI                                            |
| Teaching caption           | BuggyShop cart showing quantity two, price summary and visible numeric shipping rule; represents tool state, not a learner's executed test |
| Teaching alt               | BuggyShop cart with quantity control set to two, subtotal and shipping information, and the shipping-policy statement                      |

## Additional responsive evidence (separate from the learner-facing screenshot)

Captured 2026-10-10 in real headless installed Chrome against production-mode local BuggyShop. The viewport screenshots are retained as internal **QA evidence**, not pre-filled learner results. After hydration each capture shows quantity 2 and subtotal $1998.00. No login, tokens, real customer information or screenshot manipulation.

| Viewport   | Full-page original                          | SHA-256                                                            | Geometry                                                                              |
| ---------- | ------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| 390 × 900  | `assets/buggyshop-cart-responsive-390.png`  | `22f613c48b1433aef47aaf460ac0987fb688221dc09df3a788f3bac4246a849c` | No horizontal page overflow; fixed release control overlaps footer text (BUG BACKLOG) |
| 768 × 900  | `assets/buggyshop-cart-responsive-768.png`  | `d9dbad7fd904033496a3185e6fb888aa9721ab2742b68177bf2e0640ab95ea39` | No horizontal page overflow or measured footer overlay                                |
| 1440 × 900 | `assets/buggyshop-cart-responsive-1440.png` | `a8a3bfb8a188c19c948178047d7b664e5a8336cf2c8d612d4d5cd92c03faf4be` | No horizontal page overflow or measured footer overlay                                |

**Test authority:** `e2e/tests/manual-bva-v2-browser.spec.ts` and `e2e/playwright.manual-bva-v2.config.ts` (6/6 passing), with `webcmd` unavailable on this Mac so the installed Playwright+Chrome runner was used. The screenshots were created by that runner and byte-copied from its result directory.

**Caveat:** The seeded BuggyShop release is intentionally imperfect. Do not infer correctness of all boundaries from this screenshot, publish hidden seeded bug IDs, or mark the exercise passed from a screenshot. The local development server on port 3001 rendered but did not respond to an immediate quantity click during an early capture; a separately built production-mode instance on port 3011 was used after diagnosing that limitation. An independent learner run is still required.

## Signed-in CI screenshots — separate private QA artifacts, 2026-10-10

The first authenticated WebKit result came from GitHub CI run `38038368128`, artifact `blob-report-core-core-4`. Inspected twelve real `Figure` and tall-checklist PNGs; images have not been altered or republished as learner references. The large checklist captures visibly repeat fixed navigation and Feedback UI over text due to Playwright stitching past viewport boundaries. They are **unsuitable for visual acceptance**, though the authenticated UI automation itself passed.

The proposed next run will produce **36 genuine element-scoped images per browser**: each of six viewport/theme combinations has a Figure and five individual step screenshots, physically positioned between the normal viewport's fixed header and bottom controls. The browser must verify the actual element coordinates and fail if an item cannot fit. Original Figure/lesson asset and old GitHub artifacts remain intact. **New screenshots have not yet been generated or reviewed.**
