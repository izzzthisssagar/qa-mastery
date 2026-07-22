# Open (test-infra) — containerized E2E: `createServiceClient` sees no env on most authenticated routes

**Status:** open, unresolved · **Severity:** blocks the `checks` CI job (E2E stage times out at 45min and gets cancelled) · **Filed:** 2026-07-22

## Symptom

The `checks` job's E2E step (`docker run ... mcr.microsoft.com/playwright:v1.60.0-noble
... playwright test`) runs to the 45-minute job ceiling and gets cancelled.
`[WebServer]` stderr in the job log is dominated by:

```
Error: createServiceClient requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
    at ... packages/db/src/service.ts
```

Confirmed via `gh run view --log --job=<id> | grep -c "createServiceClient requires"`:
**1010 occurrences** in one full 45-min run, **432** in another (partial,
cancelled early by a superseding push). It fires for essentially every
authenticated route the e2e suite touches — dashboard, tasks, visual
regression's "dashboard (authenticated app chrome)" case — while routes that
don't call `createServiceClient` (the marketing homepage) pass every time.
Each failure retries twice (`retries: 2` in `playwright.config.ts`), so the
whole 198-test cross-app suite triples in cost and the job never finishes
inside 45 minutes.

**Confirmed pre-existing** — not introduced by the Phase 8b (streaks +
dashboard restructure) push. The same error, same magnitude, is present in
the CI run for the prior Phase 8a push (`gh run view --log --job=88825918215`,
432 hits before that run was cancelled by a superseding push, not by the
error itself).

## What's been ruled out

Repro'd the exact pinned image locally (`docker run` with the same
`--env-file` mechanism, same bind-mounted repo, same
`corepack enable && corepack prepare pnpm@11.6.0 --activate && pnpm --filter
@qa-mastery/platform start` command CI uses):

- `docker run --env-file` correctly propagates a test env file's vars into
  the container's top-level process — verified with a plain `env | grep`
  smoke test inside the same image.
- `pnpm --filter @qa-mastery/platform exec env` shows the vars reaching the
  filtered package's process — pnpm's `--filter` doesn't strip env.
- Started the real `pnpm --filter @qa-mastery/platform start` in a
  detached container and read `/proc/<next-server-pid>/environ` directly —
  `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are both present
  and correct on the actual running `next-server (v16.2.9)` process, not just
  on an ancestor shell.
- Read Playwright's `webServerPlugin.js` source directly: `env: { FORCE_COLOR:
  '1', ...process.env, ...this._options.env }` — it *always* spreads the
  full `process.env` into every `webServer` entry's child process
  automatically, whether or not that entry declares its own `env:` field.
  Ruled out "buggyshop's webServer config has no explicit `env:` spread,
  platform's does" as the asymmetry — Playwright doesn't need the explicit
  spread at all; it's redundant (harmless) on platform's entry, not required
  on buggyshop's.
- All zero-arg call sites (`createServiceClient()`, ~60 of them across the
  codebase) rely on the function's own default-parameter env reads
  (`packages/db/src/service.ts`) — none pass an explicit `undefined`/`null`
  override that would bypass the default.

None of that reproduces the failure: every mechanism checked shows env
reaching the real server process correctly. Something specific to the full
CI run — real Supabase connectivity, real authenticated sessions/cookies, two
concurrent Playwright workers under load, or some other condition this scratch
repro didn't recreate — still trips it. Not yet isolated.

## Next steps (not yet attempted)

- A debug CI push that logs `Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)`
  and `Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)` directly inside
  `createServiceClient`'s throw branch (temporarily) would confirm whether
  it's really "env absent" vs. some other exception surfacing under the same
  digest/message by coincidence.
- Full local repro needs a dockerized Supabase reachable from the container
  (macOS Docker Desktop doesn't support `--network host` the way the Linux CI
  runner does — `127.0.0.1` inside the container isn't the host there) plus
  a real authenticated session/cookie, neither of which this pass set up.
- Worth checking whether the failure correlates with the *second* Playwright
  worker specifically, or with request concurrency once real DB round-trips
  are in the loop (this repro never got databases involved).

## Impact while open

`security`, `dependency-audit`, and `secret-scan` CI jobs are unaffected and
pass independently of this. Only the `checks` job (lint/typecheck/unit
tests/build all pass fine — it's specifically the E2E stage) times out.
PRs are not auto-blocked from being reviewed/merged on their other signal,
but the E2E suite provides no real coverage signal until this is fixed.
