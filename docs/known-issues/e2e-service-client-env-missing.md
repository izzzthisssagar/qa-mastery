# Resolved (test-infra) — containerized E2E: `createServiceClient` saw no env on most authenticated routes

**Status:** fixed 2026-07-22 · **Severity:** was blocking the `checks` CI job (E2E stage timed out at 45min and got cancelled) · **Filed:** 2026-07-22 · **Fixed:** 2026-07-22

## Symptom

The `checks` job's E2E step (`docker run ... mcr.microsoft.com/playwright:v1.60.0-noble
... playwright test`) ran to the 45-minute job ceiling and got cancelled.
`[WebServer]` stderr was dominated by:

```
Error: createServiceClient requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
    at ... packages/db/src/service.ts
```

~1000 occurrences per full run. Fired for essentially every authenticated
route the e2e suite touches — dashboard, tasks, visual regression's
"dashboard (authenticated app chrome)" case — while routes that don't call
`createServiceClient` (the marketing homepage) passed every time. Each
failure retried twice (`retries: 2`), tripling the effective cost of the
198-test cross-app suite and blowing the 45-minute budget every run.
Confirmed present in the CI run for the prior push too — pre-existing, not
introduced by that work.

## Root cause

`.github/workflows/ci.yml`'s "Write env for containerized E2E" step:

```bash
env | grep -E '^(NEXT_PUBLIC_|SUPABASE_|SANDBOX_JWT_SECRET|BILLING_ENABLED)=' > /tmp/e2e.env
```

The alternation group `(NEXT_PUBLIC_|SUPABASE_|...)` sits directly against
the required trailing `=` with **no wildcard in between**. For the two exact
literal alternatives (`SANDBOX_JWT_SECRET`, `BILLING_ENABLED`) that's fine —
the full key name is already spelled out. But for the two _prefix_
alternatives, the pattern only matches a variable **literally named**
`NEXT_PUBLIC_` or `SUPABASE_` — it never matches `NEXT_PUBLIC_SUPABASE_URL=...`,
because nothing in the pattern accounts for the `SUPABASE_URL` between the
prefix and the `=`. Reproduces instantly outside CI, no container needed:

```bash
$ echo "NEXT_PUBLIC_FOO=bar" | grep -E '^(NEXT_PUBLIC_)='
$ echo $?
1   # no match
```

So `/tmp/e2e.env` silently ended up with only `BILLING_ENABLED`,
`SANDBOX_JWT_SECRET`, and the unconditionally-appended `CI=true` — 3 lines,
79 bytes — never `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_PLATFORM_URL`, or
`NEXT_PUBLIC_BUGGYSHOP_URL`, even though every one of those was correctly
set on the host step that wrote the file (confirmed via that step's own
`env:` log preamble). `docker run --env-file /tmp/e2e.env` then faithfully
loaded exactly those 3 vars into the container — env propagation itself
(docker, pnpm --filter, Playwright's `webServer` plugin) was never at fault;
verified via direct repro (docker env-file propagation, pnpm --filter
inheritance, `/proc/<pid>/environ` on the real running `next-server`
process, reading Playwright's `webServerPlugin.js` source) before finding
the actual bug — none of that reproduced the failure because none of it
involved the malformed grep.

`NEXT_PUBLIC_SUPABASE_URL` still "worked" for read access in some contexts
because Next.js statically inlines `NEXT_PUBLIC_*` references at build time
(the host `pnpm build` step had the correct value) — confirmed via a
temporary diagnostic showing the resolved `url` was correct while
`"NEXT_PUBLIC_SUPABASE_URL" in process.env` was `false` on the actual
container's running server. `SUPABASE_SERVICE_ROLE_KEY` (not
`NEXT_PUBLIC_`-prefixed, by design never inlined — it's a secret) had no
such fallback and was genuinely absent at runtime, which is what actually
threw.

## Fix

```bash
env | grep -E '^(NEXT_PUBLIC_|SUPABASE_).*=|^(SANDBOX_JWT_SECRET|BILLING_ENABLED)=' > /tmp/e2e.env
```

`.* ` between the prefix group and `=` lets the prefix alternatives match
any key starting with `NEXT_PUBLIC_`/`SUPABASE_`, not just those two exact
names. The two literal-name vars stay a separate alternation (already
correct, unchanged in shape). Verified locally against a synthetic `env`
dump before pushing — all 4 intended vars matched, an unrelated `OTHER_VAR`
did not leak in.

## Diagnosis trail (temporary instrumentation, since reverted)

Two throwaway commits (`d67a65f` diagnostic in `createServiceClient`'s throw
message — pid/env-key-presence/counts; `e854474` a CI step dumping
`/tmp/e2e.env`'s keys with values redacted) were pushed and then reverted
once they'd done their job. The `e854474` dump was the one that actually
nailed it — 3-line, 79-byte file, immediately reproducible with a one-line
local `grep` once seen. Both diagnostics are gone from the tree; this doc is
the permanent record.

## Lessons

- **A local repro that doesn't reproduce the failure is informative, not
  conclusive** — it proves the _mechanisms you tested_ aren't at fault, not
  that the bug is elsewhere. Every layer checked here (docker, pnpm, the
  actual runtime process, Playwright's source) really was fine; the bug was
  one layer earlier, in the shell one-liner that built the input file none
  of those layers had any reason to distrust.
- **Prefer testing regex changes against a real sample line, not just
  reading the pattern.** `grep -E '^(PREFIX_)='` reads as "starts with
  PREFIX*" at a glance; it says "is exactly PREFIX*". The one-character fix
  (`.*` before `=`) would have been obvious from a single `echo | grep`
  sanity check before ever committing the original line.
- CI's `env: <var>: ***` preamble (GitHub's own display of a step's resolved
  environment) is trustworthy and was correct throughout — the bug was
  entirely in what the step's _script_ did with that environment, not in
  what the runner provided.
