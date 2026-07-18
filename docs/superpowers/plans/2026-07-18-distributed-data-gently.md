# Distributed Data Gently Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish four rich, verified lessons that teach replication, sharding, eventual consistency, recovery testing, and data-pipeline testing without colliding with active Claude lanes.

**Architecture:** Two writer agents work concurrently on exact, non-overlapping lesson and media paths inside the existing `codex/redis-caching-bugs` worktree. Writers do not use Git or edit taxonomy; root reviews both handoffs, owns the single taxonomy hunk and commit, and records the coordination handoff only after all gates pass.

**Tech Stack:** MDX, repository note components, Python 3, Java 21+, Wikimedia Commons media, primary vendor documentation, Vitest, TypeScript, pnpm, Turborepo.

## Global Constraints

- Work only in `/Users/sajanathapa/Desktop/1/My Qa Projecct/qa-mastery/.worktrees/redis-caching-bugs` on branch `codex/redis-caching-bugs`.
- Writer A owns only `replication-and-sharding` and `eventual-consistency-bugs` MDX/media paths.
- Writer B owns only `backups-and-recovery-checks` and `testing-data-pipelines` MDX/media paths.
- Writers must not run Git commands or edit `packages/curriculum/src/notes/taxonomy.ts`.
- Root alone owns coordination checks, taxonomy activation, staging, verification, and commits.
- Every lesson uses the locked 21-part rich-note anatomy listed in the approved spec.
- Every lesson contains one distinct verified image, one `<HotspotImage>`, one `<FlowAnimation>`, deterministic Python and Java `<CodePlayground>` examples, primary resources, an embeddable verified video, and `<Complete xp={10} />`.
- Images must be at least 640 pixels wide and at least 240 pixels on each side, visually inspected before pin placement, and carry exact credit, license, source URL, alt text, and meaningful hotspots.
- Programs must be extracted from final MDX template literals and executed; Python and Java versions must produce matching semantic output.
- Examples are in-memory simulations and require no database server, cloud credentials, or network access.
- Remove `planned: true` only from the four `distributed-data-gently` leaves after all content-local gates pass.
- Do not edit `non-functional-testing-intro`, `automation-foundations`, `selenium-webdriver`, Docker material, generated vault output, `demo.txt`, `task.md`, or `implementation_plan.md`.

---

## File Map

Writer A creates:

- `packages/curriculum/content/notes/nosql-and-modern-data/distributed-data-gently/replication-and-sharding.mdx`
- `packages/curriculum/content/notes/nosql-and-modern-data/distributed-data-gently/eventual-consistency-bugs.mdx`
- `apps/platform/public/notes/nosql-and-modern-data/distributed-data-gently/replication-and-sharding.jpg`
- `apps/platform/public/notes/nosql-and-modern-data/distributed-data-gently/eventual-consistency-bugs.jpg`

Writer B creates:

- `packages/curriculum/content/notes/nosql-and-modern-data/distributed-data-gently/backups-and-recovery-checks.mdx`
- `packages/curriculum/content/notes/nosql-and-modern-data/distributed-data-gently/testing-data-pipelines.mdx`
- `apps/platform/public/notes/nosql-and-modern-data/distributed-data-gently/backups-and-recovery-checks.jpg`
- `apps/platform/public/notes/nosql-and-modern-data/distributed-data-gently/testing-data-pipelines.jpg`

Root modifies:

- `packages/curriculum/src/notes/taxonomy.ts`
- `/Users/sajanathapa/Desktop/1/My Qa Projecct/Claude Coordination.md` as append-only external handoff; never stage it in the repository commit.

## Task 1: Preflight and Parallel Ownership

**Files:**
- Read: `/Users/sajanathapa/Desktop/1/My Qa Projecct/Claude Coordination.md`
- Read: `packages/curriculum/src/notes/taxonomy.ts:1685`
- Read: `docs/superpowers/specs/2026-07-18-distributed-data-gently-design.md`

**Interfaces:**
- Consumes: approved design, live coordination claims, clean isolated branch.
- Produces: proven path ownership for Writer A, Writer B, reviewer, and root.

- [ ] **Step 1: Confirm branch and clean state**

Run:

```bash
git branch --show-current
git status --short
git log -1 --oneline
```

