# Adaptive Learning, Offline Sync, and Trusted Credentials Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert verified learner evidence into explainable recommendations, preserve learner work across offline and multi-device use, and issue revocable public credentials backed by current evidence.

**Architecture:** Pure scoring and conflict-resolution functions live in reusable packages and are tested without Next.js or Supabase. Server-only platform services read owner-scoped data, use the service role only for explicitly audited derived writes, and expose narrow App Router pages or route handlers. Offline support stores drafts in IndexedDB, uses idempotent batch sync with optimistic versions, and caches only a public offline shell rather than authenticated HTML.

**Tech Stack:** TypeScript 5, Next.js 16 App Router, React 19, Vitest 4, Supabase/PostgreSQL RLS, Playwright, IndexedDB, Web App Manifest, Service Worker APIs.

## Global Constraints

- Tasks 1–2 are pure foundations and may run after Wave 1; Tasks 3–8 start only after migrations `20260726000036` through `20260726000040` are integrated and the `personal_notes`, `code_workspaces`, `learner_preferences`, `skill_evidence`, and `skill_mastery` contracts exist.
- Reserve `20260726000041_adaptive_learning.sql`, `20260726000042_offline_sync.sql`, and `20260726000043_trusted_credentials.sql` for this plan; the integration governor serializes migration application.
- Every new table enables RLS in its creation migration, receives live RLS tests, and is added to the RLS coverage guard through direct `.from()` assertions.
- Learners may read their own evidence, recommendations, sync receipts, and credentials; only trusted server paths may derive mastery, write recommendations, or issue credentials.
- Public credential verification exposes the minimum evidence necessary and never exposes learner email, internal user UUID, private notes, code, or tutor memories.
- Authenticated HTML is never cached by the service worker. Offline persistence is limited to user-authored drafts and an unauthenticated offline shell.
- Every service-role mutation emits a privacy-safe audit event and checks the authenticated user before accepting a target identifier.
- Read the installed Next.js 16 guides for Route Handlers, manifests, environment variables, and instrumentation before modifying those surfaces.

---

## File Structure

### Pure learning logic

- Create `packages/grading/src/mastery.ts` — evidence-to-mastery state calculation.
- Create `packages/grading/src/recommendations.ts` — deterministic next-activity ranking and explanation codes.
- Create `packages/grading/test/mastery.test.ts` and `packages/grading/test/recommendations.test.ts` — boundary and ranking tests.
- Modify `packages/grading/src/index.ts` — export the new contracts.

### Adaptive-learning persistence and UI

- Create `supabase/migrations/20260726000041_adaptive_learning.sql` — recommendation snapshots and refresh RPC boundary.
- Create `packages/db/test/adaptive-learning-rls.test.ts` — owner isolation and service-role writes.
- Create `apps/platform/src/lib/mastery/recommendation-service.ts` — collect evidence/preferences and persist ranked recommendations.
- Create `apps/platform/src/app/(app)/progress/actions.ts` — authenticated refresh action.
- Create `apps/platform/src/app/(app)/progress/page.tsx` — mastery and next-activity page.
- Create `apps/platform/src/app/(app)/progress/recommendation-card.tsx` — explanation-first recommendation UI.
- Create `apps/platform/test/recommendation-service.test.ts` and `e2e/tests/progress-mastery.spec.ts`.

### Offline and cross-device sync

- Create `supabase/migrations/20260726000042_offline_sync.sql` — optimistic versions and idempotent sync receipts.
- Create `packages/db/test/offline-sync-rls.test.ts`.
- Create `apps/platform/src/lib/offline/types.ts` — exact local mutation and server-result contracts.
- Create `apps/platform/src/lib/offline/conflict.ts` and `apps/platform/test/offline-conflict.test.ts` — deterministic merge decisions.
- Create `apps/platform/src/lib/offline/store.ts` — IndexedDB queue and draft store.
- Create `apps/platform/src/lib/offline/sync-client.ts` — retry-safe batching.
- Create `apps/platform/src/lib/offline/sync-server.ts` — authenticated resource dispatch and service-role audit.
- Create `apps/platform/src/app/api/sync/route.ts` and `apps/platform/test/sync-route.test.ts`.
- Create `apps/platform/src/app/manifest.ts`, `apps/platform/public/sw.js`, `apps/platform/src/components/offline/service-worker-registration.tsx`, `apps/platform/src/components/offline/offline-banner.tsx`, and `apps/platform/src/app/offline/page.tsx`.
- Modify `apps/platform/src/app/layout.tsx` — register the worker and global offline banner.
- Create `e2e/tests/offline-sync.spec.ts`.

