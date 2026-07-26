# Loop Control Plane Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the unsafe QA Mastery loop driver with a versioned, deterministic controller that reconciles all work, prevents path collisions, records one ledger attempt per completed action, safely resumes interrupted worktrees, and closes the unfinished video audit with reproducible evidence.

**Architecture:** Keep operational state in `/Users/sajanathapa/Desktop/1/loop-build`, but version only controller source and policy while ignoring worktrees, logs, credentials, and generated mirrors. A Node ESM controller owns backlog transitions, conservative glob locks, Git worktree reconciliation, Loop Context circuit-breaking, and generated state views; the shell entry point becomes a thin wrapper. Video-audit tooling becomes durable under the project vault instead of living in an expiring Claude scratch directory.

**Tech Stack:** Node.js 24 ESM, Node test runner, `minimatch` 10, YAML 2, Git worktrees, `@cobusgreyling/loop-context` 1.3.0, GitHub CLI, Python 3 for the existing YouTube audit algorithm.

## Global Constraints

- Never delete, reset, clean, force-remove, or overwrite an existing branch, worktree, untracked file, or Claude recovery artifact.
- Preserve `/Users/sajanathapa/Desktop/1/My Qa Projecct/qa-mastery` and `/Users/sajanathapa/Desktop/1/loop-build/sessions/wt-p1-governance` exactly until their inventory records and patches have been reviewed.
- Do not run the legacy `run-session.sh` before Task 10 enables the new controller.
- `backlog.json` is the only editable state source; `state.md` and `My Qa Projecct/Loop/BUILD-LOOP-STATE.md` are generated views.
- Valid ticket statuses are exactly `todo`, `ready`, `in-progress`, `blocked`, `review`, `integrated`, and `released`.
- A lane records at most one ledger attempt for one completed agent or verification action; a poll or repeated `--check` never spends tokens again.
- Circuit-breaker defaults are `maxIterations: 10`, `stagnationThreshold: 3`, `noProgressThreshold: 5`, `similarityThreshold: 0.85`, `window: 5`, and `maxTraceLines: 8`.
- The controller must stop after the same failure repeats three times, after five consecutive failures, or when the per-ticket iteration/token cap is reached.
- The controller uses no shared Loop Context daily-spend file; version 1.3.0 can double-count a ledger when checked repeatedly.
- Every active lane has a unique branch, worktree, ledger, path allowlist, and collision-key set.
- An actual changed path must match the lane allowlist and must not match a human-gated pattern.
- Human-gated paths include `.env*`, `supabase/migrations/**`, auth, service-role code, seeded-bug registries, curriculum content, workflows, and deploy configuration.
- No controller step pushes, opens a PR, merges, deploys, or changes repository settings unless a ticket explicitly authorizes that external action and a human approves it.
- Sanitize logs before persistence: redact values whose key contains `TOKEN`, `KEY`, `SECRET`, `PASSWORD`, `COOKIE`, or `AUTHORIZATION`.
- Use atomic write-then-rename for backlog, locks, ledgers, counters, and generated state.
- Run controller tests from `/Users/sajanathapa/Desktop/1/loop-build`; run Loop Context tests from `/Users/sajanathapa/Desktop/1/loop-engineering/tools/loop-context`.
- Commit controller tasks only in the new local `loop-build` Git repository. Do not push it without explicit approval.

## File Map and Ownership

**Versioned controller files under `/Users/sajanathapa/Desktop/1/loop-build`**

- `.gitignore` — excludes config, sessions, ledgers, generated views, temporary evidence, and nested worktrees.
- `package.json` / `package-lock.json` — reproducible controller dependencies and commands.
- `backlog.json` — schema-v2 canonical queue.
- `program-requirements.json` — stable audit-derived ticket definitions added to the historical 41 tickets.
- `budget.yaml` — sole budget configuration consumed by code.
- `gate.yaml` — human-gated patterns and automatic allowlists.
- `run-session.sh` — disabled legacy entry point, later a thin `node src/cli.mjs` wrapper.
- `src/schema.mjs` — backlog/ticket validation and status constants.
- `src/atomic-json.mjs` — locked atomic JSON updates.
- `src/reconcile.mjs` — Git/PR evidence collection and legacy-state migration.
- `src/path-policy.mjs` — glob matching, static-prefix collision detection, and changed-path enforcement.
- `src/ledger.mjs` — per-lane ledger initialization, single append, circuit-breaker decision, and context injection.
- `src/git-worktrees.mjs` — inventory, create, resume, and mismatch detection without destructive cleanup.
- `src/state-view.mjs` — generated Markdown state and vault mirror.
- `src/controller.mjs` — selection, resume, acquire/release, transition, and handoff orchestration.
- `src/cli.mjs` — `inventory`, `reconcile`, `next`, `resume`, `record`, `release`, `render`, and `dry-run` commands.
- `test/*.test.mjs` — deterministic unit/integration tests using temporary Git repositories.

**Ignored runtime files**

