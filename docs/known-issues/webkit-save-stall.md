# Known issue — WebKit: tester-profile save intermittently stalls >30s in e2e

**Status:** open · **Severity:** low (test-infra flake, masked by CI retry) · **Filed:** 2026-06-26

## Symptom

`publishTester` (the `upsertTesterProfile` save in `apps/platform/src/app/(app)/talent/_components/profile-editor.tsx`) intermittently stalls past the e2e timeout on **WebKit only**, then passes on retry in ~5s.

Observed in CI run `28218928114` (`e2e/tests/talent-directory.spec.ts`):

- WebKit attempt #1 → timed out at **30.0s** (at `publishTester`, spec line 15)
- WebKit retry #1 → passed in **5.2s**
- Chromium → consistently ~3–6s, never stalls

Because the failure is in the shared `publishTester` helper, any talent spec that publishes a tester (`talent-consent`, `talent-profile`, `talent-realtime`, `talent-directory`) can hit it.

## What's already been done

- `e2e/tests/talent-helpers.ts` — `publishTester` waits for the save to settle (button re-enables) and gives the assertions 30s headroom (PR #74).
- `upsertTesterProfile` now runs its two independent writes (`talent_profiles` upsert + `profiles.talent_role` update) concurrently instead of sequentially (PR #75, `42b59d4`). This fixed the **common-case** latency (~5s) but did **not** eliminate the rare stall.

## Hypothesis

Not linear DB latency — that would be a consistent ~2x slowdown, not an occasional 30s hard stall. The 30s figure looks like *something hitting a timeout*. Most likely a first-request connection/setup cost on a fresh WebKit browser context talking to the cloud Supabase: Supabase client init, TLS/connection warmup, or a cookie/session propagation timing quirk on the very first authenticated server-action POST of a context.

## Next steps to investigate

1. Capture the Playwright trace of a stalled run — `trace.zip` is uploaded as the `playwright-report` artifact on failure (see `.github/workflows/ci.yml`). Inspect the network waterfall for the hung request and its duration.
2. Test whether a warmup request / Supabase connection reuse **before** the first save removes the stall.
3. Check whether `requireUser()`'s `auth.getUser()` cookie round-trip contributes on the first hit of a fresh context.

## Impact

Low for real users — a 30s save is rare and they aren't retry-gated. Currently absorbed by Playwright's CI auto-retry, so the suite stays green. Tracked here so the retry isn't silently relied upon and the root cause gets a proper trace-driven fix.
