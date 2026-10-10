# Sprint 03 — Public BuggyShop QA findings and candidate backlog

**Capture date:** 2026-10-10. **Scope:** public `/cart` in a local Next.js 16.2.12 production-mode build, browser Chrome, release selected as shown. The intentionally seeded BuggyShop defect mechanisms and hidden grading manifest were **not** modified. Findings require product-owner classification before implementation; do not silently "fix" designed training defects.

## UX-S03-001 — Floating release selector obscures footer copy

- **Status:** REPRODUCED / OPEN, not yet classified as intentional or accidental.
- **Severity suggestion:** Minor (readability and polish). **Priority proposal:** P2.
- **Environment:** 390 × 900 browser viewport; route `/cart`.
- **Steps:** Open BuggyShop Cart in the production-mode preview, wait for client hydration, inspect the footer at the bottom of the visible page.
- **Observed:** Fixed release switcher intersects the wrapped footer text. Measured switcher rectangle `x=258..378, y=856..888`; first footer text line `x=42..348, y=852..868`. The rectangles **overlap**. On 768px and 1440px screenshots, no overlap was measured.
- **Expected:** Footer content stays readable and does not sit beneath floating controls.
- **Evidence:** `assets/buggyshop-cart-responsive-390.png` (actual Chrome full-page screenshot) and measured bounding boxes. No generated illustration.
- **Next:** Determine whether this is intended UX defect practice; otherwise adjust responsive footer/switcher spacing in a separately approved card and add a non-overlap regression check.

## A11Y-S03-002 — Cart quantity controls have only symbol labels

- **Status:** REPRODUCED / OPEN, not yet classified as intended lab behavior.
- **Severity suggestion:** Minor-to-moderate usability concern. **Priority proposal:** P2; WCAG failure classification requires a dedicated manual assistive-technology evaluation.
- **Environment:** `/cart`, 390/768/1440 browser widths.
- **Steps:** Inspect decrement/increment controls by keyboard and accessible attributes.
- **Observed:** Both buttons work by keyboard (Enter/Space test passed), but the only visible/accessible strings are `−` and `+`; both elements have `aria-label=null`. The controls do not announce the quantity action clearly without surrounding context.
- **Expected:** Accessible names describe the action, e.g., "Decrease quantity" and "Increase quantity", without removing existing functionality.
- **Evidence:** Browser Playwright observation; source `apps/buggyshop/src/app/cart/page.tsx`.
- **Next:** Evaluate with VoiceOver/NVDA in manual QA before claiming WCAG conformance or violation; decide whether to intentionally seed or repair in a separate change.

## LRN-S03-003 — Below-threshold UI input is unreachable in the first practice cart

- **Status:** CONFIRMED TRAINING LIMITATION / BACKLOG (not a product defect).
- **Environment:** Public Cart, one annual-membership line item at $999 each, minimum quantity 1.
- **Observed:** Learners can test subtotal **at** the listed $999 threshold and **above** it ($1998), but **below** it is not representable with the supported UI controls. The lesson correctly instructs learners to mark unreachable inputs BLOCKED/NOT RUN rather than fabricate Actual results.
- **Learning risk:** A novice cannot independently execute all three BVA cases on this one UI field. The distinction between test-case design and actual execution is still useful.
- **Next:** Provide an authorized sandbox input field where below/at/above states are independently reachable, or split this into a requirements-design task plus later fully executable lab. Do not alter hidden BuggyShop defect data to force a test value.

## ENV-S03-004 — Local authenticated-acceptance dependency unavailable

- **Status:** BLOCKED BY MACHINE CAPACITY.
- **Evidence:** `LOCAL_AUTH_ENVIRONMENT_REPORT.md`; local Supabase images exhausted disk headroom during startup. Resource inventory was restored, VM stopped and temporary data deleted.
- **Next:** Use a sufficiently provisioned disposable runner or safely free space with explicit owner approval. Do not run against hosted learner data or fake successful auth tests.

## QA disposition

The 6/6 public cart browser checks pass **within their own defined scope**. That does not clear the two UX/accessibility observations or unlock authenticated lesson testing. No seeded manifest, grading, database, login or production code was changed by this investigation.
