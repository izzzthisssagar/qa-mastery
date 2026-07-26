# Immediate Learning Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current learning tools trustworthy and practical now: completion saves survive interruption and report their true state, Notes is clearly named Knowledge Base, the simulator works on touch devices and exposes useful workspace controls and diagnostics, and portfolio evidence reflows into readable mobile cards.

**Architecture:** Keep offline durability and execution-state classification in pure modules with narrow browser adapters. Preserve `/notes` as the stable route while changing product language. Extend the existing runner result contract with a typed failure category and duration so the UI does not parse console strings. Keep the portfolio page server-rendered and move only deterministic presentation into a reusable responsive component.

**Tech Stack:** Next.js 16.2 App Router and Route Handlers, React 19, TypeScript 5, IndexedDB, Monaco, Wandbox runner, Vitest 4, Playwright 1.60, `@qa-mastery/ui` page/record primitives.

## Global Constraints

- Start from the Wave 1 integration checkpoint; inspect commits `5133aa4`, `5fda70d`, `34572df`, and `43e4d38` as evidence only and recreate the behavior against the current base.
- Read `apps/platform/AGENTS.md` and local Next.js 16.2.11 guides `01-app/01-getting-started/05-server-and-client-components.md`, `01-app/01-getting-started/04-linking-and-navigating.md`, and the Route Handler/API material referenced by the installed docs before editing.
- Keep `/notes/**` stable; this wave changes user-facing language to Knowledge Base and does not introduce `/knowledge-base` redirects.
- Never show `Saved` until server synchronization resolves successfully.
- Offline/local persistence is best-effort fallback, not server confirmation; its UI state is `Offline — saved on this device`.
- Completion synchronization remains idempotent through `completeNote`; a resumed request must not grant duplicate XP.
- Do not store source code on the server in Wave 2; named workspaces, sharing, history, custom tests, and durable snippet persistence belong to Wave 3.
- Do not call the live Wandbox endpoint from E2E; runner mapping is unit-tested with mocked fetch.
- Keep the existing one-run-per-10-seconds and 100-runs-per-day server limits.
- Do not infer compile/runtime/timeout state from human console text in the UI; use `RunResult.failureKind`.
- Touch-only devices render the textarea fallback and never download Monaco.
- Keep desktop Monaco client-only with `ssr: false`.
- Do not edit workflows, migrations, dependency manifests, `pnpm-lock.yaml`, authenticated shell, dropdown, community media, or accessibility route states.
- `apps/platform/src/app/(app)/notes/note-components.tsx` is serialized: start Tasks 1–2 only after Lane B's accessible Term extraction and Lane A's celebration provider are integrated.
- `packages/ui/src/index.ts` is owned by Lane A/governor; this lane only consumes exports after their integration checkpoint.
- Once Lane A supplies `<main id="main-content">`, every Lane C Knowledge Base and Simulator page changed here must use a non-main outer wrapper so the authenticated document retains exactly one main landmark.
- Every behavior change starts with an observed failing test, then focused green tests, lint, typecheck, and a narrow commit.

## File Map and Ownership

**Lane-owned existing files**

- `apps/platform/src/app/(app)/notes/note-components.tsx` — completion integration only after the serialized checkpoint.
- `apps/platform/src/app/(app)/notes/page.tsx` — Knowledge Base name and metadata.
- `apps/platform/src/app/(app)/notes/[module]/page.tsx` — Knowledge Base back-link copy.
- `apps/platform/src/app/(app)/notes/[module]/[chapter]/[topic]/page.tsx` — Knowledge Base metadata and breadcrumbs.
- `apps/platform/src/app/page.tsx` — public Knowledge Base copy.
- `apps/platform/src/components/marketing/notes-shelf.tsx` — comments/accessibility labels that expose old product copy.
- `apps/platform/src/app/(app)/simulator/simulator-client.tsx` — editor, toolbar, shortcut, fullscreen, and output-state UI.
- `apps/platform/src/app/(app)/simulator/page.tsx` — shared editor page template.
- `apps/platform/src/app/(app)/simulator/actions.ts` — typed execution return; existing quota is preserved.
- `apps/platform/src/app/(app)/portfolio/me/page.tsx` — presentation extraction.
- `packages/grading/src/runner.ts` — typed failure kind and duration.
- `packages/grading/src/simulator-languages.ts` — source-file extension metadata.
- `packages/grading/src/wandbox-runner.ts` — timeout, compile, runtime, and infrastructure classification.
- `packages/grading/test/wandbox-runner.test.ts` and `packages/grading/test/simulator-languages.test.ts` — runner contracts.
- `e2e/tests/notes.spec.ts`, `e2e/tests/notes-v2.spec.ts`, and `e2e/tests/simulator.spec.ts` — user journeys.