### Trusted credentials

- Create `supabase/migrations/20260726000043_trusted_credentials.sql` and `packages/db/test/trusted-credentials-rls.test.ts`.
- Create `apps/platform/src/lib/credentials/types.ts`, `apps/platform/src/lib/credentials/issue.ts`, and `apps/platform/test/credentials.test.ts`.
- Create `apps/platform/src/app/(app)/credentials/actions.ts` and `apps/platform/src/app/(app)/credentials/page.tsx`.
- Create `apps/platform/src/app/credentials/[publicId]/page.tsx` — public verification page backed by a minimum-data RPC.
- Create `e2e/tests/credentials.spec.ts`.

---

### Task 1: Implement the pure mastery model

**Files:**
- Create: `packages/grading/src/mastery.ts`
- Create: `packages/grading/test/mastery.test.ts`
- Modify: `packages/grading/src/index.ts`

**Interfaces:**
- Consumes: `skill_evidence` rows normalized to `SkillEvidenceInput`.
- Produces: `computeSkillMastery(evidence, now): SkillMasteryResult` for Task 3 and the onboarding/mastery plan.

- [ ] **Step 1: Write failing boundary tests**

```ts
import { describe, expect, it } from "vitest";
import { computeSkillMastery } from "../src/mastery";

describe("computeSkillMastery", () => {
  const now = new Date("2026-07-26T00:00:00Z");

  it("returns not_assessed without evidence", () => {
    expect(computeSkillMastery([], now)).toMatchObject({
      state: "not_assessed",
      score: 0,
      confidence: 0,
      evidenceCount: 0,
    });
  });

  it("marks strong but stale evidence as needs_refresh", () => {
    expect(computeSkillMastery([{
      score: 92,
      confidence: 0.9,
      demonstratedAt: "2026-01-01T00:00:00Z",
    }], now).state).toBe("needs_refresh");
  });

  it("requires current, repeated evidence for verified", () => {
    const evidence = [0, 7, 14].map((days) => ({
      score: 90,
      confidence: 0.9,
      demonstratedAt: new Date(now.getTime() - days * 86_400_000).toISOString(),
    }));
    expect(computeSkillMastery(evidence, now).state).toBe("verified");
  });
});
```

- [ ] **Step 2: Run the test and observe the missing-module failure**

Run: `pnpm --filter @qa-mastery/grading test -- mastery.test.ts`

Expected: FAIL because `../src/mastery` does not exist.

- [ ] **Step 3: Implement the explicit state calculation**

```ts
export type SkillMasteryState =
  | "not_assessed"
  | "emerging"
  | "developing"
  | "proficient"
  | "verified"
  | "needs_refresh";

export interface SkillEvidenceInput {
  score: number;
  confidence: number;
  demonstratedAt: string;
}

export interface SkillMasteryResult {
  state: SkillMasteryState;
  score: number;
  confidence: number;
  evidenceCount: number;
  lastDemonstratedAt: string | null;
}

const REFRESH_AFTER_DAYS = 180;

export function computeSkillMastery(
  evidence: readonly SkillEvidenceInput[],
  now: Date,
): SkillMasteryResult {
  if (evidence.length === 0) {
    return { state: "not_assessed", score: 0, confidence: 0, evidenceCount: 0, lastDemonstratedAt: null };
  }
  const sorted = [...evidence].sort((a, b) => b.demonstratedAt.localeCompare(a.demonstratedAt));
  const weight = sorted.reduce((sum, row) => sum + row.confidence, 0);
  const score = Math.round(sorted.reduce((sum, row) => sum + row.score * row.confidence, 0) / Math.max(weight, 0.01));
  const confidence = Math.min(1, weight / 3);
  const ageDays = (now.getTime() - new Date(sorted[0].demonstratedAt).getTime()) / 86_400_000;
  let state: SkillMasteryState = score < 50 ? "emerging" : score < 75 ? "developing" : "proficient";
  if (score >= 85 && confidence >= 0.75 && sorted.length >= 3) state = "verified";
  if (ageDays > REFRESH_AFTER_DAYS) state = "needs_refresh";
  return { state, score, confidence, evidenceCount: sorted.length, lastDemonstratedAt: sorted[0].demonstratedAt };
}
```

