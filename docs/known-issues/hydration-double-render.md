# Resolved (test-infra) — transient duplicate DOM node right after hydration, under CI concurrency

**Status:** root-caused & worked around 2026-07-15 · **Severity:** test-infra only (product behaved correctly) · **Filed:** 2026-07-15

## What it actually was

A handful of e2e assertions that interact with a testid immediately after
`page.goto()` — `certificate-locked`, `planner-input`, `stat-xp`, `quiz-panel`,
`locator-lab` — intermittently failed with a Playwright strict-mode
violation: `getByTestId(...)` resolved to **2 elements** instead of 1. All
five sit on different pages, share no component, and each testid appears
exactly once in its source file — so this wasn't a duplicated render call
site anywhere in the app.

## How it was proven (local repro, `feat/notes-v2`, full e2e suite against
production builds + local Supabase, 10-core dev machine)

A throwaway diagnostic test (`page.goto()`, capture `response.text()` for
the raw SSR HTML, then poll `page.content()` at ~200ms and ~1.7s) run
alongside the full suite for maximum concurrent load on the shared `next
start` server produced this pattern on every capture, three separate runs:

```
raw=1   domEarly(~200ms)=1   →  2   domLate(~1.7s)=1
```

- The server **always** sent exactly one copy of the element — `raw=1`,
  no exceptions.
- Client hydration of the freshly-navigated page **transiently** rendered a
  second copy of the subtree, present at ~200ms post-navigation.
- It reconciled back down to one correct copy by ~1.7s, on its own, every
  time — never a persistent duplicate.

Hypotheses ruled out:
- **`reactCompiler: true`** (the leading suspect noted in earlier sessions)
  — disabled it in `next.config.ts`, rebuilt, reran the same load: identical
  duplication (3 flaky failures, same signature). Reverted; not the cause.
- **Server-side shared/cached state** (a module-level cache or non-request-
  scoped memoization bleeding between concurrent requests) — ruled out by
  `raw=1` holding in every sample; if state were bleeding between requests,
  the *server* HTML itself would show the duplicate. It never did.
- **Duplicate JSX render call sites** — grepped every affected testid; each
  appears exactly once in its component's source.

This is the same category as `webkit-save-stall.md` — "hydration is
CPU-bound, the race only loses on a starved runner (2-core CI, parallel
Chromium + WebKit workers)" — but a different symptom: a transient *extra*
DOM node during React's hydration reconciliation, instead of a *lost*
pre-hydration interaction. Both are most exposed at the same moment: the
first interaction immediately after a fresh navigation, before hydration has
settled. Here it's plausibly sharpened by `signUpFreshLearner`'s own
client-side redirect to `/dashboard` landing right before the test's next
`page.goto()` to a different route, overlapping one hydration cycle with the
start of another — not confirmed as the precise trigger, just the most
likely contributor given the timing.

## The fix (e2e/tests/learn.spec.ts, e2e/tests/tasks.spec.ts, e2e/tests/talent-helpers.ts)

`.first()` on the affected `getByTestId(...)`/`getByLabel(...)` lookups, at
their first use after a fresh navigation. Safe because both transient copies
are content-identical (the same server-rendered data, momentarily
double-mounted by React) — `.first()` always resolves to a valid, correct
element whether the duplicate is present or has already self-healed.

A sixth instance turned up during verification: `talent-helpers.ts`'s
`publishTester()` fills the profile "Handle" field via plain
`getByLabel("Handle").fill(...)`, outside the hydration-gate `toPass` loop
that guards the specialty chip a few lines above it (that loop exists for
the *different* webkit-save-stall race — lost pre-hydration input — not this
one). Same fix: `.first()`.

## Lessons / follow-ups

- This was reproducible on a 10-core dev machine under full-suite
  concurrent load, not just on CI's 2-core runner — the earlier assumption
  that "local sequential runs never reproduce it" (true for the WebKit save
  stall) does not hold for this one. Full-suite concurrent load, not raw CPU
  scarcity alone, is what widens the window.
- Any *new* e2e assertion that interacts with a testid as the very first
  thing after `page.goto()` is exposed to the same race. `.first()` is the
  cheap, safe default there unless the test specifically needs to assert
  there is exactly one such element (in which case, wait a beat or assert
  count *after* an unrelated stable element is confirmed visible first).
- Root cause sits inside React/Next.js's hydration reconciliation timing
  itself, not in this app's code — no further product-side fix is expected
  or needed.
