# Release and Repository Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make QA Mastery's local verification truthful, make security and full browser coverage control production, remove mutable supply-chain inputs, reduce high-risk orchestration and data-transfer hotspots, and make the repository's documentation and contributor rules match the code that ships.

**Architecture:** Keep the monorepo and its package DAG. Add one fast local verification contract, direct unit tests for practice-app logic, a sharded CI workflow with one aggregate release gate, and a reusable security workflow invoked by CI. Deploy the exact CI-verified commit only after the aggregate gate succeeds, using archived source rather than deleting Git metadata. Preserve Next.js 16's current non-Cache-Components model while adding explicit curriculum caches and invalidation.

**Tech Stack:** Node.js 24, pnpm 11.6.0, Turbo 2, TypeScript 5, ESLint 9 flat config, Prettier 3.6.2, Vitest 4, Playwright 1.60.0, Next.js 16.2.11, Supabase/PostgreSQL, GitHub Actions, Vercel CLI 57.0.0, Fly CLI 0.4.74.

## Global Constraints

- Start from the reviewed remediation integration checkpoint created after Wave 0; do not develop these tasks in the shared checkout or in the dirty `wt-p1-governance` worktree.
- Before changing any Next.js application, read the installed Next.js 16.2.11 documentation at `node_modules/next/dist/docs/01-app/02-guides/server-actions.md`, `01-app/01-getting-started/08-caching.md`, `01-app/01-getting-started/09-revalidating.md`, `01-app/03-api-reference/01-directives/use-server.md`, `01-app/03-api-reference/01-directives/use-cache.md`, `01-app/02-guides/caching-without-cache-components.md`, `01-app/03-api-reference/04-functions/unstable_cache.md`, and `01-app/03-api-reference/04-functions/updateTag.md`.
- Treat every exported Server Action as a public POST boundary: authenticate, authorize, validate, and return only serializable data at that boundary.
- Do not enable `cacheComponents` in this wave. The repository currently uses the previous caching model, so `unstable_cache` is permitted until a separately tested Cache Components migration.
- BuggyShop and BuggyAPI are intentionally vulnerable practice applications. Unit tests must identify seeded defects by release and also protect secure control paths; never silently “fix” curriculum defects.
- The lockfile is a serialized path. Only the dependency/runtime task may change `pnpm-lock.yaml` until its commit is integrated.
- Supabase migrations are serialized. The next migration is exactly `20260726000036_user_xp_total.sql`; verify that no newer migration was integrated before creating it.
- Workflow files, authentication, migrations, service-role access, and seeded-bug registries require human review before integration.
- Never merge an old automated branch tip. Extract only reviewed behavior from commits `1cab5d5`, `e55231b`, `13dc612`, `29e208f`, `6877207`, and `47189d2`, then adapt it to the current checkpoint.
- Do not push, merge, deploy, close pull requests, change branch protection, create repository secrets, or publish releases without explicit approval.
- No production job may run from `push`. Production and staging consume `github.event.workflow_run.head_sha` from a successful CI run on `main`.
- A skipped application deployment caused by missing infrastructure configuration is not a successful release. The release summary must call it `not configured` and production readiness remains blocked for that target.
- Keep historical incident narratives in `docs/known-issues/**`; workflow comments retain the current reason and a link.
- Each task ends with the focused tests plus `pnpm verify` unless the task explicitly requires the live Supabase or E2E gates.

## File Map and Ownership

**Runtime, scripts, and linting**

- `package.json`, `pnpm-lock.yaml`, `.node-version` — one Node/pnpm/dependency policy and root commands.
- `.prettierrc.json`, `.prettierignore` — repository formatting contract.
- `packages/config/eslint.base.mjs`, `packages/config/eslint.react.mjs` — shared flat ESLint configuration.
- `**/eslint.config.mjs`, `**/package.json` — uniform workspace participation.
- `scripts/check-runtime-alignment.mjs`, `scripts/check-workspace-scripts.mjs`, `scripts/check-actions-auth.mjs`, `scripts/check-dep-cycles.mjs`, `scripts/check-semantic-tokens.mjs`, `scripts/check-doc-consistency.mjs`, `scripts/check-e2e-ci-shape.mjs`, `scripts/check-deploy-gate.mjs` — executable repository invariants.
- `scripts/test/*.test.mjs` — Node test coverage for every invariant script.

**Practice applications and platform refactors**

- `apps/buggyshop/vitest.config.ts`, `apps/buggyshop/src/lib/*.test.ts` — release-aware direct tests.
- `apps/buggyapi/vitest.config.ts`, `apps/buggyapi/src/api/*.test.ts` — protocol and validation unit tests.
- `apps/platform/src/app/(app)/learn/action-types.ts` — serializable public action types.
- `apps/platform/src/app/(app)/learn/server/*.ts` — server-only domain services.
- `apps/platform/src/app/(app)/learn/actions.ts` — thin authenticated Server Action façade.
- `apps/platform/src/lib/curriculum-cache.ts`, `apps/platform/src/app/api/revalidate-curriculum/route.ts` — tag-based curriculum cache and fail-closed invalidation.
- `supabase/migrations/20260726000036_user_xp_total.sql`, `packages/db/test/xp-total-rls.test.ts` — server-side XP aggregation with tenant isolation.

**Automation and governance**

- `.github/workflows/ci.yml`, `.github/workflows/e2e-shard.yml`, `.github/workflows/security.yml` — sharded verification, reusable security, and aggregate release status.
- `.github/workflows/deploy.yml`, `.github/workflows/staging-migrate.yml` — exact-commit staging/production consumers.
- `e2e/playwright.full.config.ts`, `e2e/merge.config.ts` — complete suite and merged artifact reporting.
- `README.md`, `ARCHITECTURE.md`, `CLAUDE.md`, `DEPLOYMENT.md`, `SECURITY.md`, `docs/README.md`, `docs/01-overview.md`, `docs/02-architecture.md`, `docs/07-development.md`, `docs/08-decisions.md`, `docs/09-deployment.md`, `docs/10-testing.md` — current, non-contradictory system documentation.
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `.github/ISSUE_TEMPLATE/**`, `.github/pull_request_template.md` — contributor workflow and evidence requirements.