Expected: branch is `codex/redis-caching-bugs`; status is clean; latest commit includes this plan.

- [ ] **Step 2: Re-read live claims and target taxonomy**

Run:

```bash
tail -n 12 "/Users/sajanathapa/Desktop/1/My Qa Projecct/Claude Coordination.md"
sed -n '1678,1695p' packages/curriculum/src/notes/taxonomy.ts
```

Expected: no competing `distributed-data-gently` claim; four target leaves remain `planned: true`; Redis leaves are active on this isolated branch.

- [ ] **Step 3: Confirm all eight target paths are absent**

Run:

```bash
test ! -e packages/curriculum/content/notes/nosql-and-modern-data/distributed-data-gently
test ! -e apps/platform/public/notes/nosql-and-modern-data/distributed-data-gently
```

Expected: both commands exit 0.

- [ ] **Step 4: Dispatch writers concurrently**

Writer A receives only its four paths, the Global Constraints, and Task 2. Writer B receives only its four paths, the Global Constraints, and Task 3. Neither receives permission to edit taxonomy, coordination, or Git state.

## Task 2: Writer A — Distribution and Consistency

**Files:**
- Create: `packages/curriculum/content/notes/nosql-and-modern-data/distributed-data-gently/replication-and-sharding.mdx`
- Create: `packages/curriculum/content/notes/nosql-and-modern-data/distributed-data-gently/eventual-consistency-bugs.mdx`
- Create: `apps/platform/public/notes/nosql-and-modern-data/distributed-data-gently/replication-and-sharding.jpg`
- Create: `apps/platform/public/notes/nosql-and-modern-data/distributed-data-gently/eventual-consistency-bugs.jpg`

**Interfaces:**
- Consumes: locked anatomy from the approved spec; adjacent `cap-theorem-in-plain-words.mdx` and completed Redis notes as style references.
- Produces: two self-contained MDX lessons, two verified images, four executed playgrounds, and a concise evidence report.

- [ ] **Step 1: Research primary sources and licensed media**

Use current official database documentation for replication, partitioning/sharding, replica lag, consistency, and read-after-write behavior. Record each final URL, claim supported, image creator, license, source page, dimensions, and visible pin landmarks in the report. Verify video title, channel, duration, and embeddable status.

- [ ] **Step 2: Build `replication-and-sharding.mdx`**

Use a warehouse-copying versus aisle-partitioning analogy. Explain that replication copies the same data while sharding partitions different keys; cover routing, failover, replica lag, rebalancing, hot shards, and checks that distinguish copy health from distribution health.

Python and Java examples must:

```text
route customer keys deterministically across three shards
count records per shard
simulate one lagging replica
print routing, distribution, and lag assertions
exit 0 only when the tester detects both imbalance/placement and replica freshness state
```

Relate to `cap-theorem-in-plain-words` and `eventual-consistency-bugs`.

- [ ] **Step 3: Build `eventual-consistency-bugs.mdx`**

Use branch-office noticeboards or delivery tracking as the analogy. Explain convergence windows, stale reads, monotonic reads, read-your-writes/session guarantees, conflict handling, and polling with a bounded deadline.

Python and Java examples must:

```text
write version 2 to the source
read stale version 1 from a replica
surface the stale-read assertion
advance replication deterministically
read converged version 2
print the same semantic result in both languages
```

Relate to `cap-theorem-in-plain-words` and `replication-and-sharding`.

- [ ] **Step 4: Execute final playground literals**

Extract the four code strings from final MDX, run both Python programs with `python3`, compile/run both Java programs with `javac` and `java`, and save exact commands plus outputs in the report. Expected: all programs exit 0 and paired outputs agree semantically.

- [ ] **Step 5: Run writer-local gates**

Run:

```bash
node packages/curriculum/scripts/check-note-mdx-compile.mjs
(cd packages/curriculum && python3 scripts/check-note-components.py)
(cd packages/curriculum && python3 scripts/check-note-images.py)
rg -n 'PLACEHOLDER|TODO|<<<<<<<|=======|>>>>>>>' packages/curriculum/content/notes/nosql-and-modern-data/distributed-data-gently
```

Expected: compile succeeds; component and image checks succeed; scan prints nothing. Report changed paths and evidence. Do not commit.