**Lane-owned new files**

- `apps/platform/src/app/(app)/notes/save-controller.ts` — honest local/server save state machine.
- `apps/platform/src/app/(app)/notes/save-controller.test.ts` — timer, failure, offline, retry, and disposal tests.
- `apps/platform/src/app/(app)/notes/note-draft-db.ts` — IndexedDB pending-operation adapter.
- `apps/platform/src/app/(app)/notes/note-draft-db.test.ts` — server/no-IDB behavior.
- `apps/platform/src/app/(app)/notes/save-indicator.tsx` — saving/saved/offline/error feedback.
- `apps/platform/src/app/(app)/notes/save-indicator.test.tsx` — markup states.
- `apps/platform/src/app/api/notes/complete/route.ts` — keepalive-compatible completion endpoint.
- `apps/platform/src/hooks/use-pointer-fine.ts` and `.test.tsx` — SSR/touch-safe media-query store.
- `apps/platform/src/app/(app)/simulator/simulator-state.ts` and `.test.ts` — buffer, reset, output, filename, and error-state reducer.
- `apps/platform/src/app/(app)/simulator/simulator-toolbar.tsx` — utility controls.
- `apps/platform/src/app/(app)/simulator/simulator-output.tsx` — explicit output state.
- `apps/platform/src/app/(app)/portfolio/me/portfolio-results.tsx` — mobile cards plus desktop table.
- `apps/platform/src/app/(app)/portfolio/me/portfolio-results.test.tsx` — identical-data presentation contract.

---

### Task 1: Implement the Honest Save State Machine

**Files:**
- Create: `apps/platform/src/app/(app)/notes/save-controller.ts`
- Create: `apps/platform/src/app/(app)/notes/save-controller.test.ts`
- Create: `apps/platform/src/app/(app)/notes/note-draft-db.ts`
- Create: `apps/platform/src/app/(app)/notes/note-draft-db.test.ts`
- Create: `apps/platform/src/app/(app)/notes/save-indicator.tsx`
- Create: `apps/platform/src/app/(app)/notes/save-indicator.test.tsx`

**Interfaces:**
- Produces: `SaveStatus = "idle" | "saving" | "saved" | "offline" | "error"`.
- Produces: `createSaveController(options): { run(): void; retry(): void; dispose(): void }`.
- `SaveControllerOptions = { persistLocal(): Promise<void>; sync(): Promise<void>; isOnline(): boolean; onStatusChange(status): void; debounceMs?: number }`.
- Produces: `putPendingSave<T>(key, value)`, `getPendingSave<T>(key)`, and `deletePendingSave(key)`; absence of IndexedDB returns safely without throwing.

- [ ] **Step 1: Write failing state-machine tests**

Create `save-controller.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSaveController, type SaveStatus } from "./save-controller";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function setup({ online = true } = {}) {
  const statuses: SaveStatus[] = [];
  const persistLocal = vi.fn().mockResolvedValue(undefined);
  const sync = vi.fn().mockResolvedValue(undefined);
  const controller = createSaveController({
    persistLocal,
    sync,
    isOnline: () => online,
    onStatusChange: (status) => statuses.push(status),
  });
  return { statuses, persistLocal, sync, controller };
}

it("persists locally before confirming a server save", async () => {
  const { controller, statuses, persistLocal, sync } = setup();
  controller.run();
  expect(persistLocal).toHaveBeenCalledOnce();
  expect(statuses).toEqual(["saving"]);
  await vi.runAllTimersAsync();
  expect(sync).toHaveBeenCalledOnce();
  expect(statuses.at(-1)).toBe("saved");
});

it("reports offline without attempting sync and retries when online", async () => {
  let online = false;
  const statuses: SaveStatus[] = [];
  const sync = vi.fn().mockResolvedValue(undefined);
  const controller = createSaveController({
    persistLocal: vi.fn().mockResolvedValue(undefined),
    sync,
    isOnline: () => online,
    onStatusChange: (status) => statuses.push(status),
  });
  controller.run();
  await vi.runAllTimersAsync();
  expect(sync).not.toHaveBeenCalled();
  expect(statuses.at(-1)).toBe("offline");
  online = true;
  controller.retry();
  await vi.runAllTimersAsync();
  expect(statuses.at(-1)).toBe("saved");
});

it("reports local or server failure and can recover", async () => {
  const statuses: SaveStatus[] = [];
  const sync = vi.fn().mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce(undefined);
  const controller = createSaveController({
    persistLocal: vi.fn().mockResolvedValue(undefined),
    sync,
    isOnline: () => true,
    onStatusChange: (status) => statuses.push(status),
  });
  controller.run();
  await vi.runAllTimersAsync();
  expect(statuses.at(-1)).toBe("error");
  controller.retry();
  await vi.runAllTimersAsync();
  expect(statuses.at(-1)).toBe("saved");
});
```