---

### Task 1: Align the Runtime and Repair the Production Audit

**Files:**
- Create: `.node-version`
- Create: `scripts/check-runtime-alignment.mjs`
- Create: `scripts/test/check-runtime-alignment.test.mjs`
- Modify: `package.json`
- Modify: `apps/platform/package.json`
- Modify: `apps/buggyshop/package.json`
- Modify: `apps/buggyapi/package.json`
- Modify: `e2e/package.json`
- Modify: `packages/*/package.json`
- Modify: `services/buggyapi-ws/package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- `checkRuntimeAlignment(root): Violation[]` verifies Node engine/types, Next/ESLint patch equality, patched direct dependencies, and protected overrides.
- Runtime policy is `node >=24 <25`; all workspace `@types/node` declarations are `^24`.

- [ ] **Step 1: Write the failing runtime-alignment test**

Create fixtures that reproduce the current drift and assert these messages:

```js
assert.deepEqual(checkRuntimeAlignment(fixtureRoot), [
  "package.json: engines.node must be >=24 <25",
  "apps/platform/package.json: next and eslint-config-next must both be 16.2.11",
  "apps/buggyapi/package.json: fast-xml-parser must be >=5.10.1",
  "packages/shared/package.json: @types/node must use ^24",
]);
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test scripts/test/check-runtime-alignment.test.mjs`

Expected: FAIL because the checker is absent.

- [ ] **Step 3: Implement the checker and exact version policy**

Set:

```json
{
  "engines": { "node": ">=24 <25" },
  "pnpm": { "overrides": { "postcss@<8.5.12": "8.5.21" } }
}
```

Write `24` to `.node-version`. Align each Next application on `next: 16.2.11` and `eslint-config-next: 16.2.11`. Change every direct `@types/node` declaration to `^24`. Change BuggyAPI's direct `fast-xml-parser` minimum to `^5.10.1` and retain the existing vulnerable-range workspace override as a supply-chain backstop.

- [ ] **Step 4: Regenerate once and prove the audit outcome**

Run:

```bash
pnpm install
node scripts/check-runtime-alignment.mjs
pnpm audit --prod --audit-level high
pnpm install --frozen-lockfile
```

Expected: all four commands PASS; the lockfile resolves PostCSS 8.5.21 for the vulnerable range.

- [ ] **Step 5: Commit the serialized dependency change**

```bash
git add .node-version package.json pnpm-lock.yaml apps packages e2e services scripts/check-runtime-alignment.mjs scripts/test/check-runtime-alignment.test.mjs
git commit -m "fix(deps): align Node and repair production audit"
```

### Task 2: Make Workspace Scripts and `verify` Truthful

**Files:**
- Create: `packages/config/eslint.base.mjs`
- Create: `packages/config/eslint.react.mjs`
- Create: `packages/*/eslint.config.mjs`
- Create: `e2e/eslint.config.mjs`
- Create: `scripts/check-workspace-scripts.mjs`
- Create: `scripts/test/check-workspace-scripts.test.mjs`
- Modify: `package.json`
- Modify: `turbo.json`
- Modify: every workspace `package.json`

**Interfaces:**
- Every workspace exports `lint`, `typecheck`, and `test`.
- `pnpm verify` is the fast, no-external-service contract: runtime alignment, format check, lint, typecheck, direct/unit tests, curriculum validation, dependency-cycle check, semantic-token check, action-auth check, RLS coverage check, documentation consistency, and workflow-shape checks.
- `pnpm test` invokes every workspace test script; live database behavior remains the explicit `pnpm test:rls` gate.

- [ ] **Step 1: Write the failing workspace-contract test**

Scan `pnpm-workspace.yaml`, resolve each package manifest, and assert every workspace contains non-empty `lint`, `typecheck`, and `test` scripts. Assert root `verify` names every static gate exactly once.

- [ ] **Step 2: Run the test and confirm the current omissions**

Run: `node --test scripts/test/check-workspace-scripts.test.mjs`

Expected: FAIL for shared packages, BuggyShop, BuggyAPI, DB, and E2E participation.

- [ ] **Step 3: Add shared ESLint flat configs and package commands**

`eslint.base.mjs` owns TypeScript parser, import hygiene, unused-variable behavior, and ignores. `eslint.react.mjs` extends the base with React/JSX and browser globals. Each package imports one of these files; application configs also spread Next's core-web-vitals and TypeScript arrays.

Add direct test commands to Task 4's two practice apps. In `@qa-mastery/db`, set `test` to the existing Vitest suite; absent live Supabase variables may skip environment-dependent cases, while CI's dedicated RLS job proves they run. Give E2E a Node-test command for its configuration tests rather than aliasing Playwright's expensive browser suite.

- [ ] **Step 4: Add root commands without hiding integration requirements**

Use:

```json
{
  "scripts": {
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "test:rls": "pnpm --filter @qa-mastery/db test:rls",
    "verify": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm --filter @qa-mastery/curriculum sync && node scripts/check-runtime-alignment.mjs && node scripts/check-workspace-scripts.mjs && node scripts/check-dep-cycles.mjs && node scripts/check-semantic-tokens.mjs && node scripts/check-actions-auth.mjs && node scripts/check-rls-coverage.mjs && node scripts/check-doc-consistency.mjs && node scripts/check-e2e-ci-shape.mjs && node scripts/check-deploy-gate.mjs"
  }
}
```

Document that `verify` is local/static and that CI additionally runs live RLS, builds, browser suites, and security.

- [ ] **Step 5: Run and commit**

```bash
node --test scripts/test/check-workspace-scripts.test.mjs
pnpm lint
pnpm typecheck
pnpm test
git add package.json turbo.json packages apps e2e services scripts
git commit -m "build(repo): make workspace verification truthful"
```

Expected: all commands PASS and `turbo lint --dry=json` lists every workspace.

### Task 3: Add One Repository Formatter Contract

**Files:**
- Create: `.prettierrc.json`
- Create: `.prettierignore`
- Modify: `package.json`
- Modify: all formatter-supported source, Markdown, JSON, YAML, CSS, and MDX files selected by Prettier

**Interfaces:**
- `pnpm format` writes formatting.
- `pnpm format:check` verifies formatting without writes.

- [ ] **Step 1: Add the exact formatter dependency and failing check**

Pin `prettier: 3.6.2` in root dev dependencies, add `format` and `format:check`, and run `pnpm format:check`.

Expected: FAIL on the existing inconsistent surface.

- [ ] **Step 2: Define the stable contract**

Create:

```json
{
  "printWidth": 100,
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "proseWrap": "preserve"
}
```

Ignore generated builds, coverage, Playwright reports, snapshot images, Supabase local state, package stores, `node_modules`, and durable binary media. Do not ignore authored TypeScript, Markdown, JSON, YAML, CSS, or MDX.

- [ ] **Step 3: Apply formatting in one mechanical commit**

Run:

```bash
pnpm format
pnpm format:check
pnpm verify
git diff --stat
git diff --check
git add .prettierrc.json .prettierignore package.json pnpm-lock.yaml apps packages services e2e scripts docs .github README.md ARCHITECTURE.md CLAUDE.md DEPLOYMENT.md SECURITY.md
git commit -m "style(repo): establish repository formatting contract"
```

Expected: PASS. Review `git diff --stat` to ensure no binary baseline or generated build was rewritten.

### Task 4: Add Direct Tests for BuggyShop and BuggyAPI

**Files:**
- Create: `apps/buggyshop/vitest.config.ts`
- Create: `apps/buggyshop/src/lib/cart.test.ts`
- Create: `apps/buggyshop/src/lib/checkout.test.ts`
- Create: `apps/buggyshop/src/lib/catalog.test.ts`
- Create: `apps/buggyshop/src/lib/security-controls.test.ts`
- Create: `apps/buggyapi/vitest.config.ts`
- Create: `apps/buggyapi/src/api/bugs.test.ts`
- Create: `apps/buggyapi/src/api/schemas.test.ts`
- Create: `apps/buggyapi/src/api/soap.test.ts`
- Modify: `apps/buggyshop/package.json`
- Modify: `apps/buggyapi/package.json`
- Modify: `apps/buggyapi/src/app/api/soap/route.ts`

**Interfaces:**
- Tests express the release matrix explicitly rather than treating deliberate bugs as regressions.
- SOAP parsing/escaping helpers are pure exported functions; the route remains the I/O boundary.

- [ ] **Step 1: Write failing BuggyShop release-matrix tests**

Cover quantity validation, totals, checkout validation, catalog controls, and secure paths. For BS-016, assert letters are still accepted in release 1.1 because the current seeded registry defines no fixed release. Do not copy the interrupted draft's false expectation that 1.1 fixes BS-016.

- [ ] **Step 2: Write failing BuggyAPI pure-logic tests**

Cover `apiBugFlag`, schema success/failure envelopes, SOAP XML escaping, request parsing, and WSDL generation. Assert an intentional defect only when its selected release/flag activates it; assert the safe branch otherwise.

- [ ] **Step 3: Run both suites and confirm RED**

```bash
pnpm --filter @qa-mastery/buggyshop test
pnpm --filter @qa-mastery/buggyapi test
```

Expected: FAIL because test configuration and SOAP pure exports are absent.

- [ ] **Step 4: Add Vitest configuration and the smallest pure extraction**

Use `environment: "node"`, include only `src/**/*.test.ts`, and configure no coverage threshold yet. Extract pure SOAP helpers without changing response status, media type, XML shape, or seeded bug behavior.

- [ ] **Step 5: Verify browser contracts still agree and commit**

```bash
pnpm --filter @qa-mastery/buggyshop test
pnpm --filter @qa-mastery/buggyapi test
pnpm --filter @qa-mastery/e2e exec playwright test --config=playwright.buggyapi.config.ts
pnpm verify
git add apps/buggyshop apps/buggyapi
git commit -m "test(practice): add release-aware direct coverage"
```

### Task 5: Enforce Action, Dependency, and Token Conventions

**Files:**
- Create: `scripts/check-actions-auth.mjs`
- Create: `scripts/check-dep-cycles.mjs`
- Create: `scripts/check-semantic-tokens.mjs`
- Create: `scripts/test/check-actions-auth.test.mjs`
- Create: `scripts/test/check-dep-cycles.test.mjs`
- Create: `scripts/test/check-semantic-tokens.test.mjs`
- Modify: application Server Actions that fail the new contract
- Modify: ESLint suppression comments found by the convention scan

**Interfaces:**
- Every Server Action module contains an explicit authentication path per exported action or delegates to a named authenticated wrapper recognized by the checker.
- Package dependency edges remain acyclic and flow from applications toward reusable packages.
- Practice-app suppressions use `INTENTIONAL_BUG: <bug-id>`; product suppressions use `TECH_DEBT: <reason and issue>`.

- [ ] **Step 1: Recover tests, not branch ancestry**

Inspect commit `29e208f` with `git show`. Recreate its invariant tests on the current checkpoint, retaining current action return types and newer dependencies.

- [ ] **Step 2: Run the three focused suites and confirm RED**

```bash
node --test scripts/test/check-actions-auth.test.mjs
node --test scripts/test/check-dep-cycles.test.mjs
node --test scripts/test/check-semantic-tokens.test.mjs
```

- [ ] **Step 3: Implement syntax-aware checks**

Use TypeScript parsing for exported functions and package imports; do not use a raw grep as the security decision. The action checker allows a recognized `getAuthedUserId()` or wrapper call in the exported function body and reports file, export, and line. The dependency checker detects cycles and forbidden upward package edges. The token checker reports unexplained hard-coded product colors outside approved practice-app and test fixtures.

- [ ] **Step 4: Classify every existing suppression**

Add either:

```ts
// INTENTIONAL_BUG: BS-016 accepts alphabetic postal codes in all current releases.
```

or:

```ts
// TECH_DEBT: <specific reason>; tracked by <issue URL or issue number>.
```

No generic `eslint-disable` comment remains unexplained.

- [ ] **Step 5: Verify and commit**

```bash
node --test scripts/test/check-actions-auth.test.mjs scripts/test/check-dep-cycles.test.mjs scripts/test/check-semantic-tokens.test.mjs
pnpm verify
git add scripts apps packages
git commit -m "build(repo): enforce action and package conventions"
```

### Task 6: Preserve Authentication Destinations

**Files:**
- Modify: `apps/platform/src/app/(auth)/actions.ts`
- Modify: `apps/platform/src/app/(auth)/auth-form.tsx`
- Modify: `apps/platform/src/app/auth/callback/route.ts`
- Modify: `apps/platform/src/proxy.ts`
- Create: `apps/platform/src/lib/safe-next-path.ts`
- Create: `apps/platform/src/lib/safe-next-path.test.ts`
- Modify: authenticated E2E login helpers and redirect assertions

**Interfaces:**
- `safeNextPath(value): string` accepts only same-origin application paths beginning with one `/`; it rejects protocols, protocol-relative URLs, backslashes, control characters, and auth-loop destinations.
- Login, signup, and email confirmation retain a validated destination.

- [ ] **Step 1: Write the redirect-security tests**

Assert `/notes/x` survives, while `https://evil.example`, `//evil.example`, `\\evil.example`, `/login`, and encoded control-character variants become `/dashboard`.