- [ ] **Step 4: Export the model and run focused verification**

Add `export * from "./mastery";` to `packages/grading/src/index.ts`.

Run: `pnpm --filter @qa-mastery/grading test -- mastery.test.ts && pnpm --filter @qa-mastery/grading typecheck`

Expected: PASS.

- [ ] **Step 5: Commit the pure mastery model**

```bash
git add packages/grading/src/mastery.ts packages/grading/src/index.ts packages/grading/test/mastery.test.ts
git commit -m "feat(grading): add evidence-based mastery model"
```

### Task 2: Implement explainable recommendation ranking

**Files:**
- Create: `packages/grading/src/recommendations.ts`
- Create: `packages/grading/test/recommendations.test.ts`
- Modify: `packages/grading/src/index.ts`

**Interfaces:**
- Consumes: mastery snapshots, due-review counts, learner outcome, and candidate activities.
- Produces: `rankLearningActivities(input): RankedActivity[]`, ordered deterministically with explanation codes.

- [ ] **Step 1: Write the failing ranking test**

```ts
import { describe, expect, it } from "vitest";
import { rankLearningActivities } from "../src/recommendations";

it("prioritizes due refresh work before new content", () => {
  const ranked = rankLearningActivities({
    outcome: "first_qa_role",
    mastery: [{ skillKey: "api-testing", state: "needs_refresh", score: 88 }],
    candidates: [
      { id: "new-sql", kind: "lesson", skillKey: "database-testing", difficulty: 2 },
      { id: "refresh-api", kind: "review", skillKey: "api-testing", difficulty: 2 },
    ],
  });
  expect(ranked[0]).toMatchObject({ id: "refresh-api", reason: "refresh_due" });
});
```

- [ ] **Step 2: Confirm the test fails because the module is absent**

Run: `pnpm --filter @qa-mastery/grading test -- recommendations.test.ts`

Expected: FAIL with module resolution error.

- [ ] **Step 3: Implement stable scoring and explanation codes**

```ts
import type { SkillMasteryState } from "./mastery";

export type RecommendationReason = "refresh_due" | "weak_skill" | "goal_alignment" | "continue_path";
export interface ActivityCandidate { id: string; kind: "lesson" | "review" | "practice"; skillKey: string; difficulty: number }
export interface RankedActivity extends ActivityCandidate { score: number; reason: RecommendationReason }
export interface RecommendationInput {
  outcome: string;
  mastery: Array<{ skillKey: string; state: SkillMasteryState; score: number }>;
  candidates: ActivityCandidate[];
}

export function rankLearningActivities(input: RecommendationInput): RankedActivity[] {
  const states = new Map(input.mastery.map((row) => [row.skillKey, row]));
  return input.candidates.map((candidate) => {
    const mastery = states.get(candidate.skillKey);
    if (mastery?.state === "needs_refresh") return { ...candidate, score: 100, reason: "refresh_due" as const };
    if (mastery && mastery.score < 60) return { ...candidate, score: 80, reason: "weak_skill" as const };
    if (input.outcome.includes("qa_role")) return { ...candidate, score: 60, reason: "goal_alignment" as const };
    return { ...candidate, score: 40, reason: "continue_path" as const };
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
```

- [ ] **Step 4: Export and verify**

Add `export * from "./recommendations";` to `packages/grading/src/index.ts`.

Run: `pnpm --filter @qa-mastery/grading test -- recommendations.test.ts && pnpm --filter @qa-mastery/grading typecheck`

Expected: PASS.