- `config.env`, `sessions/**`, `.loop-context/**`, `.locks/**`, `recovery/snapshots/**`, `recovery/handoffs/**`, `state.md`, `PAUSE`, and `*.log`.

**Durable video-audit files under `/Users/sajanathapa/Desktop/1/My Qa Projecct`**

- `Video Audit/extract.py` — extract note/video pairs.
- `Video Audit/fetch.py` — oEmbed plus paced page fetch.
- `Video Audit/slow_refetch.py` — resume only missing duration/caption records.
- `Video Audit/analyze.py` — deterministic report-data generator.
- `Video Audit/video_meta.json` — checkpointed evidence for every unique video.
- `Video Audit/report-data.json` — final counts and affected note paths.
- `Video Audit/README.md` — invocation, limitations, and evidence fields.
- `Video-Audit-Action-Items.md` — human-readable final report.

---

### Task 1: Freeze the Legacy Driver and Version the Controller Source

**Files:**
- Create: `/Users/sajanathapa/Desktop/1/loop-build/.gitignore`
- Create: `/Users/sajanathapa/Desktop/1/loop-build/package.json`
- Create: `/Users/sajanathapa/Desktop/1/loop-build/test/legacy-driver-disabled.test.mjs`
- Modify: `/Users/sajanathapa/Desktop/1/loop-build/run-session.sh`

**Interfaces:**
- Produces: `npm test`, `npm run controller -- <command>`, and an exit-64 disabled legacy entry point.

- [ ] **Step 1: Initialize a local source repository without staging runtime evidence**

Run:

```bash
cd "/Users/sajanathapa/Desktop/1/loop-build"
git init -b controller-v2
```

Expected: a new local repository; no existing file changes and no remote.

- [ ] **Step 2: Write the failing freeze test**

Create `test/legacy-driver-disabled.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("legacy driver refuses to run until controller v2 is enabled", () => {
  const result = spawnSync("bash", ["run-session.sh"], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
    env: { ...process.env, LOOP_BUILD_TEST_MODE: "1" },
  });
  assert.equal(result.status, 64);
  assert.match(result.stderr, /controller v2 is not enabled/i);
});
```

- [ ] **Step 3: Run the test and observe the unsafe legacy behavior**

Run: `node --test test/legacy-driver-disabled.test.mjs`

Expected: FAIL because the current shell script does not exit 64. `LOOP_BUILD_TEST_MODE=1` must be checked before config loading so the test cannot start an agent.

- [ ] **Step 4: Replace the driver body with a fail-closed guard**

Use this complete temporary `run-session.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
echo "loop-build: controller v2 is not enabled; use the approved recovery plan." >&2
exit 64
```

- [ ] **Step 5: Add exact source/runtime ignores and package metadata**

Create `.gitignore`:

```gitignore
config.env
PAUSE
state.md
sessions/
.loop-context/
.locks/
recovery/snapshots/
recovery/handoffs/
*.log
node_modules/
```

Create `package.json`:

```json
{
  "name": "qa-mastery-loop-controller",
  "private": true,
  "type": "module",
  "engines": { "node": ">=24 <25" },
  "scripts": {
    "test": "node --test test/*.test.mjs",
    "controller": "node src/cli.mjs"
  },
  "dependencies": {
    "@cobusgreyling/loop-context": "file:../loop-engineering/tools/loop-context",
    "minimatch": "10.0.3",
    "yaml": "2.8.0"
  }
}
```

- [ ] **Step 6: Install, test, inspect the staged surface, and commit**

Run:

```bash
npm install
npm test
git status --short
git add .gitignore package.json package-lock.json run-session.sh test/legacy-driver-disabled.test.mjs README.md SETUP.md backlog.json budget.yaml gate.yaml lib prompts
git diff --cached --name-only
git commit -m "chore(loop): freeze legacy driver and version controller source"
```

Expected: PASS; `config.env`, `sessions/**`, and logs are absent from the staged list.

### Task 2: Inventory Existing Work Without Mutating It

**Files:**
- Create: `/Users/sajanathapa/Desktop/1/loop-build/src/cli.mjs`
- Create: `/Users/sajanathapa/Desktop/1/loop-build/src/redact.mjs`
- Create: `/Users/sajanathapa/Desktop/1/loop-build/src/inventory.mjs`
- Create: `/Users/sajanathapa/Desktop/1/loop-build/test/inventory.test.mjs`

**Interfaces:**
- Produces: `redact(value: unknown): unknown` and `inventory({ repo, sessionsDir, gh? }): Promise<Inventory>`.
- `Inventory` contains `generatedAt`, `repoHead`, `originMain`, `worktrees[]`, `branches[]`, `dirtyPaths[]`, `pullRequests[]`, and `warnings[]`.

- [ ] **Step 1: Write failing redaction and dirty-worktree tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { redact } from "../src/redact.mjs";

test("redact removes nested credential values", () => {
  assert.deepEqual(
    redact({ token: "abc", nested: { authorization: "Bearer abc", path: "/safe" } }),
    { token: "[REDACTED]", nested: { authorization: "[REDACTED]", path: "/safe" } },
  );
});
```

Add a temporary-repository test that creates a branch, worktree, modified tracked file, and untracked file, then asserts `inventory()` reports both paths without changing `git status --porcelain`.

- [ ] **Step 2: Run the tests and observe missing-module failures**

Run: `npm test`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/redact.mjs`.