- [ ] **Step 2: Run the focused tests and confirm RED**

Run: `pnpm --filter @qa-mastery/platform test -- safe-next-path`

Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Adapt the reviewed behavior from `6877207`**

Parse `next` once at the proxy/auth boundary, validate it again at the Server Action boundary, carry it through the callback's signed OAuth state or explicit safe query parameter, and redirect only to `safeNextPath()` output. Do not trust a hidden form field by itself.

- [ ] **Step 4: Add browser coverage and commit**

```bash
pnpm --filter @qa-mastery/platform test -- safe-next-path
pnpm --filter @qa-mastery/e2e exec playwright test -g "preserves protected destination|rejects external next"
pnpm verify
git add apps/platform e2e
git commit -m "fix(auth): preserve only safe return destinations"
```

### Task 7: Split Learning Actions Behind Thin Authenticated Boundaries

**Files:**
- Create: `apps/platform/src/app/(app)/learn/action-types.ts`
- Create: `apps/platform/src/app/(app)/learn/server/access.ts`
- Create: `apps/platform/src/app/(app)/learn/server/audit.ts`
- Create: `apps/platform/src/app/(app)/learn/server/progress.ts`
- Create: `apps/platform/src/app/(app)/learn/server/quiz.ts`
- Create: `apps/platform/src/app/(app)/learn/server/bug-hunt.ts`
- Create: `apps/platform/src/app/(app)/learn/server/sandbox.ts`
- Create: `apps/platform/src/app/(app)/learn/server/capstone.ts`
- Create: `apps/platform/src/app/(app)/learn/server/code-lab.ts`
- Create: `apps/platform/src/app/(app)/learn/actions-architecture.test.ts`
- Modify: `apps/platform/src/app/(app)/learn/actions.ts`