- [ ] **Step 2: Run the test and observe the missing module**

Run: `pnpm --filter @qa-mastery/platform test -- src/app/'(app)'/notes/save-controller.test.ts`

Expected: FAIL because `save-controller.ts` does not exist.

- [ ] **Step 3: Implement a non-duplicating save state machine**

`run()` sets `saving` once, awaits local persistence, reports `offline` without calling `sync` when offline, debounces only the server call, and reports `saved` only after `sync` resolves. Catch local and server rejection as `error`. `retry()` skips the local write because the pending operation is already stored. `dispose()` clears a timer and suppresses later status callbacks.

- [ ] **Step 4: Write the no-IndexedDB adapter test**

```ts
import { describe, expect, it } from "vitest";
import { deletePendingSave, getPendingSave, putPendingSave } from "./note-draft-db";

it("degrades safely when IndexedDB is unavailable", async () => {
  await expect(putPendingSave("k", { slug: "s" })).resolves.toBeUndefined();
  await expect(getPendingSave("k")).resolves.toBeNull();
  await expect(deletePendingSave("k")).resolves.toBeUndefined();
});
```

- [ ] **Step 5: Implement the IndexedDB pending-operation store**

Use database `qa-mastery-notes`, version `1`, store `pending-saves`, and close each database handle in `finally`. Return `null` when no value exists. Catch adapter errors at the save-controller boundary so they become visible `error`, not unhandled promise rejection.

- [ ] **Step 6: Write SaveIndicator markup tests**

Assert `idle` renders nothing; `saving` shows `Saving…`; `saved` shows `Saved`; `offline` shows `Offline — saved on this device`; `error` shows `Couldn’t save` plus Retry when a callback exists. All non-idle states render `data-testid="note-save-indicator" role="status" aria-live="polite"`.

- [ ] **Step 7: Implement SaveIndicator with semantic status colors**

Use `text-muted-foreground` for saving/offline, `text-success-text` for saved, and `text-danger-text` for error. Retry is a 44px minimum button with visible focus.

- [ ] **Step 8: Run focused tests and typecheck**

Run: `pnpm --filter @qa-mastery/platform test -- src/app/'(app)'/notes/save-controller.test.ts src/app/'(app)'/notes/note-draft-db.test.ts src/app/'(app)'/notes/save-indicator.test.tsx && pnpm --filter @qa-mastery/platform typecheck`

Expected: PASS with no duplicate saving status and no unhandled local-write rejection.

- [ ] **Step 9: Commit the save foundation**

```bash
git add apps/platform/src/app/'(app)'/notes/save-controller.ts apps/platform/src/app/'(app)'/notes/save-controller.test.ts apps/platform/src/app/'(app)'/notes/note-draft-db.ts apps/platform/src/app/'(app)'/notes/note-draft-db.test.ts apps/platform/src/app/'(app)'/notes/save-indicator.tsx apps/platform/src/app/'(app)'/notes/save-indicator.test.tsx
git commit -m "feat(notes): add honest local-first save state"
```

### Task 2: Integrate Durable Note Completion and Keepalive Sync

**Files:**
- Create: `apps/platform/src/app/api/notes/complete/route.ts`
- Modify after Lane A and Lane B checkpoints: `apps/platform/src/app/(app)/notes/note-components.tsx`
- Modify: `e2e/tests/notes-v2.spec.ts`

**Interfaces:**
- Route consumes JSON `{ noteSlug: string }`; returns `{ alreadyDone: boolean }` on success or `{ error: string }` with status 400.
- Completion pending key is `note-complete:${slug}` with value `{ slug: string }`.
- Consumes: `useCelebration().celebrate({ id, intensity })` from Lane A; does not create DOM particles directly.

- [ ] **Step 1: Add a failing honest-save browser journey**

Append to `notes-v2.spec.ts`:

```ts
test("failed completion stays local, reports honestly, and retries", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/notes/complete", async (route) => {
    attempts += 1;
    if (attempts === 1) await route.fulfill({ status: 503, body: "unavailable" });
    else await route.continue();
  });
  const complete = page.getByRole("button", { name: /mark complete/i });
  await complete.scrollIntoViewIfNeeded();
  await complete.click();
  await expect(page.getByTestId("note-save-indicator")).toContainText("Couldn’t save");
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByTestId("note-save-indicator")).toHaveText("Saved");
  await page.reload();
  await expect(page.getByRole("button", { name: /completed .* xp earned/i })).toBeVisible();
});
```