- [ ] **Step 3: Implement read-only collection with `execFile`**

Use `git -C <repo> worktree list --porcelain`, `status --porcelain=v1`, `branch --format`, `rev-parse HEAD`, and `rev-parse origin/main`. When `gh` is available, use:

```bash
gh pr list --state all --limit 200 --json number,title,state,isDraft,headRefName,baseRefName,mergeable,statusCheckRollup,url
```

Never interpolate paths into a shell command; call `execFile` with argument arrays. Pass the result through `redact()` before writing it.

Create `src/cli.mjs` with only the `inventory` command in this task. It parses `--repo` and `--out`, calls `inventory()`, redacts the result, and writes a sibling temporary file before renaming it over the output. Task 4 extracts that write protocol into `atomic-json.mjs`; later tasks extend this same command surface and do not depend on a future file.

- [ ] **Step 4: Generate the protected baseline snapshot**

Run:

```bash
npm run controller -- inventory \
  --repo "/Users/sajanathapa/Desktop/1/My Qa Projecct/qa-mastery" \
  --out "recovery/snapshots/2026-07-26-pre-controller.json"
git -C "/Users/sajanathapa/Desktop/1/My Qa Projecct/qa-mastery" status --short
git -C "sessions/wt-p1-governance" status --short
```

Expected: the snapshot records the shared checkout and `wt-p1-governance` dirty paths; both status outputs remain unchanged.

- [ ] **Step 5: Test and commit**

Run: `npm test`

Expected: PASS.

```bash
git add src/cli.mjs src/redact.mjs src/inventory.mjs test/inventory.test.mjs
git commit -m "feat(loop): inventory interrupted work without mutation"
```

### Task 3: Upgrade and Reconcile the Canonical Backlog

**Files:**
- Modify: `/Users/sajanathapa/Desktop/1/loop-build/src/cli.mjs`
- Create: `/Users/sajanathapa/Desktop/1/loop-build/src/schema.mjs`
- Create: `/Users/sajanathapa/Desktop/1/loop-build/src/reconcile.mjs`
- Create: `/Users/sajanathapa/Desktop/1/loop-build/program-requirements.json`
- Create: `/Users/sajanathapa/Desktop/1/loop-build/test/schema.test.mjs`
- Create: `/Users/sajanathapa/Desktop/1/loop-build/test/reconcile.test.mjs`
- Modify: `/Users/sajanathapa/Desktop/1/loop-build/backlog.json`

**Interfaces:**
- Produces: `STATUSES`, `validateBacklog(value)`, `migrateLegacyBacklog(legacy, evidence)`, and `selectReady(backlog)`.
- Every ticket contains `id`, `program`, `title`, `scope`, `acceptanceCriteria[]`, `evidenceSources[]`, `status`, `dependsOn[]`, `ownedPaths[]`, `collisionKeys[]`, `autonomy`, `attempts`, `lane`, `branch`, `worktree`, `baseCommit`, `headCommit`, `ledgerPath`, `verification[]`, `pullRequest`, `supersedes[]`, and `externalApprovals[]`.

- [ ] **Step 1: Write failing schema and resume-selection tests**

```js
test("selectReady resumes an intact in-progress ticket before new work", () => {
  const backlog = fixtureBacklog([
    ticket({ id: "P2-1", status: "in-progress", worktree: "/tmp/wt", headCommit: "abc" }),
    ticket({ id: "P4-4", status: "ready" }),
  ]);
  assert.equal(selectReady(backlog).id, "P2-1");
});

test("validation rejects an unowned active ticket", () => {
  assert.throws(
    () => validateBacklog(fixtureBacklog([ticket({ status: "in-progress", lane: null })])),
    /in-progress ticket requires lane, branch, worktree, baseCommit, headCommit, and ledgerPath/,
  );
});
```

- [ ] **Step 2: Run tests and observe missing schema failures**

Run: `npm test`

Expected: FAIL because `validateBacklog` and `selectReady` do not exist.

- [ ] **Step 3: Define the exact audit-derived requirement IDs**

`program-requirements.json` must add these stable programs without renumbering historical `P0-*` through `PC-*` IDs:

```text
CTRL-01 inventory/reconciliation
CTRL-02 canonical schema/generated state
CTRL-03 path locks/mechanical gate
CTRL-04 per-lane ledgers/circuit breaking
CTRL-05 safe worktree resume
CTRL-06 video-audit reconciliation
REL-01 dependency audit/runtime alignment
REL-02 truthful scripts/verify/formatter
REL-03 CI sharding/merged reports/aggregate gate
REL-04 immutable workflow dependencies
REL-05 CI-and-security-gated deploy
REL-06 convention/dependency-cycle gates
REL-07 practice-app unit tests
REL-08 learning action split/strict Release
REL-09 curriculum caching/invalidation
REL-10 database XP aggregation
REL-11 documentation consistency/consolidation
REL-12 contributor governance/branch protection
UX-01 shell/design tokens/icons
UX-02 adaptive navigation/theme
UX-03 accessibility/error/media states
UX-04 Knowledge Base/save reliability
UX-05 simulator utilities/diagnostics
UX-06 responsive portfolio
PROD-01 personal notes
PROD-02 coding workspaces
PROD-03 community/notification quality
PROD-04 onboarding/profile/mastery
STRAT-01 adaptive recommendations
STRAT-02 offline/PWA/mobile
STRAT-03 trusted credentials/benchmarking
STRAT-04 SAST/DAST/performance/SBOM
STRAT-05 environment schema/privacy/observability/promotion
```

Each entry copies its acceptance criteria and evidence source from the approved remediation specification; it does not use prose such as “finish UX work.”

- [ ] **Step 4: Implement deterministic migration rules**

- `done` becomes `integrated` only when its recorded implementation commit is an ancestor of `origin/main`; otherwise it becomes `review`.
- `pr-open` becomes `review` and records the PR number/head/base/check conclusions.
- `in-progress` stays `in-progress` only when its worktree exists and HEAD matches recorded evidence; P2-1 is marked `blocked` with reason `interrupted worktree requires explicit recovery` if that proof is absent.
- `blocked` stays `blocked` and gains a structured `blocker` plus the smallest required external decision.
- `todo` becomes `ready` only when all dependencies are `integrated` or `released`; otherwise it stays `todo`.
- Preserve `attempts`; never reset them during migration.
- Record the nine extraction commits from the approved spec in `evidenceSources`, not as proof that the branch tip is safe.

- [ ] **Step 5: Extend the CLI and reconcile live evidence into schema v2**

Add `reconcile`, `validate`, and `summary` subcommands to `src/cli.mjs`; each validates inputs with `schema.mjs` before writing or printing output.

Run:

```bash
npm run controller -- reconcile \
  --inventory recovery/snapshots/2026-07-26-pre-controller.json \
  --requirements program-requirements.json \
  --write backlog.json
npm run controller -- validate
npm run controller -- summary
```

Expected: exactly 41 historical tickets plus 33 stable remediation requirements; no `pr-open` or legacy `done` status remains; P2-1 is not silently skipped.

- [ ] **Step 6: Test and commit canonical state**

```bash
npm test
git add backlog.json program-requirements.json src/cli.mjs src/schema.mjs src/reconcile.mjs test/schema.test.mjs test/reconcile.test.mjs
git commit -m "feat(loop): reconcile canonical remediation backlog"
```

Expected: PASS and one valid schema-v2 backlog.

### Task 4: Add Atomic State and Generated Views

**Files:**
- Modify: `/Users/sajanathapa/Desktop/1/loop-build/src/cli.mjs`
- Create: `/Users/sajanathapa/Desktop/1/loop-build/src/atomic-json.mjs`
- Create: `/Users/sajanathapa/Desktop/1/loop-build/src/state-view.mjs`
- Create: `/Users/sajanathapa/Desktop/1/loop-build/test/atomic-json.test.mjs`
- Create: `/Users/sajanathapa/Desktop/1/loop-build/test/state-view.test.mjs`

**Interfaces:**
- Produces: `updateJson(path, transform)`, `renderState(backlog, inventory)`, and `writeStateViews({ backlog, inventory, localPath, vaultPath })`.

- [ ] **Step 1: Write failing atomicity and deterministic-render tests**

Create two concurrent updates against the same temporary JSON file and assert neither increment is lost. Render the same backlog twice and assert byte-for-byte equality, with counts ordered `todo`, `ready`, `in-progress`, `blocked`, `review`, `integrated`, `released`.

- [ ] **Step 2: Run tests and observe missing-module failures**

Run: `npm test`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement lockfile plus rename semantics**

`updateJson()` must:

1. create `<path>.lock` with `open(..., "wx")`;
2. retry lock acquisition for at most 2 seconds in 50ms intervals;
3. parse and validate the current file;
4. apply the synchronous transform;
5. write `<path>.<pid>.tmp`, `fsync`, and rename over the destination;
6. remove only the lock it created in `finally`.

It must never unlink a pre-existing lock on timeout.

- [ ] **Step 4: Generate both views from the same payload**

The Markdown output includes timestamp, origin/main, active lanes, next ready ticket, status counts, blockers, review/PR links, and recovery snapshot. It starts with:

```markdown
# QA Mastery Build Loop — Generated State

> Generated from `loop-build/backlog.json`. Do not edit this file.
```

- [ ] **Step 5: Add the render command, test, render, and commit**

Extend `src/cli.mjs` with `render`; it loads one validated backlog/inventory payload and passes it to both state-view destinations.

```bash
npm test
npm run controller -- render
diff state.md "/Users/sajanathapa/Desktop/1/My Qa Projecct/Loop/BUILD-LOOP-STATE.md"
git add src/atomic-json.mjs src/cli.mjs src/state-view.mjs test/atomic-json.test.mjs test/state-view.test.mjs
git commit -m "feat(loop): make state atomic and views generated"
```