**Interfaces:**
- `lessonRelease(slug): Release` returns the strict shared release union.
- Server-only services accept an explicit authenticated `userId` and validated domain inputs.
- `actions.ts` retains the current public export names and serializable return shapes.

- [ ] **Step 1: Write the architectural regression test**

Assert `actions.ts` contains `"use server"`, exports exactly `saveProgress`, `submitQuiz`, `submitBugReport`, `getHuntStatus`, `launchSandbox`, `submitCapstone`, `submitCodeLab`, and `pollCodeRun`, calls authentication in each boundary, stays below 220 lines, and contains neither `as any` nor direct service-role queries.

- [ ] **Step 2: Run the test and confirm RED**

Run: `pnpm --filter @qa-mastery/platform test -- actions-architecture`

Expected: FAIL against the current roughly 590-line orchestration file.

- [ ] **Step 3: Move one domain at a time without changing public behavior**

Each file under `server/` begins with `import "server-only"`. Move access checks first, then audit/progress, quiz, bug-hunt, sandbox, capstone, and code-lab. Pass Supabase clients explicitly where a transaction boundary requires it. Preserve concurrency handling, XP idempotency, rate limits, audit events, error messages, and runner polling rules.

- [ ] **Step 4: Remove the release escape hatch**

Make curriculum metadata validation return `Release`; reject an unknown release before minting a handoff token. Replace:

```ts
release: release as any
```

with:

```ts
release
```

- [ ] **Step 5: Verify domain behavior and commit**

```bash
pnpm --filter @qa-mastery/platform test -- actions-architecture
pnpm --filter @qa-mastery/platform test
pnpm --filter @qa-mastery/platform typecheck
pnpm --filter @qa-mastery/e2e exec playwright test -g "lesson|quiz|bug hunt|code lab|capstone"
git add 'apps/platform/src/app/(app)/learn'
git commit -m "refactor(learn): split authenticated action orchestration"
```

### Task 8: Add Explicit Curriculum Caching and Invalidation