- [ ] **Step 2: Run the journey and observe silent rollback/re-enable behavior**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/notes-v2.spec.ts --project=chromium --grep "reports honestly"`

Expected: FAIL because the current component catches the error without visible status or local pending state.

- [ ] **Step 3: Add the same-origin keepalive Route Handler**

Parse JSON defensively, reject missing/blank `noteSlug`, call the existing idempotent `completeNote(noteSlug)`, and return `NextResponse.json`. Do not duplicate authorization or XP logic in the route.

- [ ] **Step 4: Replace completion transition with the save controller**

Build the controller in an effect. `persistLocal` writes the pending key. `sync` posts to `/api/notes/complete` with `keepalive: true`, deletes the key only after an OK response, and calls `celebrate({ id: `note-complete:${slug}`, intensity: "standard" })` only when `alreadyDone` is false.

- [ ] **Step 5: Resume a pending completion after hydration**

When `useHydrated()` is true and server `initialDone` is false, load the pending key. If present, set optimistic `done`, then call `retry()` rather than `run()` so the existing marker is not rewritten. On the browser `online` event, retry only when status is `offline` or `error`.

- [ ] **Step 6: Render honest status without locking out retry**

The completion button remains disabled after optimistic completion, but `SaveIndicator` renders below it and owns retry. A server-confirmed initial completion displays no transient save status.

- [ ] **Step 7: Remove the manual DOM burst**

Delete direct `document.createElement`, `requestAnimationFrame`, random-position, and timeout-removal code from `Complete`; the shared celebration provider is the only milestone visual surface.

- [ ] **Step 8: Run notes unit, Chromium, and WebKit tests**

Run: `pnpm --filter @qa-mastery/platform test -- src/app/'(app)'/notes && pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck && pnpm --filter @qa-mastery/e2e exec playwright test tests/notes-v2.spec.ts`

Expected: PASS; failed sync is visible, retry reaches Saved, reload retains completion, and XP is not duplicated.

- [ ] **Step 9: Commit durable completion**

```bash
git add apps/platform/src/app/api/notes/complete/route.ts apps/platform/src/app/'(app)'/notes/note-components.tsx e2e/tests/notes-v2.spec.ts
git commit -m "fix(notes): persist completion with honest status"
```

### Task 3: Rename the Curriculum Surface to Knowledge Base

**Files:**
- Modify: `apps/platform/src/app/(app)/notes/page.tsx`
- Modify: `apps/platform/src/app/(app)/notes/[module]/page.tsx`
- Modify: `apps/platform/src/app/(app)/notes/[module]/[chapter]/[topic]/page.tsx`
- Modify: `apps/platform/src/app/page.tsx`
- Modify: `apps/platform/src/components/marketing/notes-shelf.tsx`
- Modify: `e2e/tests/notes.spec.ts`

**Interfaces:**
- Product copy: `Knowledge Base` is the curated curriculum. The word `notes` remains only for individual curriculum entries, database/function identifiers, code paths, and future personal-note distinctions.
- Route contract: `/notes` and every nested route remain unchanged.

- [ ] **Step 1: Change browser assertions first**

In `notes.spec.ts`, rename the describe block to `Knowledge Base`, assert heading `Knowledge Base`, and assert the module link still begins with `/notes/`.

- [ ] **Step 2: Run the two specs and observe old-copy failures**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/notes.spec.ts --project=chromium`

Expected: FAIL because the current heading and hub card say `Notes wiki`.

- [ ] **Step 3: Replace public product labels without renaming code symbols**

Use metadata title `Knowledge Base · QA Mastery`, heading `Knowledge Base`, public CTA `Browse the Knowledge Base`, module back link `← Knowledge Base`, topic breadcrumb `Knowledge Base`, and topic metadata suffix `Knowledge Base`. Replace the three Knowledge Base pages' outer `<main>` with `<div>` while preserving their classes. Lane A owns and tests the corresponding hub card and dashboard `topics` copy.

- [ ] **Step 4: Preserve stable paths and internal function names**

Do not rename `NotesPage`, `NotesSearch`, `getNotesCurriculumProgress`, database tables, the `/notes` folder, or test IDs. This avoids a broad migration with no user benefit.

- [ ] **Step 5: Prove no visible legacy label remains**

Run: `rg -n "Notes wiki|Notes Wiki|notes wiki|Browse the notes wiki" apps/platform/src e2e/tests`

Expected: no user-visible match; historical comments may be rewritten to `Knowledge Base` in the same touched files.

- [ ] **Step 6: Run notes and hub browser verification**