Expected: PASS; `diff` is empty except for an optional vault-relative link section supplied identically to both outputs.

### Task 5: Enforce Path Ownership and Human Gates Mechanically

**Files:**
- Create: `/Users/sajanathapa/Desktop/1/loop-build/src/path-policy.mjs`
- Create: `/Users/sajanathapa/Desktop/1/loop-build/test/path-policy.test.mjs`
- Modify: `/Users/sajanathapa/Desktop/1/loop-build/gate.yaml`

**Interfaces:**
- Produces: `staticPrefix(pattern)`, `patternsMayOverlap(a, b)`, `acquireLaneLock(ticket, activeLocks)`, and `validateChangedPaths(ticket, paths, gate)`.

- [ ] **Step 1: Write failing collision and bypass tests**

```js
test("conservatively rejects wildcard prefixes that may collide", () => {
  assert.equal(patternsMayOverlap("apps/platform/src/**", "apps/platform/src/app/**"), true);
});

test("rejects a changed migration even when the ticket owns a broad app glob", () => {
  assert.deepEqual(
    validateChangedPaths(
      { ownedPaths: ["**"] },
      ["supabase/migrations/20260726000036_x.sql"],
      gate,
    ).humanGated,
    ["supabase/migrations/20260726000036_x.sql"],
  );
});

test("does not confuse service.ts with service-role code", () => {
  assert.equal(minimatch("apps/platform/src/lib/example-service.ts", "**/*service*role*"), false);
});
```

- [ ] **Step 2: Run tests and observe missing-policy failures**

Run: `npm test`

Expected: FAIL because the path-policy module does not exist.

- [ ] **Step 3: Replace the ambiguous gate with exact patterns**

Set `gate.yaml` human-gated patterns to:

```yaml
human_gate:
  - ".env"
  - ".env.*"
  - "**/.env"
  - "**/.env.*"
  - "supabase/migrations/**"
  - "apps/platform/src/app/(auth)/**"
  - "apps/platform/src/app/auth/**"
  - "apps/platform/src/lib/auth.ts"
  - "apps/platform/src/lib/supabase/service.ts"
  - "packages/db/src/service.ts"
  - "packages/shared/src/bug-flag.ts"
  - "apps/buggyapi/src/api/bugs.ts"
  - "packages/curriculum/content/**"
  - ".github/workflows/**"
  - "services/**/fly.toml"
```

Add `collision_keys` for `lockfile`, `migrations`, `auth-shell`, `workflow`, `shared-ui-exports`, and `learn-actions`.

- [ ] **Step 4: Implement conservative lock acquisition**

Two tickets conflict when collision keys intersect or any pair of owned-path static prefixes has a prefix relationship. This may reject independent work under one broad glob, but it must never allow two writers into a possibly shared path.

Actual changed paths come from `git status --porcelain=v1 -z` and must each match at least one `ownedPaths` minimatch. Any human-gated match changes the controller result to `blocked` and writes a handoff; it never deletes the diff.

- [ ] **Step 5: Test and commit**

```bash
npm test
git add gate.yaml src/path-policy.mjs test/path-policy.test.mjs
git commit -m "feat(loop): enforce lane ownership and human gates"
```

### Task 6: Integrate One Per-Lane Loop Context Ledger

**Files:**
- Create: `/Users/sajanathapa/Desktop/1/loop-build/src/ledger.mjs`
- Create: `/Users/sajanathapa/Desktop/1/loop-build/test/ledger.test.mjs`
- Modify: `/Users/sajanathapa/Desktop/1/loop-engineering/tools/loop-context/src/cli.ts`
- Modify: `/Users/sajanathapa/Desktop/1/loop-engineering/tools/loop-context/src/context-manager.ts`
- Modify: `/Users/sajanathapa/Desktop/1/loop-engineering/tools/loop-context/test/cli.test.mjs`
- Modify: `/Users/sajanathapa/Desktop/1/loop-engineering/tools/loop-context/test/context-manager.test.mjs`

**Interfaces:**
- Produces: `ledgerPath(lane)`, `initializeLedger(ticket)`, `appendAttemptOnce(ledger, attemptId, attempt)`, `decisionFor(ledger, limits)`, and `resumeContext(ticket, ledger, gitDiff)`.
- Extends persisted attempts with controller metadata `{ attemptId, verification?: string[] }`; Loop Context continues to consume its existing fields.

- [ ] **Step 1: Write failing idempotency and injection tests**

```js
test("the same completed action is appended once", async () => {
  await appendAttemptOnce(file, "verify:abc123", successAttempt);
  await appendAttemptOnce(file, "verify:abc123", successAttempt);
  assert.equal(JSON.parse(await readFile(file, "utf8")).attempts.length, 1);
});

test("resume context labels attempts factually instead of banning every prior action", () => {
  const text = buildContextInjection(ledger([
    attempt(1, "success", { action: "install dependencies" }),
    attempt(2, "failure", { action: "run test", error: "ECONNREFUSED" }),
  ]));
  assert.match(text, /Actions already attempted/);
  assert.doesNotMatch(text, /do NOT repeat: install dependencies/);
});
```