**Files:**
- Create: `apps/platform/src/lib/curriculum-cache.ts`
- Create: `apps/platform/src/lib/curriculum-cache.test.ts`
- Create: `apps/platform/src/app/api/revalidate-curriculum/route.ts`
- Create: `apps/platform/src/app/api/revalidate-curriculum/route.test.ts`
- Create: `scripts/notify-curriculum-update.mjs`
- Create: `scripts/test/notify-curriculum-update.test.mjs`
- Modify: curriculum-reading pages/actions and help-agent context call sites
- Modify: `.env.example`

**Interfaces:**
- `getCachedCurriculumIndex()` and `getCachedTopic(slug)` use `unstable_cache` with the `curriculum` tag under the current previous caching model.
- `POST /api/revalidate-curriculum` uses constant-time secret comparison and `revalidateTag("curriculum", { expire: 0 })`.
- `notify-curriculum-update.mjs` fails closed when URL or secret is absent.

- [ ] **Step 1: Write cache-key and route authorization tests**

Mock Next cache/revalidation functions. Assert stable keys, shared `curriculum` tagging, 401 for missing/wrong signatures, no invalidation on failure, and one invalidation on a correct signature.

- [ ] **Step 2: Run focused tests and confirm RED**

```bash
pnpm --filter @qa-mastery/platform test -- curriculum-cache
node --test scripts/test/notify-curriculum-update.test.mjs
```

- [ ] **Step 3: Adapt only current-model behavior from `47189d2`**

Do not enable `cacheComponents` and do not use `updateTag` in the Route Handler. Cache only public curriculum data; never cache user progress, authorization decisions, service-role results, or per-user help-agent state.

- [ ] **Step 4: Wire invalidation to the curriculum publishing command**

After a successful registry sync, call the notifier only when `CURRICULUM_REVALIDATE_URL` and `CURRICULUM_REVALIDATE_SECRET` are configured. A configured-but-failing notifier exits non-zero so content publication cannot report false success.

- [ ] **Step 5: Verify and commit**

```bash
pnpm --filter @qa-mastery/platform test -- curriculum-cache revalidate-curriculum
node --test scripts/test/notify-curriculum-update.test.mjs
pnpm --filter @qa-mastery/platform typecheck
pnpm verify
git add apps/platform scripts .env.example
git commit -m "perf(curriculum): cache public reads with explicit invalidation"
```

### Task 9: Aggregate XP in PostgreSQL Without Cross-Tenant Leakage

**Files:**
- Create: `supabase/migrations/20260726000036_user_xp_total.sql`
- Create: `packages/db/test/xp-total-rls.test.ts`
- Modify: `apps/platform/src/app/(app)/dashboard/page.tsx`
- Modify: generated Supabase database types if the repository tracks them

**Interfaces:**
- `public.my_xp_total()` returns one `bigint` total for `auth.uid()`.
- Anonymous callers have no execute grant; authenticated callers see only their own RLS-filtered XP.

- [ ] **Step 1: Verify the migration slot**

Run:

```bash
ls supabase/migrations | sort | tail -5
test ! -e supabase/migrations/20260726000036_user_xp_total.sql
```

Expected: latest existing migration ends in `000035_notes_updated_at_client_id.sql` and slot 36 is unused. If not, stop and renumber from the current highest migration.

- [ ] **Step 2: Write the failing live RLS test**

Seed Alice and Bob with different XP totals. Assert Alice's authenticated RPC returns only Alice's sum, Bob sees only Bob's, zero-event user returns `0`, and anonymous execution is denied.

- [ ] **Step 3: Run against local Supabase and confirm RED**

```bash
pnpm exec supabase start
pnpm --filter @qa-mastery/db test:rls -- xp-total-rls
```

Expected: FAIL because the function is absent.

- [ ] **Step 4: Add the security-invoker aggregate**

```sql
create or replace function public.my_xp_total()
returns bigint
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(sum(amount), 0)::bigint
  from public.xp_events
  where user_id = auth.uid();
$$;

revoke all on function public.my_xp_total() from public;
grant execute on function public.my_xp_total() to authenticated;
```

- [ ] **Step 5: Replace the unbounded dashboard transfer and verify**

Call `supabase.rpc("my_xp_total")`, parse the returned bigint safely, and render zero on a null total. Treat RPC errors as a logged server error rather than silently presenting a false zero.

```bash
pnpm exec supabase db reset
pnpm test:rls
pnpm --filter @qa-mastery/platform test
pnpm --filter @qa-mastery/platform typecheck
git add supabase/migrations packages/db/test 'apps/platform/src/app/(app)/dashboard/page.tsx'
git commit -m "perf(db): aggregate dashboard XP on the server"
```

### Task 10: Shard E2E and Publish One Merged Report

**Files:**
- Create: `.github/workflows/e2e-shard.yml`
- Create: `e2e/playwright.full.config.ts`
- Create: `e2e/merge.config.ts`
- Create: `e2e/test/ci-shape.test.mjs`
- Create: `scripts/check-e2e-ci-shape.mjs`
- Create: `scripts/test/check-e2e-ci-shape.test.mjs`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- CI jobs are `checks`, `rls`, `e2e-core`, `e2e-buggyapi`, `e2e-first-paint`, `e2e-full`, `merge-playwright-reports`, and a provisional `release-gate`; Task 11 adds the reusable security dependency before deployment may consume this gate.
- Core browser coverage runs as four Playwright shards and produces uniquely named blob artifacts.
- Full accessibility and visual regression run before every `main` release; pull requests may opt in with a `full-e2e` label.

- [ ] **Step 1: Recreate the workflow-shape tests from `13dc612`**

Assert a four-entry shard matrix, reusable E2E workflow, unique artifact names, blob reporter use, merged-report job, separate API/first-paint jobs, full-suite condition, and an aggregate gate whose `needs` includes every required CI job available in this task.

- [ ] **Step 2: Run the shape tests and confirm RED**