Run: `pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck && pnpm --filter @qa-mastery/e2e exec playwright test tests/notes.spec.ts`

Expected: PASS in Chromium and WebKit; URLs still begin `/notes`.

- [ ] **Step 7: Commit the product-language correction**

```bash
git add apps/platform/src/app/'(app)'/notes/page.tsx apps/platform/src/app/'(app)'/notes/'[module]'/page.tsx apps/platform/src/app/'(app)'/notes/'[module]'/'[chapter]'/'[topic]'/page.tsx apps/platform/src/app/page.tsx apps/platform/src/components/marketing/notes-shelf.tsx e2e/tests/notes.spec.ts
git commit -m "fix(content): clarify Knowledge Base naming"
```

### Task 4: Add the Touch-Safe Simulator Editor Boundary

**Files:**
- Create: `apps/platform/src/hooks/use-pointer-fine.ts`
- Create: `apps/platform/src/hooks/use-pointer-fine.test.tsx`
- Modify: `apps/platform/src/app/(app)/simulator/simulator-client.tsx`
- Modify: `e2e/tests/simulator.spec.ts`

**Interfaces:**
- Produces: `usePointerFine(): boolean` using `useSyncExternalStore` and query `(pointer: fine)`.
- Server snapshot is `false`; the first render is the textarea fallback until a fine pointer is confirmed.
- Monaco and textarea consume the same `code` state and never fork execution logic.

- [ ] **Step 1: Write the failing server-snapshot test**

```tsx
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { usePointerFine } from "./use-pointer-fine";

function Probe() {
  const fine = usePointerFine();
  return <span>{fine ? "monaco" : "textarea"}</span>;
}

it("defaults to the touch-safe editor during SSR", () => {
  expect(renderToStaticMarkup(<Probe />)).toContain("textarea");
});
```

- [ ] **Step 2: Add the failing touch-only browser test**

Before navigation, stub `matchMedia("(pointer: fine)")` to return `matches: false`. Assert `simulator-editor-fallback` is visible, `.monaco-editor` count is zero, Java starter is present, and edits update the fallback value.

- [ ] **Step 3: Run unit and browser tests and observe missing behavior**

Run: `pnpm --filter @qa-mastery/platform test -- src/hooks/use-pointer-fine.test.tsx && pnpm --filter @qa-mastery/e2e exec playwright test tests/simulator.spec.ts --project=chromium --grep "touch-only"`

Expected: unit FAIL because the hook is absent; browser FAIL because Monaco loads.

- [ ] **Step 4: Implement the media-query external store**

Subscribe with `MediaQueryList.addEventListener("change", callback)` and unsubscribe symmetrically. Return false when `window` or `matchMedia` is unavailable.

- [ ] **Step 5: Select the editor at the client boundary**

When fine, render Monaco exactly as today. Otherwise render:

```tsx
<textarea
  data-testid="simulator-editor-fallback"
  aria-label="Code editor"
  spellCheck={false}
  autoCapitalize="off"
  autoCorrect="off"
  value={code}
  onChange={(event) => setCode(event.target.value)}
  className="h-[420px] w-full resize-y bg-surface p-4 font-mono text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent"
/>
```

- [ ] **Step 6: Run unit, cross-browser simulator, lint, and type checks**

Run: `pnpm --filter @qa-mastery/platform test -- src/hooks/use-pointer-fine.test.tsx && pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck && pnpm --filter @qa-mastery/e2e exec playwright test tests/simulator.spec.ts`

Expected: PASS in Chromium and WebKit; touch path has no Monaco node.

- [ ] **Step 7: Commit the touch-safe editor**

```bash
git add apps/platform/src/hooks/use-pointer-fine.ts apps/platform/src/hooks/use-pointer-fine.test.tsx apps/platform/src/app/'(app)'/simulator/simulator-client.tsx e2e/tests/simulator.spec.ts
git commit -m "fix(simulator): avoid Monaco on touch-only devices"
```

### Task 5: Add Typed Runner Diagnostics and Timeouts

**Files:**
- Modify: `packages/grading/src/runner.ts`
- Modify: `packages/grading/src/simulator-languages.ts`
- Modify: `packages/grading/src/wandbox-runner.ts`
- Modify: `packages/grading/test/wandbox-runner.test.ts`
- Modify: `packages/grading/test/simulator-languages.test.ts`
- Modify: `apps/platform/src/app/(app)/simulator/actions.ts`