- [ ] **Step 5: Commit recommendation ranking**

```bash
git add packages/grading/src/recommendations.ts packages/grading/src/index.ts packages/grading/test/recommendations.test.ts
git commit -m "feat(grading): rank explainable learning recommendations"
```

### Task 3: Persist and display adaptive recommendations

**Files:**
- Create: `supabase/migrations/20260726000041_adaptive_learning.sql`
- Create: `packages/db/test/adaptive-learning-rls.test.ts`
- Create: `apps/platform/src/lib/mastery/recommendation-service.ts`
- Create: `apps/platform/test/recommendation-service.test.ts`
- Create: `apps/platform/src/app/(app)/progress/actions.ts`
- Create: `apps/platform/src/app/(app)/progress/page.tsx`
- Create: `apps/platform/src/app/(app)/progress/recommendation-card.tsx`
- Create: `e2e/tests/progress-mastery.spec.ts`

**Interfaces:**
- Consumes: `learner_preferences`, `skill_mastery`, curriculum candidate metadata, and `rankLearningActivities`.
- Produces: owner-readable `learning_recommendations` and `/progress` UI.

- [ ] **Step 1: Write migration and RLS assertions first**

Create a table with columns `id uuid`, `user_id uuid`, `activity_id text`, `activity_kind text`, `skill_key text`, `rank smallint`, `reason text`, `generated_at timestamptz`, and `expires_at timestamptz`; constrain kinds to `lesson`, `review`, `practice` and reasons to the four exported reason codes. Enable RLS, add read-own only, revoke authenticated writes, add `(user_id, rank)` index, and grant service-role writes.

Add live tests that prove user A reads only A, authenticated insert fails, and service role inserts.

- [ ] **Step 2: Run the RLS test and confirm the table is missing**

Run: `pnpm db:reset && pnpm --filter @qa-mastery/db test:rls -- adaptive-learning-rls.test.ts`

Expected before applying the migration in the test worktree: FAIL because `learning_recommendations` does not exist. Apply/reset with the new migration and rerun; expected PASS.

- [ ] **Step 3: Write a failing service test with a fake repository**

```ts
it("replaces expired recommendations with a stable ranked snapshot", async () => {
  const repo = createFakeRecommendationRepository();
  await refreshRecommendations("user-a", repo, new Date("2026-07-26T00:00:00Z"));
  expect(repo.saved.map((row) => row.rank)).toEqual([1, 2]);
  expect(repo.saved[0]?.reason).toBe("refresh_due");
});
```

- [ ] **Step 4: Implement a server-only repository boundary**

Define `RecommendationRepository` with `loadInput(userId)`, `replace(userId, rows)`, and `audit(userId, count)`. Export `refreshRecommendations(userId, repo, now)`; delete/insert in one Supabase RPC or transaction-safe database function so readers never observe a partial rank set. The production repository uses `createServiceClient()` only after the server action verifies `auth.getUser()` and passes that exact user ID.

- [ ] **Step 5: Add the authenticated action and explanation-first UI**

`refreshMyRecommendations()` accepts no target user ID, resolves the user from the request-scoped client, refreshes, and calls `revalidatePath("/progress")`. The page reads `skill_mastery` and current recommendations through the RLS client and renders state labels, evidence count, last-demonstrated date, and human copy mapped from reason codes.

- [ ] **Step 6: Add the browser journey**

Test that an authenticated seeded user opens `/progress`, sees `Skills needing refresh`, activates `Refresh recommendations`, and follows the first activity link. Test that a signed-out request preserves `/progress` through login.

- [ ] **Step 7: Run focused and aggregate checks**

Run: `pnpm --filter @qa-mastery/platform test -- recommendation-service.test.ts && pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck && pnpm --filter @qa-mastery/e2e e2e -- progress-mastery.spec.ts`

Expected: PASS.

- [ ] **Step 8: Commit adaptive persistence and UI**

```bash
git add supabase/migrations/20260726000041_adaptive_learning.sql packages/db/test/adaptive-learning-rls.test.ts apps/platform/src/lib/mastery apps/platform/test/recommendation-service.test.ts apps/platform/src/app/'(app)'/progress e2e/tests/progress-mastery.spec.ts
git commit -m "feat(platform): add adaptive mastery recommendations"
```

