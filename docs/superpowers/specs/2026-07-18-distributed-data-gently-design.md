# Distributed Data Gently Notes Design

**Date:** 2026-07-18
**Status:** Approved
**Module:** `nosql-and-modern-data`
**Chapter:** `distributed-data-gently`

## Goal

Finish the four planned leaves in `distributed-data-gently` without touching Claude1, Claude2, codex-2, or the dirty shared checkout. Each lesson must teach a distinct distributed-data failure mode through an accessible analogy, verified media, deterministic Python and Java examples, and the repository's locked rich-note anatomy.

## Scope

Create exactly these lessons and matching media:

1. `replication-and-sharding`
2. `eventual-consistency-bugs`
3. `backups-and-recovery-checks`
4. `testing-data-pipelines`

After all four lessons pass their local gates, remove `planned: true` from only these four taxonomy leaves. Preserve the completed Redis chapter and all other taxonomy state.

## Isolation and Ownership

Work continues only in the clean worktree:

`/Users/sajanathapa/Desktop/1/My Qa Projecct/qa-mastery/.worktrees/redis-caching-bugs`

Branch: `codex/redis-caching-bugs`

Two writer agents operate concurrently but never run Git commands or edit the taxonomy:

- Writer A owns `replication-and-sharding.mdx`, `eventual-consistency-bugs.mdx`, and their two media files.
- Writer B owns `backups-and-recovery-checks.mdx`, `testing-data-pipelines.mdx`, and their two media files.
- Root owns coordination checks, taxonomy activation, staging, verification, and commits.
- Reviewer is read-only and audits all four lessons after writers finish.

No agent may edit `non-functional-testing-intro`, `automation-foundations`, `selenium-webdriver`, Docker material, generated vault output, or coordination entries belonging to another lane.

## Lesson Design

Each lesson follows the existing 21-part rich-note contract:

1. Frontmatter with title, concise summary, tags including `track-d`, date, and related links
2. Hook
3. Analogy callout
4. One defined `<Term>`
5. Core explanation
6. Tip and common mistake
7. One verified `<HotspotImage>`
8. One `<FlowAnimation>`
9. Deterministic Python `<CodePlayground>`
10. Equivalent deterministic Java `<CodePlayground>`
11. `<FirstTime>` and `<StepChecklist>`
12. `<WhenItBreaks>`
13. `<WhereToCheck>`
14. Worked example
15. Quiz
16. Flashcards
17. Challenge
18. `<AskCommunity>`
19. Primary resources
20. Verified embeddable video
21. Takeaways and `<Complete xp={10} />`

The four teaching angles remain separate:

- Replication and sharding: copying versus partitioning, routing, replica lag, and hotspot risk.
- Eventual consistency: temporary disagreement, read-after-write surprises, session guarantees, and convergence checks.
- Backups and recovery: backup existence versus restore proof, recovery point objective, recovery time objective, and corruption discovery.
- Data pipelines: stage-by-stage transformations, duplicates, ordering, schema drift, poison records, and reconciliation.

`replication-and-sharding` and `eventual-consistency-bugs` retain related links with `cap-theorem-in-plain-words`; all four new lessons cross-link only where the relationship is useful.

## Research and Media

Technical claims must use current primary documentation where available. Every external resource URL must resolve. Every video must have a verified title, channel, duration, and embeddable status.

Each lesson gets one distinct, provenance-verified image from Wikimedia Commons or another clearly licensed primary source. Images must be at least 640 pixels wide and at least 240 pixels on each side, visually inspected before pin placement, and include accurate alt text, credit, license, source URL, and meaningful hotspots.

## Runnable Examples

Each Python/Java pair models the same scenario and produces matching semantic output. Programs must be extracted from final MDX template literals and executed, preventing escaping differences from hiding failures.

Required behaviors:

- Replication/sharding: route keys to shards and expose a lagging replica or uneven distribution.
- Eventual consistency: reproduce a stale read, then demonstrate convergence or a session-safe correction.
- Backups/recovery: show why a present backup can still fail restoration and verify recovery objectives.
- Pipelines: detect a duplicate, ordering issue, schema mismatch, or reconciliation gap across stages.

Examples use in-memory simulations only. They must not require Redis, a database server, cloud credentials, or network access.

## Integration Flow

1. Re-read the coordination tail and worktree status.
2. Dispatch Writer A and Writer B concurrently with exact, non-overlapping paths.
3. Root inspects both handoffs and confirms no out-of-scope changes.
4. A read-only reviewer checks structure, teaching separation, resource evidence, media metadata, and playground parity.
5. Writers correct any important findings within their assigned paths.
6. Root runs all content gates before changing taxonomy.
7. Root removes only the four `planned: true` flags.
8. Root reruns full curriculum and repository gates.
9. Root stages explicit paths, commits once, and appends a completion handoff to the coordination log.

## Failure Handling

- If another lane claims or edits these paths, stop writers and resolve ownership before continuing.
- If a source or video cannot be verified, replace it; do not retain an unverified citation.
- If image provenance or license is unclear, replace the image before writing hotspots.
- If a playground pair diverges, fix the examples before taxonomy activation.
- If a global gate fails because of another live lane, record the exact external path and still prove all chapter-local gates; do not modify that lane.
- If either writer changes taxonomy or uses Git, root discards only that out-of-scope change after inspecting it and preserves the authored lesson files.

## Verification Gates

Before taxonomy activation:

- All four MDX files compile.
- Component contract checker passes.
- Image existence and dimensions checker passes.
- Placeholder, conflict-marker, escaped-attribute, bare-angle-bracket, and prose-curly scans are clean.
- All eight playgrounds execute from final MDX and Python/Java outputs agree semantically.
- Four images are viewed and provenance checked.
- Resource links and videos are verified.

After taxonomy activation:

- Full MDX compile count increases from 662 to 666.
- Curriculum tests pass 9/9.
- Curriculum sync validation passes without applying generated output.
- Repository typecheck passes 12/12.
- `git diff --check` passes.
- Staged changes contain exactly four MDX files, four media files, and the isolated four-leaf taxonomy hunk.

## Success Criteria

The chapter is complete when all four lessons satisfy the locked anatomy, all eight final playgrounds execute, all media and sources are verified, taxonomy activates only these four leaves, full gates pass, the isolated branch contains a clean commit, and coordination records that no Claude lane was touched.