**Interfaces:**
- Adds: `RunFailureKind = "compile" | "runtime" | "timeout" | "infrastructure"`.
- Extends `RunResult` with `failureKind?: RunFailureKind` and `durationMs?: number`; existing asynchronous providers remain source-compatible.
- Extends `SimulatorLanguage` with `extension: "java" | "py" | "js" | "ts" | "cs"`.
- Wandbox timeout is 15,000ms using an abort signal; override for unit tests via constructor `new WandboxRunner({ timeoutMs?: number; now?: () => number })`.

- [ ] **Step 1: Extend runner tests before types**

Add assertions:

```ts
it("classifies compile and runtime failures without UI string parsing", async () => {
  vi.stubGlobal("fetch", mockWandbox({ status: "1", compiler_error: "syntax error" }));
  const compile = await new WandboxRunner().executeSync(req("java", "class Main {"));
  expect(compile.failureKind).toBe("compile");

  vi.stubGlobal("fetch", mockWandbox({ status: "1", program_error: "boom" }));
  const runtime = await new WandboxRunner().executeSync(req("python", "raise Exception()"));
  expect(runtime.failureKind).toBe("runtime");
});

it("classifies an aborted request as timeout", async () => {
  vi.stubGlobal("fetch", vi.fn((_url, init: RequestInit) => new Promise((_resolve, reject) => {
    init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  })));
  const result = await new WandboxRunner({ timeoutMs: 1 }).executeSync(req("python", "print(1)"));
  expect(result.failureKind).toBe("timeout");
});
```

In language registry tests, assert all extensions are non-empty and unique where appropriate.

- [ ] **Step 2: Run grading tests and observe missing properties/constructor**

Run: `pnpm --filter @qa-mastery/grading test -- test/wandbox-runner.test.ts test/simulator-languages.test.ts`

Expected: FAIL on missing `failureKind`, `durationMs`, `extension`, and constructor options.

- [ ] **Step 3: Extend the public types with backwards-compatible optional failure kind**

Both fields stay optional for successful and legacy asynchronous providers. `WandboxRunner` populates duration on every result and failure kind on every non-success result; do not expand this task into unrelated Docker, Playwright, or Judge0 runner changes.

- [ ] **Step 4: Add exact source extensions**

Map Java `java`, Python `py`, JavaScript `js`, TypeScript `ts`, and C# `cs`. Keep compiler and normalization unchanged.

- [ ] **Step 5: Implement abort and duration measurement**

Create an `AbortController`, schedule `abort()` after `timeoutMs`, clear the timer in `finally`, and calculate `durationMs = Math.max(0, now() - startedAt)`. Map abort to status `failed`, `failureKind: "timeout"`; network/429/non-OK/unsupported language to `infrastructure`; compiler-only failure to `compile`; non-zero program execution to `runtime`; success has no failure kind.

- [ ] **Step 6: Preserve typed results in `runSimulatorCode` persistence**

No UI-specific transformation belongs in the server action. Insert the extended result JSON exactly as returned, preserving quota/cooldown and existing logging.

- [ ] **Step 7: Run grading and platform verification**

Run: `pnpm --filter @qa-mastery/grading test && pnpm --filter @qa-mastery/grading typecheck && pnpm --filter @qa-mastery/platform typecheck`

Expected: PASS; every Wandbox result includes duration, and each failing mocked Wandbox response has a category.

- [ ] **Step 8: Commit typed diagnostics**

```bash
git add packages/grading/src/runner.ts packages/grading/src/simulator-languages.ts packages/grading/src/wandbox-runner.ts packages/grading/test/wandbox-runner.test.ts packages/grading/test/simulator-languages.test.ts apps/platform/src/app/'(app)'/simulator/actions.ts
git commit -m "feat(simulator): classify execution failures"
```

### Task 6: Add Simulator State, Utility Controls, and Explicit Output

**Files:**
- Create: `apps/platform/src/app/(app)/simulator/simulator-state.ts`
- Create: `apps/platform/src/app/(app)/simulator/simulator-state.test.ts`
- Create: `apps/platform/src/app/(app)/simulator/simulator-toolbar.tsx`
- Create: `apps/platform/src/app/(app)/simulator/simulator-output.tsx`
- Modify: `apps/platform/src/app/(app)/simulator/simulator-client.tsx`
- Modify after Lane A: `apps/platform/src/app/(app)/simulator/page.tsx`
- Modify: `e2e/tests/simulator.spec.ts`

**Interfaces:**
- Produces: `SimulatorOutputState = { kind: "idle" | "running" | "success" | "compile-error" | "runtime-error" | "timeout" | "infrastructure-error" | "request-error"; console: string; durationMs?: number }`.
- Produces: `toOutputState(result?, error?, running?)`, `sourceFilename(language)`, and `shouldReplaceStarter(current, previousStarter)`.
- Toolbar consumes `{ code, language, running, fullscreen, onRun, onReset, onClearOutput, onToggleFullscreen }` and uses browser clipboard/download adapters internally.