- [ ] **Step 2: Run both suites and observe the current behavior**

Run:

```bash
cd "/Users/sajanathapa/Desktop/1/loop-engineering/tools/loop-context" && npm test
cd "/Users/sajanathapa/Desktop/1/loop-build" && npm test
```

Expected: controller test fails because `ledger.mjs` is missing; Loop Context injection test fails on the current blanket `do NOT repeat` wording.

- [ ] **Step 3: Harden Loop Context execution and wording**

- Change the section label to `Actions already attempted`.
- Emit `Do not repeat unchanged` only for the trailing repeated failure group.
- Change `spawn(script, [], { shell: true })` to `spawn(script, [], { shell: false })`; `--on-exceed` accepts one executable path and no shell syntax.
- Keep CLI exit codes exactly `0 continue`, `2 escalate`, `1 input/runtime error`.
- Run `npm test` so `dist/**` is rebuilt from source; commit source, tests, and generated dist together in `loop-engineering`.

- [ ] **Step 4: Implement controller ledger persistence**

The stored ledger path is `.loop-context/<lane>/run.json`. `appendAttemptOnce` locks and atomically rewrites the file, uses `attemptId` for idempotency, sanitizes the action/error, and then calls `checkCircuitBreaker`. It never calls `recordDailySpend`.

`resumeContext()` concatenates the full ticket acceptance criteria, base/head, owned paths, current `git diff --stat`, current `git status --short`, and `buildContextInjection()` output.

- [ ] **Step 5: Run tests and commit both repositories separately**

```bash
cd "/Users/sajanathapa/Desktop/1/loop-engineering/tools/loop-context" && npm test
git -C "/Users/sajanathapa/Desktop/1/loop-engineering" add tools/loop-context/src tools/loop-context/test tools/loop-context/dist
git -C "/Users/sajanathapa/Desktop/1/loop-engineering" commit -m "fix(loop-context): make resume guidance and hooks safe"

cd "/Users/sajanathapa/Desktop/1/loop-build" && npm test
git add src/ledger.mjs test/ledger.test.mjs
git commit -m "feat(loop): persist idempotent per-lane ledgers"
```

Expected: both suites PASS.

### Task 7: Create and Resume Worktrees Without Destructive Cleanup

**Files:**
- Create: `/Users/sajanathapa/Desktop/1/loop-build/src/git-worktrees.mjs`
- Create: `/Users/sajanathapa/Desktop/1/loop-build/test/git-worktrees.test.mjs`

**Interfaces:**
- Produces: `inspectManagedWorktree(ticket)`, `createManagedWorktree(ticket, checkpoint)`, `resumeManagedWorktree(ticket)`, and `WorktreeMismatchError`.

- [ ] **Step 1: Write failing preservation tests**

Use a temporary bare origin and working repository. Cover:

1. creating `lane/REL-01` from an explicit checkpoint;
2. resuming a dirty matching worktree without changing status or HEAD;
3. refusing when recorded head differs from actual head;
4. refusing when the requested path or branch already exists;
5. proving no implementation contains `worktree remove --force`, `branch -D`, `reset --hard`, or `clean -f`.

- [ ] **Step 2: Run tests and observe missing-module failures**

Run: `npm test`

Expected: FAIL because `git-worktrees.mjs` is missing.

- [ ] **Step 3: Implement exact safe-create rules**

Before `git worktree add -b <branch> <path> <checkpoint>`, assert:

- the path does not exist;
- `refs/heads/<branch>` does not exist;
- checkpoint resolves to a commit;
- origin/main recorded in the ticket equals the coordinator checkpoint;
- no active lock conflicts.

Resume only when worktree path, branch, base commit, and current HEAD match backlog state. Dirty files are valid resumable state and must be reported, not rejected or cleaned.

- [ ] **Step 4: Test and commit**

```bash
npm test
git add src/git-worktrees.mjs test/git-worktrees.test.mjs
git commit -m "feat(loop): preserve and resume managed worktrees safely"
```

### Task 8: Orchestrate Selection, Transitions, Verification, and Handoffs

**Files:**
- Create: `/Users/sajanathapa/Desktop/1/loop-build/src/controller.mjs`
- Modify: `/Users/sajanathapa/Desktop/1/loop-build/src/cli.mjs`
- Create: `/Users/sajanathapa/Desktop/1/loop-build/test/controller.test.mjs`
- Modify: `/Users/sajanathapa/Desktop/1/loop-build/budget.yaml`

**Interfaces:**
- Produces CLI commands `inventory`, `validate`, `summary`, `reconcile`, `next`, `resume`, `record`, `release`, `render`, and `dry-run`.
- Produces `transition(ticketId, from, to, evidence)` with compare-and-swap semantics.

- [ ] **Step 1: Write failing controller state-machine tests**

Cover these exact transitions:

