# Contributing to QA Mastery

Thanks for taking the time to contribute. This is a small, actively-developed
monorepo — read this before opening a PR so your change lands cleanly on the
first pass.

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md).
Participation in issues, PRs, and discussions means agreeing to it.

## Before you start

- Read [`CLAUDE.md`](./CLAUDE.md) for the seven non-negotiable invariants
  (manifest secrecy, score-write ownership, fake sandbox auth, `sandbox_id`
  scoping, lesson-slug immutability, widget registry validation, seeded-bug
  flags). A PR that breaks one of these will be rejected regardless of what
  else it does well.
- Read [`ARCHITECTURE.md`](./ARCHITECTURE.md) and
  [`docs/README.md`](./docs/README.md) for the system model before touching
  unfamiliar code.

## Local setup

```bash
pnpm install
pnpm db:start          # local Supabase stack (requires Docker Desktop)
pnpm db:status          # copy the printed anon/service keys into apps/*/.env.local
pnpm dev
```

## The quality gate — run this before every push

```bash
pnpm verify
```

`pnpm verify` runs, in order: formatting (Prettier), lint, typecheck, every
package's unit tests, curriculum content validation, and the full chain of
repo-invariant checkers (`scripts/check-*.mjs` — runtime alignment, workspace
scripts, dependency cycles, semantic design tokens, server-action auth
boundaries, RLS test coverage, doc consistency, E2E CI shape, workflow
SHA-pinning, deploy-gate shape). CI's `checks` job currently runs only a
subset of this (lint, typecheck, unit tests, RLS-coverage check, E2E-shape
check, curriculum validation) — the rest of the checker chain is enforced
locally only for now. Run `pnpm verify` yourself before every push regardless
of what CI happens to cover; a checker that only exists locally is exactly as
real an invariant as one wired into CI, it's just not yet a hard PR gate.

Two gates `pnpm verify` does **not** run locally because they need
infrastructure CI already has:

- **Live RLS regression suite** (`pnpm test:rls`) — runs against a real
  Postgres instance with RLS enabled, proving learners can't write their own
  scores or read another learner's `bs_*`/`ba_*` sandbox rows. Run it
  yourself with `pnpm db:start` first if you touched any migration, policy,
  or server action that writes scored/sandboxed data.
- **Sharded Playwright E2E** (`pnpm e2e`) — Chromium + WebKit across every
  learner-facing flow, including the iframe/token-handoff path (WebKit is not
  optional there — Safari's storage-partitioning behavior is exactly what
  that suite guards against). CI shards this across 4 jobs and merges one
  Playwright report; a PR only runs the full labeled suite when it carries
  the `full-e2e` label, otherwise a smaller default set runs on every push.

## Seeded-bug rules

BuggyShop (`apps/buggyshop`) and BuggyAPI (`apps/buggyapi`) are
**deliberately** flawed practice apps. Their bugs (`BS-###` / `BA-###`) are
intentional teaching material behind `bugFlag`/`apiBugFlag`, not defects to
silently patch:

- Never fix a seeded bug's behavior directly in application code — that
  removes the exercise. If a seeded bug's _implementation_ needs to change
  (not its observable behavior), update the manifest and the app in the same
  PR and say so explicitly in the description.
- Every PR touching BuggyShop/BuggyAPI or their manifests must state in the
  PR template whether it changed the intentional-bug registry, and if so,
  which IDs and why.
- A report about a seeded bug's _intended_ behavior is not a security issue
  or a real bug — see [`SECURITY.md`](./SECURITY.md).

## Database migrations

Migrations live in `supabase/migrations/` and are applied in filename order —
`YYYYMMDDHHMMSS_description.sql`. Because more than one contributor (or
concurrent agent session) can be adding a migration at the same time:

1. Run `ls supabase/migrations | tail -5` immediately before naming your new
   file, and generate the timestamp prefix from the current time — don't
   reuse or guess a round number. Two migrations landing with the same
   timestamp is a silent ordering bug, not a merge conflict git will catch
   for you.
2. Re-check right before you commit (`git status`, `git diff --cached
--stat`) that you're not staging a migration file someone else's
   concurrent session already added under a colliding name.
3. Migrations are forward-only once merged to `main` — write a new
   corrective migration rather than editing a merged one.

## Evidence in your PR

Fill out every section of the [pull request template](.github/
pull_request_template.md): scope, risk, intentional-bug-registry impact,
what tests you ran (and their output), accessibility impact for any UI
change, migration/deployment impact, and screenshots or terminal output as
evidence for anything not covered by an automated test.

## Secrets

Never commit a real API key, token, or credential — see the
[Secrets](./SECURITY.md#secrets) section of `SECURITY.md`. Local Supabase
keys belong in a gitignored `.env.local`; everything else comes from the
deploy host's secret store. If you accidentally commit a secret, rotate it
immediately and say so in the PR — don't rely on a force-push to hide it.

## Reporting a security issue

Do **not** open a public issue for a vulnerability. See
[`SECURITY.md`](./SECURITY.md) for the private reporting process.
