# Redis and Caching Bugs Chapter Design

**Date:** 2026-07-18
**Status:** Approved batch; awaiting written-spec review
**Owner:** Codex
**Module:** `nosql-and-modern-data`
**Chapter:** `redis-and-caching-bugs`

## Goal

Create four self-contained QA teaching notes that explain why caches improve read performance and how expiration, eviction, invalidation, and failure paths create defects. The chapter must teach observable behavior and test design, not Redis administration in isolation.

## Collision boundary

Allowed paths:

- `packages/curriculum/content/notes/nosql-and-modern-data/redis-and-caching-bugs/**`
- `apps/platform/public/notes/nosql-and-modern-data/redis-and-caching-bugs/**` for verification only; four images already exist
- Four `planned: true` leaves in the matching taxonomy chapter, updated only after all notes pass their local gates
- `../Claude Coordination.md` for an append-only completion entry

Forbidden paths:

- `non-functional-testing-intro/**`, owned by Claude1
- Track E/F/G scaffolding, reserved for Claude2 coordination
- `distributed-data-gently/**`, deferred to the next batch
- Unrelated dirty or untracked files, including `demo.txt`, `task.md`, and `implementation_plan.md`

## Note designs

### 1. What caching solves

- Core model: cache as a fast, temporary copy in front of a slower source of truth.
- Test focus: hit, miss, fill, fallback, latency, source failure, and correctness after refresh.
- Image metaphor: pantry shelves keep frequently needed items nearby; pantry stock is convenient, not authoritative.
- Playground: deterministic cache-aside simulation with hit/miss counters and source-read counts.

### 2. TTLs and eviction

- Core model: TTL expiration removes a key because time elapsed; eviction removes a key because a memory policy needs space. These are different causes with overlapping symptoms.
- Test focus: TTL boundaries, missing expiry, renewal, `TTL` sentinel values, memory pressure, `maxmemory-policy`, and hit-ratio impact.
- Image metaphor: winged hourglass separates time-driven expiry from capacity-driven removal.
- Playground: fake clock plus bounded cache; no real waiting or Redis server required.

### 3. Stale-data bugs and cache invalidation

- Core model: cached data becomes stale when the source changes without a correct refresh, update, delete, version, or invalidation path.
- Test focus: cache-aside race windows, failed invalidation, reordered events, reconnect behavior, delete/rename paths, and bounded staleness.
- Image metaphor: mouldy bread still occupies the expected place but is no longer safe to serve.
- Playground: source update plus missed invalidation that reproduces a stale read, followed by a corrected path.

### 4. Testing around a cache

- Core model: test both cached and uncached paths, then test the transition and degraded states between them.
- Test focus: cold/warm reads, cache outage, timeout, malformed value, stampede, observability, isolation, and cleanup.
- Image metaphor: road closure forces a fallback route; a resilient application must remain correct when the fast path is blocked.
- Playground: scenario matrix asserting source calls, returned values, fallback behavior, and metrics.

## Shared content contract

Each note will follow the existing 21-section mentor anatomy used by the committed MongoDB notes:

1. Frontmatter with summary, tags, date, and mutual `related:` links
2. Hook
3. Analogy callout
4. Exact term definition
5. Main explanation with tester-focused risks
6. Tip and mistake callouts
7. Hotspot image with accurate pins, alt text, credit, and source URL
8. Flow animation
9. Runnable Python playground
10. Runnable Java playground
11. First-time mission and checklist
12. Failure symptoms and fixes
13. Places to inspect
14. Worked example
15. Quiz
16. Flashcards
17. Challenge
18. Community prompt
19. Primary resources
20. Verified embeddable video with real duration
21. Takeaways and completion XP

Technical claims will use current Redis primary documentation. Required anchors include `TTL` return semantics, `EXPIRE`, `maxmemory`, eviction policies, `INFO` cache metrics, and invalidation behavior. Wording will distinguish Redis Open Source behavior from Redis Cloud-specific defaults.

## Verification

Before taxonomy changes:

- Re-read `../Claude Coordination.md` and `git status` for collision changes.
- Inspect and provenance-check all four existing images; replace only if licensing cannot be verified.
- Execute Python examples locally.
- Compile and run Java examples locally.
- Verify resource URLs and video embed metadata.
- Scan new MDX for placeholders, conflict markers, unsafe bare `<`, broken JSX quoting, and non-ASCII Java output.
- Run the full MDX compile checker, component checker, and image checker.

After local gates pass:

- Remove `planned: true` only from the four Redis taxonomy leaves using an isolated patch.
- Inspect the staged taxonomy hunk before any commit.
- Run curriculum tests, sync validation, and typecheck.
- Commit only the four notes, verified images if changed, and the isolated taxonomy hunk.

## Completion criteria

- Four notes render and compile.
- Eight playgrounds execute successfully and demonstrate their stated behavior.
- All images and external resources have verified provenance.
- Four Redis taxonomy leaves are live; `distributed-data-gently` remains planned.
- No Claude1, Claude2, generated-vault, or unrelated working-tree files are staged or changed.