## Task 3: Writer B — Recovery and Pipelines

**Files:**
- Create: `packages/curriculum/content/notes/nosql-and-modern-data/distributed-data-gently/backups-and-recovery-checks.mdx`
- Create: `packages/curriculum/content/notes/nosql-and-modern-data/distributed-data-gently/testing-data-pipelines.mdx`
- Create: `apps/platform/public/notes/nosql-and-modern-data/distributed-data-gently/backups-and-recovery-checks.jpg`
- Create: `apps/platform/public/notes/nosql-and-modern-data/distributed-data-gently/testing-data-pipelines.jpg`

**Interfaces:**
- Consumes: locked anatomy from the approved spec; completed chapter notes as style references.
- Produces: two self-contained MDX lessons, two verified images, four executed playgrounds, and a concise evidence report.

- [ ] **Step 1: Research primary sources and licensed media**

Use current official documentation for backup/restore validation, recovery point objective, recovery time objective, integrity verification, pipeline delivery semantics, schema evolution, duplicate handling, and reconciliation. Record the same source/media/video evidence required by Task 2.

- [ ] **Step 2: Build `backups-and-recovery-checks.mdx`**

Use an emergency-kit rehearsal or spare-key analogy. Distinguish backup completion from usable restoration; cover recovery point objective, recovery time objective, encryption keys, permissions, corrupt archives, point-in-time recovery, isolated restore drills, and post-restore business checks.

Python and Java examples must:

```text
represent a backup manifest with timestamp, checksum, and required records
show one present but corrupt backup failing restore validation
select a valid backup
calculate recovery point and recovery time results against explicit limits
print matching PASS/FAIL evidence in both languages
```

- [ ] **Step 3: Build `testing-data-pipelines.mdx`**

Use a parcel-sorting line or kitchen pass analogy. Explain source-to-stage contracts, duplicates, ordering, retries, poison records, schema drift, idempotency, dead-letter handling, freshness, lineage, and end-to-end reconciliation.

Python and Java examples must:

```text
process deterministic input records across ingest, transform, and load stages
include one duplicate and one schema-invalid record
deduplicate safely, quarantine the invalid record, and reconcile counts/totals
print stage counts and final assertions
produce matching semantic output in both languages
```

- [ ] **Step 4: Execute final playground literals**

Extract and execute the four programs exactly as in Task 2. Expected: all exit 0 and paired outputs agree semantically.

- [ ] **Step 5: Run writer-local gates**

Run the same four gate commands from Task 2. Expected: success and an empty landmine scan. Report changed paths and evidence. Do not commit.

## Task 4: Read-Only Chapter Review and Corrections

**Files:**
- Review: all four new MDX files and four new media files
- Read: `docs/superpowers/specs/2026-07-18-distributed-data-gently-design.md`

**Interfaces:**
- Consumes: Writer A and Writer B outputs plus their evidence reports.
- Produces: spec-compliance verdict, quality verdict, and path/line findings; writers correct findings only within their ownership.

- [ ] **Step 1: Review spec compliance**

Confirm every lesson has all 21 required sections, distinct teaching angle, correct cross-links, exact `<Complete xp={10} />`, one `<Term define="...">`, one flow, two runnable playgrounds, primary resources, verified video evidence, and complete image metadata.

- [ ] **Step 2: Review technical and teaching quality**

Check examples reproduce the named failure before demonstrating correction; Python and Java teach the same behavior; no lesson confuses replication with sharding, convergence with strong consistency, backup presence with restorability, or stage success with end-to-end reconciliation.

- [ ] **Step 3: Review media and source evidence**

Confirm image dimensions/licenses/credits/source pages, visible hotspot coordinates, resource relevance, and video title/channel/duration/embed evidence from writer reports.

- [ ] **Step 4: Correct important findings**

Send Writer A findings only for Writer A paths and Writer B findings only for Writer B paths. Each writer reruns the commands covering corrected files and appends results to its report. Repeat read-only review until both spec compliance and quality are approved.

## Task 5: Root Integration, Taxonomy, and Commit

**Files:**
- Modify: `packages/curriculum/src/notes/taxonomy.ts:1688`
- Stage: four new MDX files, four new JPG files, and taxonomy only
- Append after commit: `/Users/sajanathapa/Desktop/1/My Qa Projecct/Claude Coordination.md`

