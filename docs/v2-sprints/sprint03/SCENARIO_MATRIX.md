# Sprint 03 — BuggyShop Manual QA / SDET Skill Pack Matrix

**Status:** candidate product backlog; only the manual-first BVA pilot is implemented as **ungraded** reading/practice. Source evidence: existing BuggyShop pages and current curriculum, not any hidden seeded-bug answer key.

| ID      | Level           | Topic / skill                                                                       | Observable practice surface                                           | Evidence artifact                                                 | Execution gate/status                                                                      |
| ------- | --------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| MS03-01 | Beginner manual | Boundary value analysis, inclusive vs strict language, reachable/unreachable values | BuggyShop Cart: published shipping policy, quantity control, subtotal | 3 written cases, expected/actual evidence, environment note       | **Pilot content implemented**; local qty2 interaction verified; learner acceptance NOT RUN |
| MS03-02 | Beginner manual | Equivalence partitioning for an input field                                         | Signup or newsletter form (must confirm available validation spec)    | Valid/invalid classes and minimum example cases                   | DESIGN ONLY; preconditions/spec research required                                          |
| MS03-03 | Beginner manual | Decision table from policy rules                                                    | Coupon/checkout policies when accessible                              | Decision table with condition/action columns, reduced cases       | DESIGN ONLY; exact requirements not yet approved                                           |
| MS03-04 | Junior QA       | State transitions + regression subset                                               | Checkout/order state where authorized test sandbox permits            | State diagram, valid/invalid transitions, replay log              | DESIGN ONLY; seeded account required                                                       |
| MS03-05 | Junior QA       | Exploratory charter + session-based test management                                 | Public cart/product flow and risk tours                               | Charter, 30-minute session notes, observations versus hypotheses  | DESIGN ONLY; pilot could be local-only                                                     |
| MS03-06 | Junior QA       | Defect report clarity/severity versus priority                                      | Observed BuggyShop behavior (only genuine mismatches)                 | Repro steps, observed/expected, evidence, triage recommendation   | DESIGN ONLY; hidden truth never disclosed                                                  |
| MS03-07 | QA engineer     | Responsive/device/keyboard checks                                                   | Cart, checkout at 390/768/1440 and light/dark if supported            | Viewport checklist, screenshots, focus-order notes                | DESIGN ONLY; UI accessibility acceptance required                                          |
| MS03-08 | SDET            | Playwright regression design and test-data determinism                              | Authorized BuggyShop static/public UI                                 | Typed Playwright test, trace/screenshot, flake analysis           | DESIGN ONLY; no framework/test-suite changes approved                                      |
| MS03-09 | Senior QA       | Multi-user isolation, authorization and negative testing                            | Learner-specific sandbox and session handoff                          | Risk model, safe two-identity test evidence, remediation proposal | BLOCKED by local Supabase/auth isolation and approval                                      |
| MS03-10 | Lead            | Risk-based release strategy and stakeholder decision                                | Combined BuggyShop release candidate                                  | Risk/coverage matrix, go/no-go report, defect triage              | DESIGN ONLY; needs release contract and representative evidence                            |

## Requirements traceability

- **LRN-M01:** A first-time learner can author 3 boundary test cases without writing code → MS03-01 → blank template + source note → content checks PASS; independent learner NOT RUN.
- **LRN-M02:** Test results distinguish PASS/FAIL/BLOCKED/NOT RUN → MS03-01/05/06 → template + content check; learner review NOT RUN.
- **LRN-M03:** Practice material uses a versioned genuine screenshot → MS03-01 → screenshot manifest + PNG hash equality.
- **LRN-M04:** Seeded answers and tokens are never bundled in downloadable artifacts → MS03-01 and future packs → negative content checks.
- **LRN-M05:** Skill depth scales to senior/lead without forcing Python first → MS03-01..10 → roadmap **DESIGN**, not implemented.
- **LRN-M06:** Grading is based on applied evidence, not reading alone → future grader architecture → **BLOCKED / NOT APPROVED** (no schema/API changes).

## Acceptance rules per new pack

Each pack needs a written learner requirement, actual authorized practice target, role/level, stable setup and reset policy, observable steps, clear oracle, edge/negative cases, sample redacted evidence, test plan, real screenshot provenance and honest run status. Do not call a planned pack “implemented”; do not distribute manifest internals or prefill intended seeded-bug findings.