- [ ] **Step 1: Write failing pure-state tests**

```ts
import { describe, expect, it } from "vitest";
import { findSimulatorLanguage } from "@qa-mastery/grading";
import { sourceFilename, toOutputState } from "./simulator-state";

it("maps every typed runner failure to a distinct UI state", () => {
  const base = { status: "failed" as const, passed: false, console: "x", artifacts: [], staticChecks: [], durationMs: 12 };
  expect(toOutputState({ ...base, failureKind: "compile" }).kind).toBe("compile-error");
  expect(toOutputState({ ...base, failureKind: "runtime" }).kind).toBe("runtime-error");
  expect(toOutputState({ ...base, failureKind: "timeout" }).kind).toBe("timeout");
  expect(toOutputState({ ...base, failureKind: "infrastructure" }).kind).toBe("infrastructure-error");
});

it("builds a download filename from registry metadata", () => {
  expect(sourceFilename(findSimulatorLanguage("python")!)).toBe("qa-mastery-snippet.py");
});
```

- [ ] **Step 2: Run the focused test and observe the missing module**

Run: `pnpm --filter @qa-mastery/platform test -- src/app/'(app)'/simulator/simulator-state.test.ts`

Expected: FAIL because `simulator-state.ts` does not exist.

- [ ] **Step 3: Implement pure state mapping**

Running wins over stale result; request exceptions map to `request-error`; passed results map to `success`; an absent result maps to `idle`. Preserve console text exactly and expose duration only when finite and non-negative.

- [ ] **Step 4: Add failing toolbar browser assertions**

In `simulator.spec.ts`, assert Reset, Copy, Download, Clear output, Full screen, runtime/compiler label, and Run are visible. Press `Control+Enter` after editing and intercept the server-action request only if the test harness supports it; otherwise unit-test the key predicate and assert the Run button receives focus-safe shortcut text `Run (Ctrl/⌘ Enter)`.

- [ ] **Step 5: Implement toolbar actions**

- Reset sets current language starter and clears output.
- Copy awaits `navigator.clipboard.writeText(code)` and reports `Copied` in a polite status.
- Download creates a Blob, a temporary object URL, an anchor with `download={sourceFilename(language)}`, clicks once, then revokes the URL.
- Clear output returns to idle without altering code.
- Full screen toggles a fixed application panel with `aria-pressed`; Escape exits it.
- Cmd/Ctrl+Enter calls `onRun` only when not running and after hydration.

- [ ] **Step 6: Implement explicit output presentation**

Render one heading and message per state: `Ready`, `Running`, `Run succeeded`, `Compilation failed`, `Runtime failed`, `Execution timed out`, `Runner unavailable`, or `Could not submit`. Render console in `<pre>` and duration as `${durationMs} ms`. Use `role="status"` for running/success and `role="alert"` for failures.

- [ ] **Step 7: Use Lane A's editor template and show exact runtime**

Wrap page content with `EditorPage` and `PageHeader`; the page must not introduce a nested `<main>` inside Lane A's shell landmark. Near language selection render `Runtime: ${lang.compiler}` so the version matches the actual runner registry.

- [ ] **Step 8: Run unit, browser, lint, and type checks**

Run: `pnpm --filter @qa-mastery/platform test -- src/app/'(app)'/simulator/simulator-state.test.ts && pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck && pnpm --filter @qa-mastery/e2e exec playwright test tests/simulator.spec.ts`

Expected: PASS in Chromium and WebKit; all utility controls render and touch fallback remains green.

- [ ] **Step 9: Commit immediate simulator utilities**

```bash
git add apps/platform/src/app/'(app)'/simulator/simulator-state.ts apps/platform/src/app/'(app)'/simulator/simulator-state.test.ts apps/platform/src/app/'(app)'/simulator/simulator-toolbar.tsx apps/platform/src/app/'(app)'/simulator/simulator-output.tsx apps/platform/src/app/'(app)'/simulator/simulator-client.tsx apps/platform/src/app/'(app)'/simulator/page.tsx e2e/tests/simulator.spec.ts
git commit -m "feat(simulator): add utility controls and diagnostics"
```

### Task 7: Replace the Mobile Portfolio Table with Evidence Cards

**Files:**
- Create: `apps/platform/src/app/(app)/portfolio/me/portfolio-results.tsx`
- Create: `apps/platform/src/app/(app)/portfolio/me/portfolio-results.test.tsx`
- Modify: `apps/platform/src/app/(app)/portfolio/me/page.tsx`