```text
todo -> ready
ready -> in-progress
in-progress -> blocked | review
blocked -> ready (requires blocker resolution evidence)
review -> integrated
integrated -> released
```

Reject every other transition, reject a stale `from` value, and assert a circuit-breaker escalation preserves worktree/branch, releases the lane lock, sets `blocked`, and writes a sanitized handoff.

- [ ] **Step 2: Run tests and observe missing-controller failures**

Run: `npm test`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Make `budget.yaml` executable configuration**

Keep these exact limits and remove their hard-coded twins from shell:

```yaml
session:
  wall_clock_minutes: 260
  max_tickets: 4
  min_minutes_to_start_ticket: 35
week:
  max_sessions: 5
  max_tickets: 16
per_ticket:
  max_attempts: 10
  stagnation_threshold: 3
  no_progress_threshold: 5
  similarity_threshold: 0.85
  context_window: 5
  max_trace_lines: 8
  verify_cmd:
    - pnpm lint
    - pnpm typecheck
    - pnpm test
    - pnpm build
```

The CLI parses YAML once, validates positive integer/float fields, and passes the values into controller and ledger functions.

- [ ] **Step 4: Implement resume-first selection and evidence records**

`next` returns an intact active ticket before choosing a new ready ticket. It sorts new work by program wave, critical/high/medium/low priority, then ID. `record` accepts a unique attempt ID, outcome, action, error-file path, token count, and repeated `--verification` arguments. It never stores raw environment output.

Handoffs include goal, acceptance criteria, base/head, owned paths, status/diff, tried actions, short sanitized error signatures, verification commands/results, breaker reason, and the smallest human decision.

- [ ] **Step 5: Test a no-agent dry run and commit**

```bash
npm test
npm run controller -- dry-run --max-lanes 3
git status --short
git add budget.yaml src/controller.mjs src/cli.mjs test/controller.test.mjs
git commit -m "feat(loop): orchestrate resumable remediation lanes"
```

Expected: PASS; dry-run selects/resumes tickets and prints intended worktree/lock operations without creating branches, worktrees, PRs, or state changes.

### Task 9: Recover the Video Audit Into Durable, Reproducible Evidence

**Files:**
- Create: `/Users/sajanathapa/Desktop/1/My Qa Projecct/Video Audit/extract.py`
- Create: `/Users/sajanathapa/Desktop/1/My Qa Projecct/Video Audit/fetch.py`
- Create: `/Users/sajanathapa/Desktop/1/My Qa Projecct/Video Audit/slow_refetch.py`
- Create: `/Users/sajanathapa/Desktop/1/My Qa Projecct/Video Audit/analyze.py`
- Create: `/Users/sajanathapa/Desktop/1/My Qa Projecct/Video Audit/README.md`
- Create: `/Users/sajanathapa/Desktop/1/My Qa Projecct/Video Audit/test_analyze.py`
- Generate: `/Users/sajanathapa/Desktop/1/My Qa Projecct/Video Audit/video_meta.json`
- Generate: `/Users/sajanathapa/Desktop/1/My Qa Projecct/Video Audit/report-data.json`
- Modify: `/Users/sajanathapa/Desktop/1/My Qa Projecct/Video-Audit-Action-Items.md`

**Interfaces:**
- `extract.py` outputs `{ videoId: { urls[], notes[] } }`.
- `fetch.py` records oEmbed status/title/author and page-derived duration/caption languages with `degraded_fetch` explicitly distinguished from zero captions.
- `slow_refetch.py` processes only non-404 records missing duration/caption evidence, checkpoints every 25 successes, sleeps 2.5 seconds after success and 5 seconds after a degraded response.
- `analyze.py` writes `report-data.json` with `totalLinks`, `uniqueVideos`, `validVideos`, `brokenVideos`, `pendingVideos`, `nonEnglishAudio`, `zeroCaptions`, `shortClips`, `shorts`, and affected note paths.

- [ ] **Step 1: Recover exact source from Claude history, not memory**

Extract the `Write` payloads for `extract.py`, `fetch.py`, `slow_refetch.py`, and `analyze.py` from:

```text
/Users/sajanathapa/.claude/projects/-Users-sajanathapa-Desktop-1/c3a31660-c961-4fb7-be85-563a4cf9a24e.jsonl
```

The `slow_refetch.py` payload begins `import json, re, subprocess, sys, time` and selects rows where `length_seconds is None and not oembed_error`. Preserve that algorithm, then change only relative paths so the durable `Video Audit` directory is self-contained.

- [ ] **Step 2: Write failing analysis tests**

Use fixture records for a real zero-caption page (`caption_langs: []`, `degraded_fetch: false`), a degraded fetch, Romanian captions, a 5-second clip, and an oEmbed 404. Assert degraded fetches increment `pendingVideos` but never `zeroCaptions`.

Run: `cd "/Users/sajanathapa/Desktop/1/My Qa Projecct/Video Audit" && python3 -m unittest -v`

Expected: FAIL until `analyze.py` exists and distinguishes degraded from confirmed-empty captions.

- [ ] **Step 3: Restore tooling and run the offline tests**

