# Resolved — "WebKit save stall": e2e raced hydration, save failed validation, helper waited for a "Saved." that could never come

**Status:** root-caused & fixed 2026-07-10 · **Severity:** test-infra only (product behaved correctly) · **Filed:** 2026-06-26

## What it actually was

`publishTester` filled the Handle field and clicked the specialty chip
**before React hydrated** the profile editor. Pre-hydration interactions are
silently lost: the DOM input displays the text, but the component's `useState`
stays empty. The save then ran with `handle: ""`, the server action correctly
returned `{ ok: false, error: "Handle: 3–32 chars, …" }`, the UI correctly
showed that error — and the helper, which only ever waited for "Saved.",
timed out after 30 s. On retry the page's chunks were cached, hydration won
the race, and everything passed in ~5 s.

Why it looked like a WebKit/latency bug: hydration is CPU-bound, so the race
only loses on a starved runner (2-core CI, two Next servers, parallel
Chromium + WebKit workers), and WebKit was the slowest to hydrate. Local
sequential runs never reproduce it.

## How it was proven (local repro, isolated worktree at `f4d4e27`)

Production build on :3100 against local Supabase; standalone Playwright
harness repeating signup → profile → save → publish in fresh WebKit contexts,
6 concurrent, tracing forced on:

| Build                                         | Stalls |
| --------------------------------------------- | ------ |
| react 19.2.4 (shipped) + original flow        | 3 / 30 |
| react 19.2.7 + original flow                  | 3 / 60 |
| react 19.3.0-canary-20260708 + original flow  | 2 / 60 |
| react 19.2.4 + hydration-gated flow (the fix) | 0 / 60 |

The decisive traces: the save POST completed in <300 ms (server fine), a
probe after `await upsertTesterProfile(...)` logged `resolved false`
(promise fine, action _failed_), and the captured response body read
`{"ok":false,"error":"Handle: 3–32 chars, lowercase letters/numbers/dashes"}`
— an empty handle. Hypotheses ruled out along the way: Supabase/connection
warmup (CI uses a _local_ Supabase; DB round-trip <300 ms), WebKit itself
(browser-agnostic race, WebKit just hydrates slowest under load), and the
React 19.2.x fast-server-action reconciler race
([vercel/next.js#88767](https://github.com/vercel/next.js/discussions/88767))
— upgrading React through canary did not change the stall rate.

## The fix (e2e/tests/talent-helpers.ts)

1. **Hydration gate** — click the specialty chip in an `expect(...).toPass`
   loop until its `aria-pressed` (rendered from React state) sticks; only
   then fill the handle. A lost pre-hydration interaction now retries instead
   of poisoning the save.
2. **Fail fast with the real reason** — after clicking save, wait for
   "Saved." _or_ the error paragraph, and throw the actual error message
   instead of blind-timing-out.

## Lessons / follow-ups

- `trace: "on-first-retry"` records only the (passing) retry — the stalled
  first attempt was never traced, which is why CI artifacts were a dead end.
  Consider `retain-on-failure` if this class of flake returns.
- Other helpers that interact immediately after `goto` (e.g. `signUp`) are
  exposed to the same race; `signUp` survives because its `toPass` loop
  re-clicks, but it re-clicks without re-filling — worth hardening if it ever
  flakes.
