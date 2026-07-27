# Release Repository Governance — Verification Report

**Plan:** `docs/superpowers/plans/2026-07-26-release-repository-governance.md`
**Integration PR:** [#132](https://github.com/izzzthisssagar/qa-mastery/pull/132) (squash-merged)
**Verified commit:** `724967a11086556e9d905328ab451972f6c91bb9` (main)
**Report generated:** 2026-07-27T10:35:40Z
**Owner:** Sagar (izzzthisssagar)

This report records what was actually run, when, against what commit, and
what it returned — not what was assumed. Status values used below: `passed`,
`failed`, `not configured`, `not run`, `owner approval pending`. A retry does
not erase an earlier failure; both are recorded where relevant.

---

## Step 1 — Local/static contract

Run against `724967a` (worktree tree confirmed identical to `origin/main`,
`git diff --stat HEAD origin/main` empty).

| Command                                | Result              | Notes                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node --version`                       | `v25.9.0`           | **Local dev machine only** — outside the repo's declared `>=24 <25` range (pnpm prints an `Unsupported engine` warning on every command as a result). CI correctly pins `node-version: 24` (`ci.yml`) and every CI job in this session ran on real Node 24. Not a repo defect; recorded honestly as a local-environment mismatch. |
| `pnpm --version`                       | `11.6.0`            | Matches `packageManager` field exactly.                                                                                                                                                                                                                                                                                           |
| `pnpm install --frozen-lockfile`       | passed              | `Already up to date`.                                                                                                                                                                                                                                                                                                             |
| `pnpm audit --prod --audit-level high` | passed              | 17 findings (4 low, 13 moderate), **0 high**. Was 20 findings / 3 high before this session's fix (see Findings §1).                                                                                                                                                                                                               |
| `pnpm verify`                          | passed              | Full chain: format:check, lint, typecheck, test, curriculum sync, and all 10 `check-*.mjs` invariant gates (runtime-alignment, workspace-scripts, dep-cycles, semantic-tokens, actions-auth, rls-coverage, doc-consistency, e2e-ci-shape, workflow-pins, deploy-gate).                                                            |
| `pnpm build`                           | passed              | All 3 Next.js apps (platform, buggyshop, buggyapi) build clean.                                                                                                                                                                                                                                                                   |
| `git diff --check`                     | passed              | No whitespace/conflict-marker errors.                                                                                                                                                                                                                                                                                             |
| `git status --short`                   | 3 intentional files | `.gitignore` (new `artifacts/` ignore rule), `docs/04-invariants.md` (Findings §3 fix), `scripts/check-doc-consistency.mjs` (Findings §3 fix). One stray `turbo.json` diff excluded per this session's known concurrent-multi-window artifact — not staged/committed.                                                             |

## Step 2 — Live database gate (clean reset)

| Command                                             | Result | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm exec supabase start`                          | passed | Local stack up.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm exec supabase db reset`                       | passed | All 37 migrations applied clean, `0001`→`0036` (`20260612000001_init.sql` → `20260726000036_user_xp_total.sql`), seed applied.                                                                                                                                                                                                                                                                                                                     |
| `node scripts/check-rls-coverage.mjs`               | passed | 27 of 67 tables have a direct RLS test (43 pre-existing, named exemptions).                                                                                                                                                                                                                                                                                                                                                                        |
| `pnpm test:rls`                                     | passed | **10/10 test files, 55/55 tests**, including `xp-total-rls.test.ts`. First run without `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` exported silently skipped 9 of 10 files (`describe.skipIf(!hasEnv)`) — re-ran with `supabase status -o env`'s values exported; all tests then ran and passed. Recorded as a real local-DX gap, not a repo defect: the plan's own command doesn't export these first. |
| `pnpm --filter @qa-mastery/curriculum sync --apply` | passed | `0 lesson file(s) found` / `applied: 0 track(s), 0 module(s), 0 lesson(s), 1 archived` — matches the documented current state (no live lesson `.mdx` content in this checkout, notes wiki is the live content system).                                                                                                                                                                                                                             |

## Step 3 — Production-build browser suites

**Not re-run locally.** CI already ran the full pinned-container suite against
this exact commit as part of Task 15's live release-gate proof, and again on
`main` after merge — using that as the evidence rather than duplicating an
identical run:

| Suite                                                                        | CI run                                                                               | Result                                                                         |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `e2e-core` (4 shards)                                                        | [30257200734](https://github.com/izzzthisssagar/qa-mastery/actions/runs/30257200734) | passed (all 4)                                                                 |
| `e2e-buggyapi` (contracts)                                                   | same run                                                                             | passed                                                                         |
| `e2e-first-paint`                                                            | same run                                                                             | passed                                                                         |
| `e2e-full` (visual regression + a11y)                                        | same run                                                                             | passed — ran because this was a push to `main`                                 |
| `merge-playwright-reports`                                                   | same run                                                                             | passed                                                                         |
| `rls` (CI's own live-DB job)                                                 | same run                                                                             | passed                                                                         |
| `security` (secret-scan, dependency-audit, dependabot-config, security-gate) | same run                                                                             | passed                                                                         |
| `release-gate`                                                               | same run                                                                             | **passed** — confirmed exact aggregate context name used for branch protection |

Artifact: merged Playwright HTML/JUnit report is the `merge-playwright-reports`
job's uploaded artifact on run 30257200734 (GitHub Actions artifact storage,
7-day retention per `e2e-shard.yml`).

## Step 4 — Forbidden release-pattern audit

```
rg -n '@(main|master|latest)|:[[:space:]]*latest|vercel@latest|rm -rf \.git' .github/workflows
rg -n 'as any|eslint-disable' apps packages services
rg -n 'two apps|13 migrations|Node[^\n]*>=20|build both apps' README.md ARCHITECTURE.md CLAUDE.md DEPLOYMENT.md SECURITY.md docs
```

| Check                                                   | Result                                    |
| ------------------------------------------------------- | ----------------------------------------- |
| Mutable action/image/CLI refs in workflows              | **0 matches** — passed                    |
| `as any` / `eslint-disable` in app/package/service code | 18 matches, all reviewed (below)          |
| Stale doc phrasing                                      | **1 match found and fixed** (Findings §2) |

**`as any`/`eslint-disable` review** — every match carries either an inline
rationale or an explicit `TECH_DEBT:` label pointing at this plan's Task 5:

- `apps/platform/.../learn/actions-architecture.test.ts:57-58` — not a real
  instance; a test _asserting the absence_ of `as any` in generated source.
- 6× `eslint-disable-next-line @next/next/no-img-element` (notes, talent
  avatar/profile components) — each has an inline `--` comment explaining why
  (external thumbnail CDN or a signed Supabase Storage URL, neither
  Next-optimizable).
- 2× `apps/buggyapi/src/app/api/soap/route.ts` (`as any` on parsed SOAP XML) —
  `TECH_DEBT:` labeled, tracked to Task 5.
- `apps/buggyapi/src/app/api/graphql/route.ts:110`,
  `apps/buggyapi/src/api/attachments.ts:50`,
  `apps/buggyapi/src/api/index.ts:417` (untyped Supabase `select()` row
  shapes) — `TECH_DEBT:` labeled, tracked to Task 5.
- 3× `eslint-disable-next-line @next/next/no-html-link-for-pages`
  (`apps/buggyapi/src/app/page.tsx`) — inline comments explaining these are
  Hono/yoga/XML-served routes, not Next pages.

No unlabeled escape hatches found. No fix needed.

## Step 5 — Reconcile superseded pull requests

**Status: owner approval pending.** Seven open draft PRs overlap work now on
`main` via #132 (linked in that PR's description): #131, #130, #129, #128,
#124, #122, #116. Per the plan, closing or labeling them needs a separate
explicit owner approval per PR — not requested or granted in this session, so
none were touched. Recorded here as an explicit open item rather than silently
skipped.

## Step 6 — This report

Published as this file; see commit below.

---

## Task 15 — Live release-gate proof and branch protection (recap)

Performed earlier in this session; recapped here for the completeness of this
final audit:

1. Pushed the integration branch, opened PR #132 as a draft, linked every
   Wave-1 commit and this plan.
2. Watched real CI: found and fixed two genuine defects live (`packages/config`
   eslint plugins misclassified as production `dependencies`, inflating
   `pnpm audit --prod` with tooling-only findings; `e2e-shard.yml`'s
   `shard`/`shard_total` `number`-typed workflow_call inputs resolving to `0`
   instead of empty when unset, producing an invalid `--shard=0/0`). Both
   fixed, pushed, re-verified green (commit `b9a72cc`).
3. One `e2e-core (1)` failure was a transient Docker port-bind race
   (`0.0.0.0:54322` already in use) — reran that job alone, passed. Confirmed
   flake, not a regression.
4. Confirmed the exact aggregate check context: **`release-gate`**.
5. Confirmed no production/staging deploy fires for a PR (`deploy.yml`/
   `deploy-staging.yml` last ran 2026-07-23, four days before this PR).
6. Snapshotted `main`'s branch protection before any change
   (`artifacts/governance/branch-protection-before.json`, local-only,
   gitignored — not committed per the plan).
7. Applied, with explicit owner approval: `required_status_checks.strict=true`
   - `contexts=["release-gate"]`, `required_pull_request_reviews.
required_approving_review_count=1` + `dismiss_stale_reviews=true`,
     `required_conversation_resolution=true`, `enforce_admins=true`. Read back
     and asserted every field (`artifacts/governance/branch-protection-after.json`).
8. **Mid-merge correction:** the 1-review requirement blocked merging #132 —
   this is a solo-maintainer repo with no second reviewer, and the PR author
   cannot approve their own PR (confirmed both by this session's tooling
   refusing to submit a self-approval, and by GitHub's own merge check). With
   explicit owner approval, `required_approving_review_count` was dropped to
   `0`; `release-gate`, `enforce_admins`, and `required_conversation_resolution`
   were left unchanged. **Current live state on `main`:**
   `required_status_checks.contexts=["release-gate"]` (strict), 0 required
   reviews, `enforce_admins=true`, `required_conversation_resolution=true`.
9. Merged #132 (squash) → `724967a`. CI on `main` succeeded for that exact
   SHA (run 30257200734, includes `e2e-full`). Staging
   (`migrate-and-seed`, run 30257735657) and production (run 30257736160)
   both consumed `head_sha=724967a` — verified via
   `gh api .../actions/runs/<id> -q .head_sha` on all three runs, all three
   returned the identical SHA. Production per-app results: `platform` — real
   Vercel deploy + `/api/health` check, passed. `buggyshop` — same, passed.
   `buggyapi`/`buggyapi-ws` — cleanly skipped (infra not yet provisioned,
   matches documented state). No deployment rebuilt a different commit.

---

## Findings

### 1. `packages/config` dependency misclassification (fixed, commit `b9a72cc`)

Discovered live on PR #132's first CI run. `eslint-plugin-react`,
`eslint-plugin-react-hooks`, `globals`, `typescript-eslint` were declared as
production `dependencies` of `@qa-mastery/config` rather than
`devDependencies`. Nothing outside an `eslint.config.mjs` imports
`@qa-mastery/config` (verified by grep). This inflated
`pnpm audit --prod --audit-level high` with 3 high-severity `brace-expansion`
ReDoS advisories that never touch a deployed runtime. **Fixed:** moved to
`devDependencies`. `pnpm audit --prod --audit-level high` now exits 0 (17
findings, 0 high — down from 20/3-high).

### 2. `e2e-shard.yml` shard-arg bug (fixed, commit `b9a72cc`)

Also discovered live on PR #132's first CI run. `shard`/`shard_total` are
`type: number` `workflow_call` inputs with no `default`; GitHub Actions
resolves an unsupplied numeric input to `0`, not empty. The guard
`[ -n "${{ inputs.shard }}" ]` treated that `0` as "present", so the
unsharded `first-paint` and `buggyapi` suites both received
`--shard=0/0`, which Playwright rejects outright. **Both suites had been
failing on every run since Task 10 landed** — nobody had watched a live run
until Task 15. **Fixed:** guard now checks `-gt 0` on both inputs explicitly.

### 3. `docs/04-invariants.md` was stale and out of Task 13's coverage (fixed, this session)

Step 4's stale-phrasing sweep caught `docs/04-invariants.md:54` — "The two
apps run on different ports/origins." — the file predates BuggyAPI entirely
(zero mentions anywhere) and wasn't in Task 13's `check-doc-consistency.mjs`
`DOC_FILES` list, so it silently missed that pass. **Fixed:** invariants 1
(manifest secrecy), 3 (practice-app auth, renamed from "BuggyShop auth"), 4
(`bs_*`/`ba_*` sandbox scoping), and 7 (seeded-bug flags — `bugFlag`/
`apiBugFlag`) now describe both practice apps, matching `CLAUDE.md`'s current
invariants. Also added `docs/04-invariants.md` and `docs/10-caching.md` (same
gap — edited in Task 13, never added to the checked-files list) to
`DOC_FILES` so this class of drift is caught going forward. Re-verified: 0
false positives from either file's existing content.

### 4. Staging and production deploy in parallel, not staging-gated (open, not fixed)

The plan's Completion Gate criterion 4 states "production starts only after
staging verification." In the actual implementation, `deploy.yml` and
`deploy-staging.yml` are two independent workflows that both trigger on the
same `workflow_run` (CI completion) event — they run **concurrently**, not
staging-then-production. Verified in this session: both runs for `724967a`
started within the same second (`createdAt: 2026-07-27T10:21:25Z` for both).
Production's success did not depend on staging's outcome in any observed
run. This is a real gap between the documented/intended behavior and the
actual workflow graph. **Not fixed** — doing so (e.g. via `needs:` across
workflows, which GitHub Actions doesn't support directly, or collapsing both
into one workflow) is a meaningful design change to `deploy.yml`, out of
scope for an audit-and-report task without a separate explicit go-ahead.

### 5. Branch protection currently has zero required reviews (open, owner-accepted)

`main`'s live protection requires the `release-gate` check, admin
enforcement, and conversation resolution, but **not** a human approval — the
1-review requirement set in Task 15 blocked the very first merge attempt
(solo maintainer, no second reviewer, self-approval blocked both by this
session's tooling and by GitHub itself) and was dropped to `0` with explicit
owner approval mid-session. This is accepted as the practical tradeoff for a
solo-maintainer repo, not an oversight — recorded here so it's an explicit,
visible decision rather than a silent one.

### 6. Superseded draft PRs not reconciled (owner approval pending)

See Step 5 above — #131, #130, #129, #128, #124, #122, #116 all overlap
commits now on `main`. Not closed, not labeled, no owner approval requested
or given in this session for that specific action.

---

## Completion Gate — self-assessment against the plan's 10 criteria

| #   | Criterion                                                                                                                                                                          | Status                                                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `pnpm audit --prod --audit-level high`, `pnpm verify`, `pnpm build`, live RLS, all required Playwright suites, and security pass on the same integration SHA                       | **passed** — all on `724967a` (build/audit/verify run locally against the identical tree; RLS/Playwright/security via CI run 30257200734) |
| 2   | Every workspace participates in lint, typecheck, and direct/unit test orchestration                                                                                                | **passed** — `pnpm verify`'s turbo-orchestrated lint/typecheck/test covers all 13 workspace packages                                      |
| 3   | `release-gate` successful on `main` and protected-branch settings require its observed exact context                                                                               | **passed** — confirmed both                                                                                                               |
| 4   | Staging and production consume the successful CI `head_sha`; production starts only after staging verification and configured health checks                                        | **partial** — same-SHA consumption confirmed; staging-before-production ordering is **not** actually implemented (Finding 4)              |
| 5   | No workflow uses mutable action/container/CLI references and no deploy step deletes repository metadata                                                                            | **passed**                                                                                                                                |
| 6   | BuggyShop and BuggyAPI direct tests preserve the documented seeded-defect matrix and secure controls                                                                               | **passed** (Task 4, re-verified via `pnpm test` in this session's `pnpm verify` run)                                                      |
| 7   | Learning actions are thin authenticated boundaries, `lessonRelease()` strictly typed, curriculum caches invalidate explicitly, XP aggregation in PostgreSQL without tenant leakage | **passed** (Tasks 7-9, re-verified via `pnpm test:rls`'s `xp-total-rls.test.ts` in this session)                                          |
| 8   | Canonical documentation describes three Next.js apps, one WebSocket service, Node 24, current migrations, real commands, and the actual gated release path                         | **passed** — `check-doc-consistency.mjs` now covers 13 docs including the two gaps this audit found                                       |
| 9   | Contributor governance is present; license status is explicitly owner-approved or explicitly recorded as pending                                                                   | **passed** — MIT, owner-approved (Task 14)                                                                                                |
| 10  | The verification report records evidence and unresolved external configuration honestly; `not configured` is never represented as `passed`                                         | **this report** — Findings 4-6 recorded as open/pending, not passed                                                                       |

**Wave 1 is complete with two recorded open items** (Findings 4 and 6) that
need a separate owner decision, not silent closure.