### Task 4: Add deterministic conflict resolution and local draft storage

**Files:**
- Create: `apps/platform/src/lib/offline/types.ts`
- Create: `apps/platform/src/lib/offline/conflict.ts`
- Create: `apps/platform/test/offline-conflict.test.ts`
- Create: `apps/platform/src/lib/offline/store.ts`

**Interfaces:**
- Produces: `SyncMutation`, `SyncResult`, `resolveConflict()`, and `offlineStore` for Tasks 5 and 6.

- [ ] **Step 1: Write conflict tests**

```ts
import { expect, it } from "vitest";
import { resolveConflict } from "@/lib/offline/conflict";

it("applies a mutation whose base version matches", () => {
  expect(resolveConflict({ baseVersion: 4, serverVersion: 4, localUpdatedAt: "2026-07-26T01:00:00Z", serverUpdatedAt: "2026-07-26T00:00:00Z" })).toBe("apply");
});

it("requires the user to choose when both sides changed", () => {
  expect(resolveConflict({ baseVersion: 3, serverVersion: 4, localUpdatedAt: "2026-07-26T01:00:00Z", serverUpdatedAt: "2026-07-26T00:30:00Z" })).toBe("conflict");
});
```

- [ ] **Step 2: Run and observe the missing module**

Run: `pnpm --filter @qa-mastery/platform test -- offline-conflict.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement exact sync contracts and resolver**

```ts
export type SyncResource = "personal_note" | "code_workspace" | "task" | "learner_preference";
export interface SyncMutation {
  operationId: string;
  resource: SyncResource;
  resourceId: string;
  baseVersion: number;
  localUpdatedAt: string;
  payload: Record<string, unknown>;
}
export type SyncResult =
  | { operationId: string; status: "applied"; version: number; updatedAt: string }
  | { operationId: string; status: "conflict"; version: number; updatedAt: string; server: Record<string, unknown> }
  | { operationId: string; status: "rejected"; code: "invalid" | "forbidden" };