**Interfaces:**
- Moves and exports: `BugReportRow` and `severityTone` from the presentation module.
- Produces: `PortfolioResults({ rows: BugReportRow[] })`; mobile and desktop render the same title, location, severity, match result, score, and formatted date.
- The server page remains responsible for Supabase/RLS fetching and aggregate metrics.

- [ ] **Step 1: Write the failing static responsive contract**

```tsx
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PortfolioResults } from "./portfolio-results";

const row = {
  id: "r1", title: "Quantity ignored", page: "Cart", feature: "Total",
  severity: "major", matched: true, score: 85, created_at: "2026-07-26T00:00:00.000Z",
};

it("renders identical evidence in mobile cards and desktop table", () => {
  const html = renderToStaticMarkup(<PortfolioResults rows={[row]} />);
  expect(html).toContain('data-testid="portfolio-cards"');
  expect(html).toContain('data-testid="portfolio-table"');
  expect(html.match(/Quantity ignored/g)).toHaveLength(2);
  expect(html.match(/Cart · Total/g)).toHaveLength(2);
  expect(html.match(/85/g)).toHaveLength(2);
});
```

- [ ] **Step 2: Run the test and observe the missing component**

Run: `pnpm --filter @qa-mastery/platform test -- src/app/'(app)'/portfolio/me/portfolio-results.test.tsx`

Expected: FAIL because `portfolio-results.tsx` does not exist.

- [ ] **Step 3: Extract deterministic presentation**

Render cards in `md:hidden` and the table in `hidden md:block`. Each card uses a `<dl>` with terms `Location`, `Severity`, `Result`, `Score`, and `Date`; the desktop remains a semantic `<table>`. Use one `formatPortfolioDate(iso)` helper with locale `en-GB` so server/client output is deterministic.

- [ ] **Step 4: Keep data access in the Server Component**

Leave `createSupabaseServerClient`, the RLS query, matched count, total score, and empty state in `page.tsx`. Replace only the non-empty table block with `<PortfolioResults rows={rows} />`.

- [ ] **Step 5: Run portfolio, platform, and 320px reflow tests**

Run: `pnpm --filter @qa-mastery/platform test -- src/app/'(app)'/portfolio/me/portfolio-results.test.tsx && pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck && pnpm --filter @qa-mastery/e2e exec playwright test tests/reflow-forced-colors.spec.ts --project=chromium --grep "reflow"`

Expected: PASS; portfolio causes no document-level horizontal overflow at 320px.

- [ ] **Step 6: Commit responsive evidence presentation**

```bash
git add apps/platform/src/app/'(app)'/portfolio/me/portfolio-results.tsx apps/platform/src/app/'(app)'/portfolio/me/portfolio-results.test.tsx apps/platform/src/app/'(app)'/portfolio/me/page.tsx
git commit -m "fix(portfolio): render mobile evidence cards"
```

### Task 8: Complete Learning-Tool Verification and Handoff

**Files:**
- No new source files.

**Interfaces:**
- Produces: a clean lane diff and reproducible focused evidence for integration.

- [ ] **Step 1: Confirm the lane touched only its allowed surfaces**

Run `git diff --name-only codex/qa-mastery-remediation-program...HEAD` after rebasing onto the latest recorded integration checkpoint.

Expected: only note completion/copy files, simulator/grading files, portfolio presentation files, marketing copy files, and the named E2E tests; no workflow, migration, shell, dropdown, community, manifest, or lockfile change.

- [ ] **Step 2: Run grading and platform unit verification**

Run: `pnpm --filter @qa-mastery/grading test && pnpm --filter @qa-mastery/grading typecheck && pnpm --filter @qa-mastery/platform test && pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck`

Expected: all commands exit 0.

- [ ] **Step 3: Build the platform production bundle**

Run: `pnpm --filter @qa-mastery/platform build`

Expected: exit 0; `/notes`, `/simulator`, `/portfolio/me`, and `/api/notes/complete` appear without client/server-boundary errors.

- [ ] **Step 4: Run all affected browser journeys**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/notes.spec.ts tests/notes-v2.spec.ts tests/simulator.spec.ts tests/reflow-forced-colors.spec.ts`

Expected: PASS in Chromium and WebKit; E2E does not contact Wandbox.

- [ ] **Step 5: Record lane handoff evidence**

```text
Base commit:
Head commit:
Owned-path diff:
Grading tests:
Platform tests:
Lint:
Typecheck:
Production build:
Chromium notes/simulator/reflow:
WebKit notes/simulator/reflow:
Live Wandbox contacted by E2E: no
Lane A celebration/template checkpoint:
Lane B Term extraction checkpoint:
Known Wave 3 boundary: no server snippet persistence or personal-note editor was added.
```