**Interfaces:**
- Consumes: approved reviewer verdicts and writer evidence.
- Produces: active four-note chapter, verified branch commit, and collision-safe coordination handoff.

- [ ] **Step 1: Audit writer scope**

Run:

```bash
git status --short
git diff -- packages/curriculum/src/notes/taxonomy.ts
```

Expected before root integration: exactly eight untracked content/media paths; no taxonomy diff from writers.

- [ ] **Step 2: Run pre-taxonomy content gates**

Run:

```bash
node packages/curriculum/scripts/check-note-mdx-compile.mjs
(cd packages/curriculum && python3 scripts/check-note-components.py)
(cd packages/curriculum && python3 scripts/check-note-images.py)
rg -n 'PLACEHOLDER|TODO|<<<<<<<|=======|>>>>>>>' packages/curriculum/content/notes/nosql-and-modern-data/distributed-data-gently
```

Expected: 666 notes compile; checkers pass; scan prints nothing.

- [ ] **Step 3: Activate only four taxonomy leaves**

Change:

```ts
{ slug: "replication-and-sharding", title: "Replication & sharding", planned: true },
{ slug: "eventual-consistency-bugs", title: "Eventual-consistency bugs", planned: true },
{ slug: "backups-and-recovery-checks", title: "Backups & recovery checks", planned: true },
{ slug: "testing-data-pipelines", title: "Testing data pipelines", planned: true },
```

to:

```ts
{ slug: "replication-and-sharding", title: "Replication & sharding" },
{ slug: "eventual-consistency-bugs", title: "Eventual-consistency bugs" },
{ slug: "backups-and-recovery-checks", title: "Backups & recovery checks" },
{ slug: "testing-data-pipelines", title: "Testing data pipelines" },
```

- [ ] **Step 4: Run full verification**

Run:

```bash
node packages/curriculum/scripts/check-note-mdx-compile.mjs
(cd packages/curriculum && python3 scripts/check-note-components.py)
(cd packages/curriculum && python3 scripts/check-note-images.py)
pnpm --filter @qa-mastery/curriculum test
pnpm --filter @qa-mastery/curriculum sync
pnpm typecheck
git diff --check
git diff -- packages/curriculum/src/notes/taxonomy.ts
```

Expected: 666/666 compile; curriculum tests 9/9; sync validation passes without `--apply`; typecheck 12/12; image/component checks pass; whitespace check passes; taxonomy diff contains only four `planned` removals.

- [ ] **Step 5: Stage explicit paths and inspect**

Run:

```bash
git add \
  packages/curriculum/content/notes/nosql-and-modern-data/distributed-data-gently/replication-and-sharding.mdx \
  packages/curriculum/content/notes/nosql-and-modern-data/distributed-data-gently/eventual-consistency-bugs.mdx \
  packages/curriculum/content/notes/nosql-and-modern-data/distributed-data-gently/backups-and-recovery-checks.mdx \
  packages/curriculum/content/notes/nosql-and-modern-data/distributed-data-gently/testing-data-pipelines.mdx \
  apps/platform/public/notes/nosql-and-modern-data/distributed-data-gently/replication-and-sharding.jpg \
  apps/platform/public/notes/nosql-and-modern-data/distributed-data-gently/eventual-consistency-bugs.jpg \
  apps/platform/public/notes/nosql-and-modern-data/distributed-data-gently/backups-and-recovery-checks.jpg \
  apps/platform/public/notes/nosql-and-modern-data/distributed-data-gently/testing-data-pipelines.jpg \
  packages/curriculum/src/notes/taxonomy.ts
git diff --cached --name-only
git diff --cached --stat
git diff --cached --check
```

Expected: exactly nine staged files: four MDX, four JPG, and taxonomy.

- [ ] **Step 6: Commit chapter**

Run:

```bash
git commit -m "feat(curriculum): add distributed data chapter"
```

Expected: commit succeeds; `git status --short` is empty.

- [ ] **Step 7: Append coordination handoff**

Append one entry containing chapter completion 4/4, commit ID, branch/worktree, executed playground count, image/source verification, final gate counts, taxonomy scope, untouched Claude lanes, and `no push or merge`. Do not stage or commit the external coordination file.