export function resolveConflict(input: { baseVersion: number; serverVersion: number; localUpdatedAt: string; serverUpdatedAt: string }): "apply" | "conflict" {
  return input.baseVersion === input.serverVersion ? "apply" : "conflict";
}
```

- [ ] **Step 4: Implement IndexedDB without importing it during SSR**

Expose async methods `putDraft`, `getDraft`, `queueMutation`, `listPending`, `markApplied`, and `clearUserData`. Open database `qa-mastery-offline` version 1 only inside method calls after checking `typeof indexedDB !== "undefined"`. Use object stores `drafts` keyed by `[userId, resource, resourceId]` and `mutations` keyed by `operationId`, with a `userId-status` index.

- [ ] **Step 5: Run tests and typecheck**

Run: `pnpm --filter @qa-mastery/platform test -- offline-conflict.test.ts && pnpm --filter @qa-mastery/platform typecheck`

Expected: PASS without a browser global error in the Node test environment.

- [ ] **Step 6: Commit local offline primitives**

```bash
git add apps/platform/src/lib/offline apps/platform/test/offline-conflict.test.ts
git commit -m "feat(platform): add offline draft and conflict primitives"
```

### Task 5: Add idempotent authenticated batch sync

**Files:**
- Create: `supabase/migrations/20260726000042_offline_sync.sql`
- Create: `packages/db/test/offline-sync-rls.test.ts`
- Create: `apps/platform/src/lib/offline/sync-server.ts`
- Create: `apps/platform/src/lib/offline/sync-client.ts`
- Create: `apps/platform/src/app/api/sync/route.ts`
- Create: `apps/platform/test/sync-route.test.ts`

**Interfaces:**
- Consumes: Task 4 contracts and versioned rows from migrations 0036, 0037, 0039 plus `public.tasks`.
- Produces: `POST /api/sync` accepting `{ mutations: SyncMutation[] }` and returning `{ results: SyncResult[] }`.

- [ ] **Step 1: Add optimistic versions and receipt storage**

The migration asserts that `personal_notes.version` and `code_workspaces.version` already exist from migrations 0036–0037, adds `version bigint not null default 1` to `tasks` and `learner_preferences`, installs a trigger that increments those versions only when a row changes, and creates `sync_operations(user_id uuid, operation_id uuid, resource_type text, resource_id uuid, payload_hash text, result jsonb, created_at timestamptz, primary key(user_id, operation_id))`. Enable RLS with read-own only; service role writes receipts. Add indexes on `(user_id, created_at desc)` and a 30-day guarded retention job.

- [ ] **Step 2: Add live RLS and idempotency tests**

Prove user A cannot read B receipts, authenticated clients cannot insert receipts, service role can insert, and duplicate `(user_id, operation_id)` is rejected. Run `pnpm db:reset && pnpm --filter @qa-mastery/db test:rls -- offline-sync-rls.test.ts`; expected PASS after migration.

- [ ] **Step 3: Write a failing route test**

```ts
it("returns the stored result when an operation id is replayed", async () => {
  const first = await postSync(validMutation);
  const replay = await postSync(validMutation);
  expect(replay).toEqual(first);
  expect(repository.applyCount).toBe(1);
});
```

- [ ] **Step 4: Implement server dispatch with authorization before service-role use**

The route resolves `auth.getUser()` through `createSupabaseServerClient()`, returns 401 without a user, validates at most 50 mutations with Zod, and passes only the authenticated `user.id` to `applySyncBatch`. Resource adapters use a compiled map of `{ personal_note: ["personal_notes", "user_id"], code_workspace: ["code_workspaces", "owner_id"], task: ["tasks", "user_id"], learner_preference: ["learner_preferences", "user_id"] }`, filter by both resource ID and the mapped owner column, compare `version`, and never accept table names or arbitrary columns from payloads. Hash the normalized payload with SHA-256 for replay mismatch detection; a reused operation ID with a different hash returns `rejected/invalid`.

- [ ] **Step 5: Implement retry-safe client batching**

`flushPendingMutations(userId)` sends up to 25 queued items, uses exponential delays of 1, 2, 4, 8, and 16 seconds only for network/5xx failures, marks `applied`, leaves conflicts for user resolution, and stops on 401. It never retries validation or authorization failures.

- [ ] **Step 6: Run focused verification**

Run: `pnpm --filter @qa-mastery/platform test -- sync-route.test.ts offline-conflict.test.ts && pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck`

Expected: PASS.

- [ ] **Step 7: Commit sync transport**

```bash
git add supabase/migrations/20260726000042_offline_sync.sql packages/db/test/offline-sync-rls.test.ts apps/platform/src/lib/offline apps/platform/src/app/api/sync/route.ts apps/platform/test/sync-route.test.ts
git commit -m "feat(platform): add idempotent offline synchronization"
```

### Task 6: Add the installable offline shell and user-visible sync states

**Files:**
- Create: `apps/platform/src/app/manifest.ts`
- Create: `apps/platform/public/sw.js`
- Create: `apps/platform/src/components/offline/service-worker-registration.tsx`
- Create: `apps/platform/src/components/offline/offline-banner.tsx`
- Create: `apps/platform/src/app/offline/page.tsx`
- Modify: `apps/platform/src/app/layout.tsx`
- Create: `e2e/tests/offline-sync.spec.ts`

**Interfaces:**
- Consumes: Task 5 `flushPendingMutations`.
- Produces: install metadata, offline status, and recovery UI.

- [ ] **Step 1: Add a failing PWA browser check**

```ts
test("manifest and offline fallback are available", async ({ page, request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  await page.goto("/offline");
  await expect(page.getByRole("heading", { name: "You are offline" })).toBeVisible();
});
```

Run: `pnpm --filter @qa-mastery/e2e e2e -- offline-sync.spec.ts`

Expected: FAIL because the manifest and offline route do not exist.

- [ ] **Step 2: Add the typed Web App Manifest**

Return `MetadataRoute.Manifest` with name `QA Mastery`, short name `QA Mastery`, description from root metadata, `start_url: "/dashboard"`, `display: "standalone"`, `background_color: "#09090b"`, `theme_color: "#10b981"`, and purpose-aware 192/512 PNG icons. Generate the icons from the existing brand mark and verify their dimensions before commit.

- [ ] **Step 3: Add a deliberately narrow service worker**

Use cache name `qa-mastery-shell-v1`; install only `/offline` and the PWA icons; delete old `qa-mastery-shell-*` caches on activation; return the network response for all requests; fall back to cached `/offline` only for failed navigation requests. Do not cache `/api/**`, authenticated HTML, Supabase responses, user uploads, or opaque third-party responses.

- [ ] **Step 4: Register and display sync status**

Register `/sw.js` after window load in production. `OfflineBanner` listens to `online`/`offline`, announces changes with `role="status"`, displays `Offline — drafts stay on this device`, and calls `flushPendingMutations` after reconnection. Render both components from `layout.tsx` inside `ThemeProvider`.

- [ ] **Step 5: Test offline fallback and draft recovery**

In Playwright, save a note draft, set the context offline, reload the editor and assert the draft remains, restore network, wait for `Saved on all devices`, then reload in a second context for the same user and assert the server version appears.

- [ ] **Step 6: Verify and commit**

Run: `pnpm --filter @qa-mastery/platform test && pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck && pnpm --filter @qa-mastery/platform build && pnpm --filter @qa-mastery/e2e e2e -- offline-sync.spec.ts`

Expected: PASS.

```bash
git add apps/platform/src/app/manifest.ts apps/platform/public/sw.js apps/platform/src/components/offline apps/platform/src/app/offline apps/platform/src/app/layout.tsx e2e/tests/offline-sync.spec.ts
git commit -m "feat(platform): add installable offline recovery shell"
```

### Task 7: Issue revocable evidence-backed credentials

**Files:**
- Create: `supabase/migrations/20260726000043_trusted_credentials.sql`
- Create: `packages/db/test/trusted-credentials-rls.test.ts`
- Create: `apps/platform/src/lib/credentials/types.ts`
- Create: `apps/platform/src/lib/credentials/issue.ts`
- Create: `apps/platform/test/credentials.test.ts`
- Create: `apps/platform/src/app/(app)/credentials/actions.ts`
- Create: `apps/platform/src/app/(app)/credentials/page.tsx`
- Create: `apps/platform/src/app/credentials/[publicId]/page.tsx`
- Create: `e2e/tests/credentials.spec.ts`

**Interfaces:**
- Consumes: `skill_mastery` rows in `verified` state and public profile consent.
- Produces: owner-readable credential records and a revocable `/credentials/:publicId` verifier.

- [ ] **Step 1: Write issuance policy tests**

```ts
it("rejects evidence that is not verified or is older than the definition window", () => {
  expect(canIssueCredential({ state: "proficient", lastDemonstratedAt: "2026-07-20T00:00:00Z" }, definition, now)).toEqual({ ok: false, reason: "not_verified" });
  expect(canIssueCredential({ state: "verified", lastDemonstratedAt: "2025-01-01T00:00:00Z" }, definition, now)).toEqual({ ok: false, reason: "evidence_stale" });
});
```

Run: `pnpm --filter @qa-mastery/platform test -- credentials.test.ts`; expected FAIL because the module is absent.

- [ ] **Step 2: Create credential definitions, issues, and minimum-data verifier**

Create `credential_definitions(id text primary key, title text, skill_keys text[], min_score smallint, evidence_max_age_days integer, version integer, active boolean, created_at)` and `issued_credentials(id uuid, public_id uuid unique, user_id uuid, definition_id text, definition_version integer, status text check active/revoked/expired, issued_at, expires_at, revoked_at, evidence_snapshot jsonb, display_name text, updated_at)`. Enable RLS; owners read issues; no authenticated writes. Add service-role-only `issue_credential(target uuid, definition text)` and `revoke_credential(target uuid, public_id uuid)` functions. Add `get_public_credential(public_id uuid)` returning only title, display name, status, issue/expiry dates, definition version, skill labels, scores, and last-demonstrated dates.

- [ ] **Step 3: Add RLS and public-RPC tests**

Prove user A cannot read B issue rows, authenticated insert/update fails, service-role issuance succeeds only for verified current evidence, revoked credentials return revoked status, and the public RPC result has no `user_id`, email, private metadata, source IDs, notes, or code.

- [ ] **Step 4: Implement the server issuance boundary**

Define `canIssueCredential(mastery, definition, now)` as a pure function. `issueMyCredential(definitionId)` resolves the signed-in user, calls the service-role RPC for that same ID, writes an `audit_events` row with action `credential.issue`, and revalidates `/credentials`. `revokeMyCredential(publicId)` follows the same ownership and audit pattern.

- [ ] **Step 5: Build owner and public pages**

The owner page lists eligible definitions, missing requirements, active credentials, expiry/refresh status, copy-verification-link, and revoke confirmation. The public page uses `notFound()` for unknown IDs, labels revoked/expired credentials prominently, renders the evidence snapshot, and links to the credential methodology without exposing authenticated navigation.

- [ ] **Step 6: Add end-to-end verification**

Seed verified evidence, issue a credential, open its public URL in a signed-out context, assert evidence and dates, revoke it, reload, and assert `Revoked`. Also assert the HTML does not contain the learner email or internal UUID.

- [ ] **Step 7: Run the complete credential gate**

Run: `pnpm db:reset && pnpm --filter @qa-mastery/db test:rls -- trusted-credentials-rls.test.ts && pnpm --filter @qa-mastery/platform test -- credentials.test.ts && pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck && pnpm --filter @qa-mastery/e2e e2e -- credentials.spec.ts`

Expected: PASS.

- [ ] **Step 8: Commit trusted credentials**

```bash
git add supabase/migrations/20260726000043_trusted_credentials.sql packages/db/test/trusted-credentials-rls.test.ts apps/platform/src/lib/credentials apps/platform/test/credentials.test.ts apps/platform/src/app/'(app)'/credentials apps/platform/src/app/credentials e2e/tests/credentials.spec.ts
git commit -m "feat(platform): issue revocable trusted credentials"
```

### Task 8: Run the subsystem integration gate and document operational limits

**Files:**
- Modify: `docs/03-data-model.md`
- Modify: `docs/09-deployment.md`
- Modify: `docs/04-invariants.md`
- Create: `docs/runbooks/offline-sync-conflicts.md`
- Create: `docs/runbooks/credential-revocation.md`

**Interfaces:**
- Consumes: Tasks 1–7.
- Produces: deployable subsystem evidence and operator recovery instructions.

- [ ] **Step 1: Document schemas, invariants, and privacy boundaries**

Record the three migrations, service-role-only derivation/issuance, public credential field allowlist, 30-day sync-receipt retention, offline-cache allowlist, and conflict resolution behavior. Include commands to inspect and revoke a credential and to find unresolved sync conflicts without exposing payloads in logs.

- [ ] **Step 2: Run the complete local verification sequence**

Run:

```bash
pnpm install --frozen-lockfile
pnpm db:reset
pnpm lint
pnpm typecheck
pnpm test
pnpm test:rls
pnpm --filter @qa-mastery/curriculum sync
pnpm build
pnpm --filter @qa-mastery/e2e e2e -- progress-mastery.spec.ts offline-sync.spec.ts credentials.spec.ts
```

Expected: every command exits 0; no new RLS exemption; build output contains no service-role key, evidence source ID, sync payload, or credential-private field.

- [ ] **Step 3: Perform manual cross-device and accessibility checks**

Verify keyboard-only conflict resolution, VoiceOver announcement of offline/sync states, 200% and 400% zoom, two-browser conflict creation/resolution, installability, no authenticated-page cache entries, and public credential reflow. Record browser/OS/version and result in the plan handoff.

- [ ] **Step 4: Commit subsystem documentation**

```bash
git add docs/03-data-model.md docs/09-deployment.md docs/04-invariants.md docs/runbooks/offline-sync-conflicts.md docs/runbooks/credential-revocation.md
git commit -m "docs: document adaptive offline and credential operations"
```