```bash
node --test scripts/test/check-e2e-ci-shape.test.mjs e2e/test/ci-shape.test.mjs
```

- [ ] **Step 3: Build the reusable shard workflow**

Accept inputs `suite`, `shard`, `shard_total`, and `artifact_suffix`. Build and seed against local Supabase, then execute Playwright with `--reporter=blob` and `--shard=<n>/<total>` when supplied. Upload `blob-report-${suite}-${artifact_suffix}` even on failure, with seven-day retention.

- [ ] **Step 4: Add deterministic merge and release-gate jobs**

Download all `blob-report-*` artifacts into one directory and run:

```bash
pnpm --filter @qa-mastery/e2e exec playwright merge-reports --config=merge.config.ts ./all-blob-reports
```

Upload one HTML report and one JUnit report. `release-gate` uses `if: always()` and fails unless checks, RLS, every core shard, BuggyAPI, first-paint, and merge are successful. On `main`, `e2e-full` must be successful; on an unlabeled pull request it may be skipped. This provisional gate is not yet deployable: Task 11 adds reusable security to its `needs` set, and Task 12 is the first task permitted to connect deployment.

- [ ] **Step 5: Run local shape checks and commit**

```bash
node --test scripts/test/check-e2e-ci-shape.test.mjs e2e/test/ci-shape.test.mjs
pnpm verify
git add .github/workflows/ci.yml .github/workflows/e2e-shard.yml e2e scripts/check-e2e-ci-shape.mjs scripts/test/check-e2e-ci-shape.test.mjs
git commit -m "ci: shard browser suites and merge reports"
```

### Task 11: Make Security Reusable and Pin Every Execution Input