Run: `python3 -m unittest -v`

Expected: PASS.

- [ ] **Step 4: Rebuild the evidence set with paced network access**

Run:

```bash
cd "/Users/sajanathapa/Desktop/1/My Qa Projecct/Video Audit"
python3 extract.py
python3 fetch.py
python3 slow_refetch.py 2>slow_refetch.log
python3 analyze.py
```

Expected: all 750 unique videos have either reliable oEmbed/page evidence or an explicit pending/degraded reason. Do not claim `pendingVideos: 0` unless `report-data.json` proves it.

- [ ] **Step 5: Reconcile the report mechanically**

Replace “Still pending — 439 entries” with the exact `pendingVideos` count from `report-data.json`; update non-English, zero-caption, short-clip, broken, and total counts from the same file. Add:

```markdown
## Reproducibility

Durable evidence and scripts: `Video Audit/`. `report-data.json` is the source
for every count in this document. A degraded/rate-limited page fetch is reported
as pending and is never treated as proof that captions are absent.
```

- [ ] **Step 6: Validate report/evidence consistency**

Run:

```bash
python3 -m unittest -v
python3 analyze.py --check-report ../Video-Audit-Action-Items.md
```

Expected: PASS; every report count equals `report-data.json`. This vault is not the QA Mastery Git repository, so record the checksum and command results in `loop-build/recovery/handoffs/CTRL-06.md` rather than committing or pushing without separate vault-source-control approval.

### Task 10: Enable the New Driver Only After an End-to-End Safety Drill

**Files:**
- Modify: `/Users/sajanathapa/Desktop/1/loop-build/run-session.sh`
- Modify: `/Users/sajanathapa/Desktop/1/loop-build/README.md`
- Modify: `/Users/sajanathapa/Desktop/1/loop-build/SETUP.md`
- Modify: `/Users/sajanathapa/Desktop/1/loop-build/test/legacy-driver-disabled.test.mjs`
- Create: `/Users/sajanathapa/Desktop/1/loop-build/test/safety-drill.test.mjs`

**Interfaces:**
- `run-session.sh` becomes only a path-stable wrapper for `node src/cli.mjs run`.

- [ ] **Step 1: Write a failing safety drill**

The test creates two ready tickets with overlapping globs and one interrupted dirty worktree. Assert the controller:

- resumes the interrupted worktree;
- starts no overlapping second lane;
- appends one ledger attempt;
- preserves dirty/untracked files;
- writes both state views;
- performs no push, PR, merge, cleanup, or deployment command.

- [ ] **Step 2: Run the complete controller and Loop Context suites**

```bash
cd "/Users/sajanathapa/Desktop/1/loop-engineering/tools/loop-context" && npm test
cd "/Users/sajanathapa/Desktop/1/loop-build" && npm test
```

Expected: safety drill FAIL until the wrapper expectation is updated and the controller run command is wired.

- [ ] **Step 3: Replace the temporary guard with the final wrapper**

```bash
#!/usr/bin/env bash
set -euo pipefail
LOOP_BUILD_DIR="$(cd "$(dirname "$0")" && pwd)"
exec node "$LOOP_BUILD_DIR/src/cli.mjs" run "$@"
```

The test-mode safety drill calls `node src/cli.mjs dry-run`; it never invokes the live wrapper.

- [ ] **Step 4: Document the real commands and remove stale claims**

README/SETUP must say 41 historical tickets plus audit-derived requirements, describe resume-first behavior, list the seven statuses, explain per-lane ledgers and path locks, and remove claims that `run-session.sh` force-recreates throwaway worktrees or reads hard-coded budget constants.

- [ ] **Step 5: Verify real state without starting an agent**

```bash
npm test
npm run controller -- validate
npm run controller -- inventory --out recovery/snapshots/2026-07-26-post-controller.json
npm run controller -- dry-run --max-lanes 3
npm run controller -- render
git diff --check
```

Expected: all PASS; the dry run reports planned work only; protected dirty worktrees are unchanged.

- [ ] **Step 6: Commit the enabled controller**

```bash
git add run-session.sh README.md SETUP.md test/legacy-driver-disabled.test.mjs test/safety-drill.test.mjs
git commit -m "feat(loop): enable safe resumable controller"
```

## Wave 0 Completion Gate

- [ ] Existing dirty worktrees and untracked files match their pre-controller inventory.
- [ ] Backlog validates and no legacy status remains.
- [ ] P2-1 has an explicit recovery state rather than being skipped.
- [ ] Three test lanes cannot acquire overlapping path locks.
- [ ] Repeated ledger checks are idempotent.
- [ ] Stagnation/no-progress escalation preserves the worktree and emits a sanitized handoff.
- [ ] `run-session.sh` contains no force removal, branch deletion, hard reset, clean, push, merge, or deploy operation.
- [ ] Video report counts are generated from durable evidence; no vanished temporary result is treated as proof.
- [ ] Both controller and Loop Context test suites pass from clean installs.
- [ ] No controller repository or QA Mastery branch has been pushed without explicit approval.
