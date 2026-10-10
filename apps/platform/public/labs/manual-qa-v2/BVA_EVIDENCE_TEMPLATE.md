# QA Mastery V2 — Boundary Value Analysis Evidence Template

**Purpose:** Blank manual-QA practice artifact, not a graded submission and not a model answer. Work only on a QA Mastery-authorized practice environment.

## Test setup

- **Requirement / source of truth:** [Quote the exact visible rule or approved acceptance criterion.]
- **Environment:** [Private authorized BuggyShop sandbox identifier and browser/device version.]
- **Preconditions:** [Starting cart state, available product quantities, known constraints.]
- **Technique:** Boundary Value Analysis (BVA) — choose below, at, and above one meaningful threshold.
- **Date / tester alias:** [Never include real user details unless required and authorized.]
- **Execution state:** not executed

## Cases to design

Write three cases before pressing any controls. Use one representable value below the threshold, one at it, and one above it **when the UI allows them**. If a value cannot be entered using the interface, state that rather than inventing an Actual result.

| Test case      | Requirement | Preconditions | Input                     | Expected           | Actual                      | Result  | Evidence                   | Environment      |
| -------------- | ----------- | ------------- | ------------------------- | ------------------ | --------------------------- | ------- | -------------------------- | ---------------- |
| BVA-01 — below | [rule]      | [setup]       | [input or "cannot reach"] | [derive from rule] | [fill only after execution] | NOT RUN | [redacted screenshot path] | [authorized lab] |
| BVA-02 — at    | [rule]      | [setup]       | [input or "cannot reach"] | [derive from rule] | [fill only after execution] | NOT RUN | [redacted screenshot path] | [authorized lab] |
| BVA-03 — above | [rule]      | [setup]       | [input or "cannot reach"] | [derive from rule] | [fill only after execution] | NOT RUN | [redacted screenshot path] | [authorized lab] |

Allowed **Result** values: PASS, FAIL, BLOCKED, NOT RUN. Never mark a case PASS until the actual response matches the expected result.

## Defect report (only when an observed result contradicts a stated requirement)

- **Title:** [Feature + observed mismatch, without guessing root cause]
- **Steps to reproduce:** [Numbered actions, repeat from known state]
- **Expected vs actual:** [Quote the rule and your observed result]
- **Impact / severity recommendation:** [Describe user risk; keep priority separate]
- **Reproducibility:** [Repeat count; if not repeated, say so]
- **Evidence:** [Full or suitably cropped original screenshot, timestamp, request/console details as relevant]
- **Limitations:** [Data, browser, login, environment or unreachable inputs]

## Privacy and evidence integrity

**Do not include** handoff token fragments, access tokens, cookies, personal account information, customer data, local secrets, seeded internal bug IDs or hidden grader answers. Keep original screenshots separate from annotations. Avoid generating or editing screenshots to resemble a different application state.

**Reviewer sign-off:** [Pending until an independent reviewer examines the test design and evidence.]