**Files:**
- Modify: `.github/workflows/security.yml`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/deploy.yml`
- Modify: `.github/workflows/staging-migrate.yml`
- Modify: every remaining `.github/workflows/*.yml` with a mutable `uses:` or image reference
- Create: `scripts/check-workflow-pins.mjs`
- Create: `scripts/test/check-workflow-pins.test.mjs`

**Interfaces:**
- `security.yml` supports `workflow_call` and returns one `security-gate` job.
- All third-party actions use full 40-character commit SHAs; containers use version plus immutable digest; CLIs use exact versions.

- [ ] **Step 1: Write the failing immutable-input test**

Reject `@main`, `@master`, `@latest`, abbreviated SHAs, version-only Docker references, and `npx <package>@latest` throughout `.github/workflows/**`.

- [ ] **Step 2: Run and confirm the current failures**

Run: `node --test scripts/test/check-workflow-pins.test.mjs`

Expected: FAIL for action tags, Gitleaks latest, Fly master, Playwright tag-only, and Vercel latest.

- [ ] **Step 3: Apply the reviewed immutable pins**

Use these exact pins:

```text
actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1
actions/setup-node@820762786026740c76f36085b0efc47a31fe5020
actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a
actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c
pnpm/action-setup@b0f76dfb45f55f8421693e4803ac7bb65143bd34
superfly/flyctl-actions/setup-flyctl@ed8efb33836e8b2096c7fd3ba1c8afe303ebbff1
mcr.microsoft.com/playwright:v1.60.0-noble@sha256:83192064c7510f7ee73dd63dc5f22a5e01a92c81a2e6a9c715d9e3fe55471fd9
zricethezav/gitleaks:v8.30.1@sha256:b109bc5f8f76a38196a3e413704fc5b9e3c32360bce4e4b603bd6f45b3721dbb
```

Pass `version: 0.4.74` to Fly setup and run `npx --yes vercel@57.0.0`.

- [ ] **Step 4: Make security part of the release dependency graph**

Add `workflow_call` to `security.yml`, keep pull-request/manual entry points for diagnostics, and add a final `security-gate` requiring secret scan, production dependency audit, and Dependabot validation. Call it from `ci.yml`; `release-gate` depends on the reusable workflow result.

- [ ] **Step 5: Verify and commit**

```bash
node --test scripts/test/check-workflow-pins.test.mjs
node scripts/check-workflow-pins.mjs
pnpm verify
git add .github/workflows scripts/check-workflow-pins.mjs scripts/test/check-workflow-pins.test.mjs
git commit -m "ci(security): pin inputs and join the release gate"
```

### Task 12: Deploy Only the Exact Verified Commit

**Files:**
- Create: `scripts/check-deploy-gate.mjs`
- Create: `scripts/test/check-deploy-gate.test.mjs`
- Modify: `.github/workflows/deploy.yml`
- Modify: `.github/workflows/staging-migrate.yml`
- Modify: `DEPLOYMENT.md`

**Interfaces:**
- Deployment triggers only from a completed `CI` workflow on `main` with conclusion `success`.
- Checkout/ref/archive/deploy all use `github.event.workflow_run.head_sha`.
- Each configured target emits a health-check result and deployment URL; a failed health check fails the release.

- [ ] **Step 1: Write the failing deploy-gate test**

Parse both workflows and reject `push`, missing `workflow_run`, a checkout without the exact `head_sha`, `rm -rf .git`, floating CLIs, absent health checks, and jobs that do not explicitly test `head_branch == 'main'` plus `conclusion == 'success'`.

- [ ] **Step 2: Run and confirm RED**

Run: `node --test scripts/test/check-deploy-gate.test.mjs`

- [ ] **Step 3: Replace push deployment with exact-commit promotion**

Use:

```yaml
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
```

Gate each release job with:

```yaml
if: >-
  github.event.workflow_run.conclusion == 'success' &&
  github.event.workflow_run.head_branch == 'main'
```

Checkout `ref: ${{ github.event.workflow_run.head_sha }}`. Create `$RUNNER_TEMP/deploy-src` and run `git archive <head_sha> | tar -x -C "$RUNNER_TEMP/deploy-src"`; deploy from that archive. Do not remove `.git` from the checkout.

- [ ] **Step 4: Add staging verification and production health evidence**

Stage database migration and applications from the same SHA. Run migration verification, platform/API smoke, and target health routes. Promote only after those checks succeed. If Vercel or Fly variables are missing, emit `not configured` and fail the aggregate release-readiness job until the owner explicitly marks that target out of scope.

- [ ] **Step 5: Verify and commit**

```bash
node --test scripts/test/check-deploy-gate.test.mjs
node scripts/check-deploy-gate.mjs
pnpm verify
git add .github/workflows/deploy.yml .github/workflows/staging-migrate.yml scripts/check-deploy-gate.mjs scripts/test/check-deploy-gate.test.mjs DEPLOYMENT.md
git commit -m "ci(release): deploy only the verified commit"
```

### Task 13: Make Documentation Machine-Checkable and Canonical

**Files:**
- Create: `scripts/check-doc-consistency.mjs`
- Create: `scripts/test/check-doc-consistency.test.mjs`
- Modify: `README.md`
- Modify: `ARCHITECTURE.md`
- Modify: `CLAUDE.md`
- Modify: `DEPLOYMENT.md`
- Modify: `SECURITY.md`
- Modify: `docs/README.md`
- Modify: `docs/01-overview.md`
- Modify: `docs/02-architecture.md`
- Modify: `docs/07-development.md`
- Modify: `docs/08-decisions.md`
- Modify: `docs/09-deployment.md`
- Modify: `docs/10-testing.md`

**Interfaces:**
- `ARCHITECTURE.md` is the canonical system-context/package-DAG document.
- `docs/02-architecture.md` contains operational detail and links to the canonical context instead of repeating volatile counts.
- Documentation checks derive application/service names, Node range, scripts, and migration count from code.

- [ ] **Step 1: Write failing drift fixtures**

Assert the checker detects “two apps,” Node `>=20`, “13 migrations,” “build both apps,” a missing BuggyAPI/WebSocket surface, absent sibling references such as `../QA-Learning-Platform-Plan.md`, and documented commands that do not exist in root `package.json`.

- [ ] **Step 2: Run against the repository and capture RED output**

```bash
node --test scripts/test/check-doc-consistency.test.mjs
node scripts/check-doc-consistency.mjs
```

- [ ] **Step 3: Update volatile facts from source**

Document three Next.js applications plus one WebSocket service, Node 24, the current generated migration count, the true `pnpm dev/build/test/verify` semantics, BuggyAPI and WebSocket deployment, reusable security, sharded E2E, production promotion, and both deliberately vulnerable practice applications.

- [ ] **Step 4: Consolidate overlapping architecture prose**

Keep system context, dependency direction, trust boundaries, and deployment topology in `ARCHITECTURE.md`. Keep data-model/invariant/operational detail in numbered docs with direct canonical links. Move long workflow incident retrospectives to existing `docs/known-issues/**` entries and leave one-sentence references in configuration.

- [ ] **Step 5: Verify links, commands, and formatting; commit**

```bash
node --test scripts/test/check-doc-consistency.test.mjs
node scripts/check-doc-consistency.mjs
pnpm format:check
pnpm verify
git add README.md ARCHITECTURE.md CLAUDE.md DEPLOYMENT.md SECURITY.md docs scripts/check-doc-consistency.mjs scripts/test/check-doc-consistency.test.mjs
git commit -m "docs: align architecture and operations with current code"
```

### Task 14: Add Contributor Governance Without Inventing Legal Authority

**Files:**
- Create: `CONTRIBUTING.md`
- Create: `CODE_OF_CONDUCT.md`
- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`
- Create: `.github/ISSUE_TEMPLATE/feature_request.yml`
- Create: `.github/ISSUE_TEMPLATE/technical_debt.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`
- Create: `.github/pull_request_template.md`
- Modify: `SECURITY.md`
- Modify: `README.md`
- Human-gated create: `LICENSE`

**Interfaces:**
- Pull requests record scope, risk, intentional-bug impact, tests, accessibility, migration/deployment impact, and screenshots/evidence.
- Security reporting explicitly covers platform, BuggyShop, BuggyAPI, and WebSocket service boundaries.

- [ ] **Step 1: Write a governance-presence test in the documentation checker**

Require all contributor/template files, validate YAML syntax, reject placeholder contact values, and require the PR template's `Intentional bug registry checked` field.

- [ ] **Step 2: Run and confirm RED**

Run: `node --test scripts/test/check-doc-consistency.test.mjs`

- [ ] **Step 3: Add contribution and conduct rules**

Use Contributor Covenant 2.1 with the repository's real enforcement contact from `SECURITY.md`. Explain local `pnpm verify`, live RLS/E2E gates, seeded-bug rules, changeset evidence, migration serialization, and no-secrets policy. Configure blank issues off and point security reports to the private security channel.

- [ ] **Step 4: Pause for the license decision**

Present the owner with the exact proposed license and consequences. The recommended default is MIT for broad reuse, but do not create `LICENSE` until the owner explicitly selects MIT, another license, or `all rights reserved`. A public repository without a license remains legally ambiguous; an agent must not manufacture the owner's licensing intent.

- [ ] **Step 5: Verify and commit non-legal governance**

```bash
node --test scripts/test/check-doc-consistency.test.mjs
pnpm verify
git add CONTRIBUTING.md CODE_OF_CONDUCT.md .github/ISSUE_TEMPLATE .github/pull_request_template.md SECURITY.md README.md
git commit -m "docs(governance): add contributor and issue workflows"
```

If the owner approved a license, add the exact approved `LICENSE` in a separate `docs(legal): add approved license` commit.

### Task 15: Prove the Integrated Release Gate Before Changing Branch Protection

**Files:**
- Modify only if evidence reveals defects: `.github/workflows/ci.yml`, `.github/workflows/security.yml`, `.github/workflows/deploy.yml`
- Generate locally, do not commit: `artifacts/governance/check-runs.json`, `artifacts/governance/branch-protection-before.json`, `artifacts/governance/branch-protection-after.json`
- External setting: GitHub `main` branch protection for `izzzthisssagar/qa-mastery`

**Interfaces:**
- One required `release-gate` context transitively proves static checks, live RLS, builds, required browser suites, merged reports, and security.
- Protected `main` requires an up-to-date branch, one approving review, stale-review dismissal, conversation resolution, and administrator enforcement.

- [ ] **Step 1: Open the integration pull request only after approval**

Push the reviewed integration branch and open one PR with links to every Wave 1 commit and the approved spec. Do not close older PRs yet; label them `superseded-candidate` if the owner approves that label action.

- [ ] **Step 2: Observe real check names instead of guessing them**

Run:

```bash
gh pr checks <integration-pr-number> --watch
gh api repos/izzzthisssagar/qa-mastery/commits/<head-sha>/check-runs --paginate > artifacts/governance/check-runs.json
```

Expected: the aggregate context is exactly `release-gate`, and its successful conclusion follows successful security and required E2E jobs. If GitHub renders a different check name, update this task's branch-protection payload to that observed exact string.

- [ ] **Step 3: Prove deployment has not run for the pull request**

Inspect Actions runs for the PR SHA. Expected: no production deployment; full suite runs only if labeled, while all standard PR gates run.

- [ ] **Step 4: Snapshot current protection and request human approval**

Run read-only:

```bash
gh api repos/izzzthisssagar/qa-mastery/branches/main/protection > artifacts/governance/branch-protection-before.json
```

Show the exact before/after delta. Do not apply it until the owner confirms administrator enforcement and one-review policy.

- [ ] **Step 5: Apply and verify the approved protection**

Use the GitHub API to set strict required status checks to the observed aggregate context, require one approving review with stale-review dismissal, require conversation resolution, and enforce administrators. Immediately read the protection endpoint back into `branch-protection-after.json` and assert every field.

- [ ] **Step 6: Merge through the protected path and observe exact-SHA release**

After approval, merge normally. Verify CI on `main` succeeds, deployment's source SHA equals the successful CI `head_sha`, staging checks succeed before production, each configured health check succeeds, and no deployment rebuilt a different commit.

### Task 16: Run the Final Repository and Release Audit

**Files:**
- Modify only defects found by this audit
- Create: `docs/superpowers/reports/2026-07-26-release-governance-verification.md`

**Interfaces:**
- The report records command, SHA, start/end time, exit status, artifact URL/path, skipped reason, and owner for every required gate.

- [ ] **Step 1: Run the complete local/static contract**

```bash
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm audit --prod --audit-level high
pnpm verify
pnpm build
git diff --check
git status --short
```

Expected: Node 24, pnpm 11.6.0, every command PASS, and only intentional report/evidence files remain uncommitted.

- [ ] **Step 2: Run the live database gate from a clean reset**

```bash
pnpm exec supabase start
pnpm exec supabase db reset
node scripts/check-rls-coverage.mjs
pnpm test:rls
pnpm --filter @qa-mastery/curriculum sync --apply
```

Expected: PASS, including `xp-total-rls.test.ts` and all prior tenant-isolation coverage.

- [ ] **Step 3: Run production-build browser suites**

Use the pinned Playwright image/digest and CI-equivalent environment to run all four core shards, BuggyAPI contracts, first-paint, accessibility, and visual regression. Merge blob reports and record the HTML/JUnit artifact paths.

- [ ] **Step 4: Audit forbidden release patterns**

Run:

```bash
rg -n '@(main|master|latest)|:[[:space:]]*latest|vercel@latest|rm -rf \.git' .github/workflows
rg -n 'as any|eslint-disable' apps packages services
rg -n 'two apps|13 migrations|Node[^\n]*>=20|build both apps' README.md ARCHITECTURE.md CLAUDE.md DEPLOYMENT.md SECURITY.md docs
```

Expected: the first and third commands produce no matches. Every second-command match has a reviewed strict-type migration or an `INTENTIONAL_BUG`/`TECH_DEBT` explanation.

- [ ] **Step 5: Reconcile superseded pull requests and technical debt**

For each old draft PR, compare its changed paths/behavior to integrated commits. With owner approval, comment with the superseding commit/PR and close only fully superseded PRs. Convert any remaining problem statement into an issue with owner, priority, acceptance criteria, and evidence link.

- [ ] **Step 6: Publish the evidence report and commit**

The report must distinguish `passed`, `failed`, `not configured`, `not run`, and `owner approval pending`; retries do not erase initial failure evidence.

```bash
git add docs/superpowers/reports/2026-07-26-release-governance-verification.md
git commit -m "docs(release): record governance verification evidence"
```

## Completion Gate

Wave 1 is complete only when:

1. `pnpm audit --prod --audit-level high`, `pnpm verify`, `pnpm build`, live RLS, all required Playwright suites, and security pass on the same integration SHA.
2. Every workspace participates in lint, typecheck, and direct/unit test orchestration.
3. `release-gate` is successful on `main` and protected-branch settings require its observed exact context.
4. Staging and production consume the successful CI `head_sha`; production starts only after staging verification and configured health checks.
5. No workflow uses mutable action, container, or CLI references and no deploy step deletes repository metadata.
6. BuggyShop and BuggyAPI direct tests preserve the documented seeded-defect matrix and secure controls.
7. Learning actions are thin authenticated boundaries, `lessonRelease()` is strictly typed, curriculum caches invalidate explicitly, and XP aggregation happens in PostgreSQL without tenant leakage.
8. Canonical documentation describes three Next.js apps, one WebSocket service, Node 24, current migrations, real commands, and the actual gated release path.
9. Contributor governance is present; license status is explicitly owner-approved or explicitly recorded as pending.
10. The verification report records evidence and unresolved external configuration honestly; `not configured` is never represented as `passed`.
