# Redis and Caching Bugs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Publish four verified QA teaching notes covering cache purpose, TTL and eviction, stale-data invalidation defects, and cache-path testing.

**Architecture:** Each topic is one independent MDX lesson using the repository's locked 21-section anatomy. Existing images remain read-only unless provenance fails; taxonomy stays untouched until all four files compile, preventing planned/live drift in the shared hot file.

**Tech Stack:** MDX, repository note components, Python 3, Java 21+, Redis Open Source documentation, curriculum validation scripts.

## Global Constraints

- Create files only under packages/curriculum/content/notes/nosql-and-modern-data/redis-and-caching-bugs/.
- Verify existing chapter images; replace only when Wikimedia provenance or licensing fails.
- Do not touch non-functional-testing-intro, Track E/F/G scaffolding, distributed-data-gently, generated vault mirrors, or unrelated dirty files.
- Use current Redis primary documentation and distinguish Redis Open Source behavior from Redis Cloud defaults.
- Every note needs mutual related links, accurate hotspot pins, two executed playgrounds, verified resources/video, and 10 completion XP.
- Update only four Redis planned leaves after all note gates pass.

---

### Task 1: Preflight and source verification

**Files:**
- Read: ../Claude Coordination.md
- Read: packages/curriculum/content/notes/nosql-and-modern-data/mongodb-hands-on/documents-and-collections.mdx
- Read: packages/curriculum/src/notes/taxonomy.ts near line 1674
- Verify: apps/platform/public/notes/nosql-and-modern-data/redis-and-caching-bugs/*.jpg

**Interfaces:**
- Consumes: coordination claims, locked note anatomy, four topic slugs, four images.
- Produces: ownership check plus image credits, licenses, dimensions, and visible pin landmarks.

- [ ] **Step 1: Recheck ownership and dirt**

    tail -n 120 ../Claude\ Coordination.md
    git status --short

Expected: no competing Redis claim; all unrelated modifications remain unstaged.

- [ ] **Step 2: Verify four images**

Confirm a stable Wikimedia Commons page, author/title, reusable license, descriptive alt text, and at least three visible targets for each:

- what-caching-solves.jpg: pantry shelves and nearby stock
- ttls-and-eviction.jpg: winged hourglass and sand chambers
- stale-data-bugs-and-cache-invalidation.jpg: mould across bread
- testing-around-a-cache.jpg: road sign, barriers, and blocked route

- [ ] **Step 3: Lock primary sources**

Use Redis TTL, EXPIRE, eviction, client-side caching, and INFO documentation. Required claims: TTL sentinel values -1/-2, time expiry versus memory eviction, maxmemory-policy, hit/miss/eviction metrics, invalidation races, and tracking-connection loss.

### Task 2: What caching solves

**Files:**
- Create: packages/curriculum/content/notes/nosql-and-modern-data/redis-and-caching-bugs/what-caching-solves.mdx
- Read: apps/platform/public/notes/nosql-and-modern-data/redis-and-caching-bugs/what-caching-solves.jpg

**Interfaces:**
- Consumes: cache-aside behavior and pantry provenance.
- Produces: introduction linked to three Redis siblings and MongoDB documents-and-collections.

- [ ] **Step 1: Write lesson**

Use title What caching solves, date 2026-07-18, and tags redis, caching, cache-aside, performance, track-d. Teach fast disposable copy, source of truth, hit, miss, fill, fallback, latency, correctness, and source failure.

- [ ] **Step 2: Add interactive anatomy**

Use pantry pins for nearby stock, crowding, labels, and source restock. Flow: request, lookup, hit/miss, source read, fill, response. Add checklist, failures, worked latency example, quiz, flashcards, challenge, community prompt, primary resources, verified video, takeaways, and XP.

- [ ] **Step 3: Add deterministic Python and Java**

Both programs must prove: first product read misses and calls source; second hits; values match; source_reads equals 1; hits equals 1; misses equals 1. No Redis server or network. ASCII-only matching output.

- [ ] **Step 4: Verify note**

Execute extracted programs. Run full MDX compile and scan this file for PLACEHOLDER, TODO, and conflict markers. Expected: both programs exit 0 and no new compile failure.

### Task 3: TTLs and eviction

**Files:**
- Create: packages/curriculum/content/notes/nosql-and-modern-data/redis-and-caching-bugs/ttls-and-eviction.mdx
- Read: apps/platform/public/notes/nosql-and-modern-data/redis-and-caching-bugs/ttls-and-eviction.jpg

**Interfaces:**
- Consumes: TTL, EXPIRE, maxmemory, and policy contracts.
- Produces: time-versus-capacity lesson linked to Redis siblings and cap-theorem-in-plain-words.

- [ ] **Step 1: Write exact model**

Teach time-driven expiration versus pressure-driven eviction. Include TTL nonnegative values, -1 without expiry, -2 when absent. Cover noeviction, allkeys-lru, allkeys-lfu, allkeys-random, and volatile-policy behavior without importing Cloud defaults.

- [ ] **Step 2: Add interactive anatomy**

Use hourglass pins for remaining time, boundary, capacity pressure, and policy. Flow: write, attach expiry, advance time/fill memory, remove, miss, refill. Include boundary checklist, symptoms, session-expiry worked example, quiz, cards, challenge, resources, video, takeaways, XP.

- [ ] **Step 3: Add deterministic Python and Java**

Fake-clock capacity-one cache: session exists at t=9, expires at t=10; inserting A then B evicts A. Assert expiration_count equals 1 and eviction_count equals 1. Never sleep.

- [ ] **Step 4: Verify note**

Execute both programs, run MDX compile, scan landmines. Expected: exit 0 and compile count increases by one.

### Task 4: Stale data and invalidation

**Files:**
- Create: packages/curriculum/content/notes/nosql-and-modern-data/redis-and-caching-bugs/stale-data-bugs-and-cache-invalidation.mdx
- Read: apps/platform/public/notes/nosql-and-modern-data/redis-and-caching-bugs/stale-data-bugs-and-cache-invalidation.jpg

**Interfaces:**
- Consumes: source-of-truth model and Redis invalidation caveats.
- Produces: stale-read lesson linked to Redis siblings and MongoDB CRUD/query operators.

- [ ] **Step 1: Write risk model**

Teach delete/invalidate, update-through, versioned keys, TTL-bounded staleness, lost invalidation, order races, concurrent refill, delete/rename paths, tracking loss, and client-cache flush after disconnect.

- [ ] **Step 2: Add interactive anatomy**

Use bread pins for expected location, stale appearance, unsafe content, and replacement. Flow: fill v1, source v2, lost invalidation, stale v1, clear, refill v2. Add race checklist, price-change example, quiz, cards, challenge, sources, video, takeaways, XP.

- [ ] **Step 3: Add deterministic Python and Java**

Source price 100; cache 100; source changes to 80 without invalidation; second read returns stale 100; invalidate; third read returns 80; assert stale_reads equals 1.

- [ ] **Step 4: Verify note**

Execute both programs, run MDX compile, scan landmines. Expected: programs reproduce stale value before correction and exit 0.

### Task 5: Testing around a cache

**Files:**
- Create: packages/curriculum/content/notes/nosql-and-modern-data/redis-and-caching-bugs/testing-around-a-cache.mdx
- Read: apps/platform/public/notes/nosql-and-modern-data/redis-and-caching-bugs/testing-around-a-cache.jpg

**Interfaces:**
- Consumes: hit/miss, expiry/eviction, and invalidation lessons.
- Produces: synthesis linked to Redis siblings and where-each-shines.

- [ ] **Step 1: Write scenario matrix**

Cover cold/warm reads, timeout/outage, malformed values, source outage, stampede, cleanup, and metrics. State returned result, source/cache call count, latency class, and expected signal.

- [ ] **Step 2: Add interactive anatomy**

Use road pins for fast path, blocked route, barriers, and fallback. Flow: cold, warm, block cache, fallback, metrics, cleanup. Add checklist, checkout example, quiz, cards, challenge, sources, video, takeaways, XP.

- [ ] **Step 3: Add deterministic Python and Java**

Table-driven cases: cold calls source once; warm avoids another call; cache_down falls back and increments metric; malformed_cache rejects, falls back, repairs; source_down_on_miss raises explicit error and never invents data.

- [ ] **Step 4: Verify note**

Execute both programs, run MDX compile, scan landmines. Expected: all five cases pass.

### Task 6: Chapter gate and taxonomy activation

**Files:**
- Modify: packages/curriculum/src/notes/taxonomy.ts near line 1678
- Verify: packages/curriculum/content/notes/nosql-and-modern-data/redis-and-caching-bugs/*.mdx
- Append: ../Claude Coordination.md

**Interfaces:**
- Consumes: four passing notes and unchanged planned leaves.
- Produces: live four-topic chapter plus collision-safe handoff.

- [ ] **Step 1: Run content gates**

    node packages/curriculum/scripts/check-note-mdx-compile.mjs
    python3 packages/curriculum/scripts/check-note-components.py
    python3 packages/curriculum/scripts/check-note-images.py
    rg -n 'PLACEHOLDER|TODO|<<<<<<<|=======|>>>>>>>' packages/curriculum/content/notes/nosql-and-modern-data/redis-and-caching-bugs

Expected: all checkers pass and scan returns no matches.

- [ ] **Step 2: Recheck coordination and taxonomy drift**

    tail -n 120 ../Claude\ Coordination.md
    git diff -- packages/curriculum/src/notes/taxonomy.ts

Expected: no competing Redis claim; every unrelated taxonomy hunk preserved.

- [ ] **Step 3: Activate exact leaves**

Remove planned status only from what-caching-solves, ttls-and-eviction, stale-data-bugs-and-cache-invalidation, and testing-around-a-cache. Keep all distributed-data-gently leaves planned.

- [ ] **Step 4: Run repository gates**

    pnpm --filter @qa-mastery/curriculum test
    pnpm --filter @qa-mastery/curriculum sync
    pnpm typecheck
    git diff --check

Expected: curriculum 9/9, sync valid, typecheck clean, no whitespace errors. If another live lane temporarily breaks a global gate, record its exact path and verify Redis independently.

- [ ] **Step 5: Inspect and commit exact paths**

Stage only four MDX files, changed Redis images if provenance forced replacement, and isolated Redis taxonomy hunk. Confirm staged names and stat. Commit:

    feat(curriculum): add Redis caching bugs chapter

- [ ] **Step 6: Append coordination handoff**

Record slugs, commit hash, eight executed playgrounds, gates, unchanged distributed-data-gently state, and confirmation that Claude1/Claude2 paths were untouched.
