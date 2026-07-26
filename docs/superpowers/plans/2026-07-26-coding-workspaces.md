# Coding Workspaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the temporary coding simulator into persistent private workspaces with autosave, recent files, snapshots, forking, revocable sharing, standard input, custom tests, structured output, parsed diagnostics, and lesson/skill associations.

**Architecture:** Owner-scoped workspace, test-case, and snapshot tables hold learner-created artifacts while the existing service-role `code_runs` path remains the authoritative execution ledger. Thin actions validate ownership before every save/run/snapshot/share operation; the editor stores a browser recovery draft until an optimistic version save succeeds. Public shared pages use a server-only token lookup that projects read-only fields and never opens table RLS.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Monaco Editor, Supabase/PostgreSQL RLS, Zod 4, Wandbox runner, Vitest, Testing Library, Playwright.

## Global Constraints

- Base this lane on the verified Wave 2 checkpoint containing the mobile textarea fallback and shared editor controls.
- The integration governor owns `pnpm-lock.yaml`, package manifests, dashboard/navigation files, and migration sequencing. This feature adds no npm dependency.
- This plan owns `supabase/migrations/20260726000037_code_workspaces.sql`, `packages/db/test/code-workspaces-rls.test.ts`, `apps/platform/src/lib/code-workspaces/**`, `apps/platform/src/app/(app)/simulator/**`, `apps/platform/src/app/shared/code/**`, `packages/grading/src/wandbox-runner.ts`, `packages/grading/test/wandbox-runner.test.ts`, and `e2e/tests/coding-workspaces.spec.ts`.
- Migration number `20260726000037` is reserved for this subsystem. It depends on `20260726000036` only by ordering, not by foreign key or runtime behavior.
- Obtain an integration lock before changing `apps/platform/src/app/(app)/simulator/actions.ts`, `simulator-client.tsx`, or `packages/grading/src/wandbox-runner.ts`; no other lane may edit them concurrently.
- Follow the installed Next.js 16 data-security, authentication, mutation, Route Handler, dynamic-route, and revalidation guides named in the personal-notes plan.
- Re-authenticate in every action. For service-role execution writes, first prove `code_workspaces.owner_id` equals the authenticated user; a UUID supplied by the browser is never proof of ownership.
- Exact limits: 200 workspaces per user, title 1–120, source 1–10,000, stdin 0–10,000, at most 20 custom tests, test name 1–80, expected output 0–10,000, and snapshot label 1–80.
- Supported language IDs remain exactly `java`, `python`, `javascript`, `typescript`, and `csharp`; use `isSimulatorLanguage()` for server validation.
- Autosave idle delay is 700 ms. Recovery key is `qa-mastery:code-workspace:<clientId>` and survives failed or conflicting saves.
- A workspace share token is a UUID bearer secret. Shared pages expose title, language, source, stdin only when the owner explicitly includes it, lesson/skill labels, and updated time; they never expose owner ID, custom expected outputs, snapshots, run history, or the token in serialized props.
- Code execution retains the existing shared quota of 100 runs per UTC day and 10-second interactive cooldown. Running one custom test is one run; there is no “run all” button in this increment.
- Standard input is forwarded as Wandbox `stdin`; it is never interpolated into source text.
- Diagnostics are advisory parsing of runner text. They do not rewrite code or claim a guaranteed compiler fix.
- Multi-file projects, package installation, GitHub export, real-time collaboration, debugger state, container orchestration, and portfolio publishing are excluded from this increment.
- Do not push, merge, deploy, or edit another lane's migration.

---

## File Structure

```text
supabase/migrations/20260726000037_code_workspaces.sql
packages/db/test/code-workspaces-rls.test.ts
packages/grading/src/wandbox-runner.ts
packages/grading/test/wandbox-runner.test.ts
apps/platform/src/lib/code-workspaces/
  schema.ts                 # Zod inputs
  types.ts                  # narrow DTOs, output and diagnostic types
  data.ts                   # server-only owner/public token reads
  diagnostics.ts            # pure compiler diagnostic parser
apps/platform/src/app/(app)/simulator/
  actions.ts                # execution plus workspace actions
  page.tsx                  # recent workspace landing
  workspace-list.tsx        # create/open/fork controls
  [workspaceId]/page.tsx    # owner-only dynamic editor page
  [workspaceId]/workspace-editor.tsx
  [workspaceId]/test-cases-panel.tsx
  [workspaceId]/snapshots-panel.tsx
  output-panel.tsx
apps/platform/src/app/shared/code/[token]/page.tsx
e2e/tests/coding-workspaces.spec.ts
```

### Task 1: Add Workspace Tables, Atomic Saves, and RLS Tests

**Files:**
- Create: `supabase/migrations/20260726000037_code_workspaces.sql`
- Create: `packages/db/test/code-workspaces-rls.test.ts`

**Interfaces:**
- Consumes: `public.profiles`, `public.code_runs`, `public.set_updated_at()`.
- Produces: `public.code_workspaces`, `public.code_workspace_test_cases`, `public.code_workspace_snapshots`, `public.save_code_workspace(...)`, and nullable `code_runs.workspace_id`, `code_runs.duration_ms`, `code_runs.stdin`.

- [ ] **Step 1: Write the failing RLS regression**

Create the same two-user harness used by `packages/db/test/community-rls.test.ts`, then add these exact assertions:

```ts
it("lets only the owner save a workspace and its tests", async () => {
  const saved = await alice.rpc("save_code_workspace", {
    p_id: null, p_client_id: randomUUID(), p_title: "API parser", p_language: "typescript",
    p_source: "console.log('ok')", p_stdin: "", p_lesson_slug: null,
    p_skill_key: "api-testing", p_expected_version: 0,
  });
  expect(saved.error).toBeNull();
  workspaceId = saved.data![0].id as string;
  expect((await bob.from("code_workspaces").select("id").eq("id", workspaceId)).data ?? []).toHaveLength(0);
  const forged = await bob.from("code_workspace_test_cases").insert({
    workspace_id: workspaceId, owner_id: bobId, name: "steal", stdin: "", expected_output: "ok", order_index: 0,
  });
  expect(forged.error).not.toBeNull();
});

it("rejects a stale workspace save", async () => {
  const stale = await alice.rpc("save_code_workspace", {
    p_id: workspaceId, p_client_id: randomUUID(), p_title: "stale", p_language: "typescript",
    p_source: "console.log('stale')", p_stdin: "", p_lesson_slug: null,
    p_skill_key: null, p_expected_version: 0,
  });
  expect(stale.error?.message).toContain("code_workspace_version_conflict");
});
```

- [ ] **Step 2: Run the focused test and confirm missing relations**

Run: `pnpm --filter @qa-mastery/db test:rls -- code-workspaces-rls.test.ts`

Expected: FAIL because `code_workspaces` and `save_code_workspace` do not exist.

- [ ] **Step 3: Create the migration**

```sql
-- supabase/migrations/20260726000037_code_workspaces.sql
create table public.code_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null,
  title text not null check (char_length(title) between 1 and 120),
  language text not null check (language in ('java','python','javascript','typescript','csharp')),
  source text not null check (char_length(source) between 1 and 10000),
  stdin text not null default '' check (char_length(stdin) <= 10000),
  lesson_slug text check (lesson_slug is null or char_length(lesson_slug) between 3 and 160),
  skill_key text check (skill_key is null or skill_key ~ '^[a-z0-9-]{2,64}$'),
  forked_from_id uuid references public.code_workspaces(id) on delete set null,
  version bigint not null default 1 check (version > 0),
  share_token uuid unique,
  shared_at timestamptz,
  include_stdin_in_share boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, client_id),
  check ((share_token is null) = (shared_at is null))
);

create table public.code_workspace_test_cases (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.code_workspaces(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  stdin text not null default '' check (char_length(stdin) <= 10000),
  expected_output text not null default '' check (char_length(expected_output) <= 10000),
  order_index smallint not null default 0 check (order_index between 0 and 19),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, order_index)
);

create table public.code_workspace_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.code_workspaces(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  language text not null check (language in ('java','python','javascript','typescript','csharp')),
  source text not null check (char_length(source) between 1 and 10000),
  stdin text not null default '' check (char_length(stdin) <= 10000),
  created_at timestamptz not null default now()
);

alter table public.code_runs add column workspace_id uuid references public.code_workspaces(id) on delete set null;
alter table public.code_runs add column duration_ms integer check (duration_ms is null or duration_ms >= 0);
alter table public.code_runs add column stdin text check (stdin is null or char_length(stdin) <= 10000);

create index code_workspaces_owner_updated on public.code_workspaces(owner_id, updated_at desc);
create index code_workspace_tests_workspace on public.code_workspace_test_cases(workspace_id, order_index);
create index code_workspace_snapshots_workspace on public.code_workspace_snapshots(workspace_id, created_at desc);
create index code_runs_workspace_created on public.code_runs(workspace_id, created_at desc) where workspace_id is not null;

create trigger code_workspaces_updated_at before update on public.code_workspaces
for each row execute function public.set_updated_at();
create trigger code_workspace_tests_updated_at before update on public.code_workspace_test_cases
for each row execute function public.set_updated_at();

alter table public.code_workspaces enable row level security;
alter table public.code_workspace_test_cases enable row level security;
alter table public.code_workspace_snapshots enable row level security;

create policy "owners manage code workspaces" on public.code_workspaces for all
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "owners manage workspace tests" on public.code_workspace_test_cases for all
  using ((select auth.uid()) = owner_id and exists (
    select 1 from public.code_workspaces w where w.id = workspace_id and w.owner_id = auth.uid()
  )) with check ((select auth.uid()) = owner_id and exists (
    select 1 from public.code_workspaces w where w.id = workspace_id and w.owner_id = auth.uid()
  ));
create policy "owners read workspace snapshots" on public.code_workspace_snapshots for select
  using ((select auth.uid()) = owner_id);
create policy "owners insert workspace snapshots" on public.code_workspace_snapshots for insert
  with check ((select auth.uid()) = owner_id and exists (
    select 1 from public.code_workspaces w where w.id = workspace_id and w.owner_id = auth.uid()
  ));
create policy "owners delete workspace snapshots" on public.code_workspace_snapshots for delete
  using ((select auth.uid()) = owner_id);
```

Append `save_code_workspace` as a `security invoker` PL/pgSQL function matching the personal-note compare-and-swap pattern, with these differences: validate the five language IDs, enforce the 200-row owner limit on insert, save no automatic snapshot, increment `version`, and raise `code_workspace_version_conflict` with SQLSTATE `40001`. Return `(id uuid, version bigint, updated_at timestamptz)` and grant execute only to `authenticated`.

- [ ] **Step 4: Reset and prove database behavior**

Run: `pnpm db:reset`

Expected: migrations through `0037` apply.

Run: `pnpm --filter @qa-mastery/db test:rls -- code-workspaces-rls.test.ts rls-coverage.test.ts`

Expected: PASS with all three tables covered and no exemption.

- [ ] **Step 5: Commit the schema**

```bash
git add supabase/migrations/20260726000037_code_workspaces.sql packages/db/test/code-workspaces-rls.test.ts
git commit -m "feat(simulator): add persistent workspace schema"
```

### Task 2: Add Workspace Validation and Diagnostic Parsing

**Files:**
- Create: `apps/platform/src/lib/code-workspaces/schema.ts`
- Create: `apps/platform/src/lib/code-workspaces/types.ts`
- Create: `apps/platform/src/lib/code-workspaces/diagnostics.ts`
- Create: `apps/platform/src/lib/code-workspaces/diagnostics.test.ts`

**Interfaces:**
- Produces: `CodeWorkspaceInputSchema`, `WorkspaceTestCaseInputSchema`, `CodeWorkspaceDTO`, `WorkspaceRunView`, `CompilerDiagnostic`, `parseCompilerDiagnostics()`.
- Consumes: `isSimulatorLanguage()` and `RunResult` from `@qa-mastery/grading`.

- [ ] **Step 1: Write failing diagnostic tests**

```ts
import { describe, expect, it } from "vitest";
import { parseCompilerDiagnostics } from "./diagnostics";

describe("parseCompilerDiagnostics", () => {
  it("parses Java and TypeScript line/column diagnostics", () => {
    expect(parseCompilerDiagnostics("java", "prog.java:7: error: ';' expected")).toEqual([
      { line: 7, column: null, severity: "error", message: "';' expected" },
    ]);
    expect(parseCompilerDiagnostics("typescript", "prog.ts(3,9): error TS2322: Type 'string' is not assignable")).toEqual([
      { line: 3, column: 9, severity: "error", message: "TS2322: Type 'string' is not assignable" },
    ]);
  });

  it("returns an empty list for ordinary console output", () => {
    expect(parseCompilerDiagnostics("python", "Hello, QA!")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test and confirm the missing module**

Run: `pnpm --filter @qa-mastery/platform test -- src/lib/code-workspaces/diagnostics.test.ts`

Expected: FAIL because `diagnostics.ts` does not exist.

- [ ] **Step 3: Implement exact schemas and DTOs**

```ts
import { z } from "zod";
import { SIMULATOR_LANGUAGE_IDS } from "@qa-mastery/grading";
const Language = z.enum(SIMULATOR_LANGUAGE_IDS as [string, ...string[]]);
export const CodeWorkspaceInputSchema = z.object({
  id: z.string().uuid().nullable(), clientId: z.string().uuid(),
  title: z.string().trim().min(1).max(120), language: Language,
  source: z.string().min(1).max(10_000), stdin: z.string().max(10_000),
  lessonSlug: z.string().regex(/^[a-z0-9-]+(?:\/[a-z0-9-]+){0,2}$/).nullable(),
  skillKey: z.string().regex(/^[a-z0-9-]{2,64}$/).nullable(), expectedVersion: z.number().int().min(0),
});
export const WorkspaceTestCaseInputSchema = z.object({
  id: z.string().uuid().nullable(), workspaceId: z.string().uuid(),
  name: z.string().trim().min(1).max(80), stdin: z.string().max(10_000),
  expectedOutput: z.string().max(10_000), orderIndex: z.number().int().min(0).max(19),
});
```

Define DTOs with camelCase names and no `ownerId` or `shareToken`; `WorkspaceRunView` is `{ kind: "success" | "compile_error" | "runtime_error" | "timeout" | "infrastructure_error"; console: string; durationMs: number; diagnostics: CompilerDiagnostic[]; expected?: string; matchedExpected?: boolean }`.

- [ ] **Step 4: Implement conservative regex parsing**

`parseCompilerDiagnostics(language, text)` splits lines and recognizes only:

```ts
const JAVA = /^(?:[^:]+):(\d+):\s*(error|warning):\s*(.+)$/;
const TS = /^(?:[^()]+)\((\d+),(\d+)\):\s*(error|warning)\s+(.+)$/;
const PYTHON_LINE = /^\s*File "[^"]+", line (\d+)/;
```

Python combines the last `File` line with the final non-empty exception line. Unrecognized lines remain in `console` and are not fabricated as diagnostics.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm --filter @qa-mastery/platform test -- src/lib/code-workspaces/diagnostics.test.ts`

Expected: PASS.

```bash
git add apps/platform/src/lib/code-workspaces
git commit -m "feat(simulator): define workspace and diagnostic contracts"
```

### Task 3: Forward Standard Input Through the Runner

**Files:**
- Modify: `packages/grading/src/wandbox-runner.ts:27-102`
- Modify: `packages/grading/test/wandbox-runner.test.ts:1-80`

**Interfaces:**
- Consumes: optional `request.payload.stdin` string.
- Produces: Wandbox request JSON `{ compiler, code, stdin }` without source interpolation.

- [ ] **Step 1: Add the failing runner test**

```ts
it("forwards stdin as a separate Wandbox field", async () => {
  const fetchMock = mockWandbox({ status: "0", program_output: "hello" });
  vi.stubGlobal("fetch", fetchMock);
  await new WandboxRunner().executeSync({
    lessonSlug: "simulator", userId: "u1",
    payload: { code: "print(input())", language: "python", stdin: "hello\n" },
  });
  const sent = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
  expect(sent).toMatchObject({ stdin: "hello\n" });
  expect(sent.code).toBe("print(input())");
});
```

- [ ] **Step 2: Run and verify the red result**

Run: `pnpm --filter @qa-mastery/grading test -- wandbox-runner.test.ts`

Expected: FAIL because `stdin` is absent from the request body.

- [ ] **Step 3: Add the separate field**

```ts
const stdin = String(request.payload.stdin ?? "");
body: JSON.stringify({ compiler: lang.compiler, code: source, stdin }),
```

- [ ] **Step 4: Run grading tests**

Run: `pnpm --filter @qa-mastery/grading test -- wandbox-runner.test.ts simulator-languages.test.ts runner.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit runner support**

```bash
git add packages/grading/src/wandbox-runner.ts packages/grading/test/wandbox-runner.test.ts
git commit -m "feat(grading): forward simulator standard input"
```

### Task 4: Build the Server-Only Workspace DAL and Actions

**Files:**
- Create: `apps/platform/src/lib/code-workspaces/data.ts`
- Modify: `apps/platform/src/app/(app)/simulator/actions.ts`
- Create: `apps/platform/src/app/(app)/simulator/actions.test.ts`

**Interfaces:**
- Produces: `listCodeWorkspaces()`, `getOwnedCodeWorkspace()`, `getSharedCodeWorkspace()`, `saveCodeWorkspaceAction()`, `deleteCodeWorkspaceAction()`, `forkCodeWorkspaceAction()`, `createWorkspaceSnapshotAction()`, `restoreWorkspaceSnapshotAction()`, `upsertWorkspaceTestCaseAction()`, `deleteWorkspaceTestCaseAction()`, `setWorkspaceSharingAction()`, `runWorkspaceCodeAction()`.
- Consumes: Task 1 RPC, Task 2 schemas/diagnostics, Task 3 runner stdin.

- [ ] **Step 1: Write a failing pure run-classification test**

```ts
import { describe, expect, it } from "vitest";
import { toWorkspaceRunView } from "./actions";
it("classifies runner availability separately from compiler failure", () => {
  expect(toWorkspaceRunView("python", { status: "unavailable", passed: false, console: "rate limited", artifacts: [], staticChecks: [] }, 42).kind).toBe("infrastructure_error");
  expect(toWorkspaceRunView("java", { status: "failed", passed: false, console: "prog.java:2: error: ';' expected", artifacts: [], staticChecks: [] }, 42).kind).toBe("compile_error");
});
```

- [ ] **Step 2: Run and confirm the missing export**

Run: `pnpm --filter @qa-mastery/platform test -- 'src/app/(app)/simulator/actions.test.ts'`

Expected: FAIL because `toWorkspaceRunView` does not exist.

- [ ] **Step 3: Add `server-only` reads and narrow DTO mapping**

`data.ts` uses the request-scoped client for owner reads and a service client only for `getSharedCodeWorkspace(token)`. The public DTO includes `stdin` only when `include_stdin_in_share` is true. All dynamic IDs and tokens pass `z.string().uuid()` before a database query.

- [ ] **Step 4: Refactor execution to one shared internal function**

Keep `runSimulatorCode(language, code)` for existing note playgrounds. Add:

```ts
export async function runWorkspaceCodeAction(input: {
  workspaceId: string; source: string; stdin: string; testCaseId?: string;
}): Promise<WorkspaceRunView>;
```

Inside it: authenticate; select `id,owner_id,language` through the service client; reject non-owner; validate source/stdin; load a test only with both `id` and `workspace_id`; enforce quota/cooldown; measure `performance.now()` around `wandbox.executeSync`; insert `code_runs` with `workspace_id`, `stdin`, and rounded `duration_ms`; compare `result.console.trimEnd()` to `expected_output.trimEnd()` when a test is selected; return `toWorkspaceRunView()`.

- [ ] **Step 5: Implement owner-scoped artifact actions**

All mutation inputs use Task 2 schemas. Forking reads the source workspace through owner RLS or the public token projection, creates a new private row with a fresh `client_id`, sets `forked_from_id`, and never copies share state, snapshots, or tests. Snapshot creation copies current owner row into `code_workspace_snapshots`; restore calls the atomic save RPC with the current version.

- [ ] **Step 6: Run tests and commit**

Run: `pnpm --filter @qa-mastery/platform test -- 'src/app/(app)/simulator/actions.test.ts'`

Expected: PASS.

Run: `pnpm --filter @qa-mastery/platform typecheck`

Expected: PASS.

```bash
git add apps/platform/src/lib/code-workspaces/data.ts 'apps/platform/src/app/(app)/simulator/actions.ts' 'apps/platform/src/app/(app)/simulator/actions.test.ts'
git commit -m "feat(simulator): add secure workspace actions"
```

### Task 5: Build Recent Workspaces and the Persistent Editor

**Files:**
- Modify: `apps/platform/src/app/(app)/simulator/page.tsx`
- Create: `apps/platform/src/app/(app)/simulator/workspace-list.tsx`
- Create: `apps/platform/src/app/(app)/simulator/[workspaceId]/page.tsx`
- Create: `apps/platform/src/app/(app)/simulator/[workspaceId]/workspace-editor.tsx`
- Create: `apps/platform/src/app/(app)/simulator/output-panel.tsx`
- Replace: `apps/platform/src/app/(app)/simulator/simulator-client.tsx` with a compatibility redirect/create surface after the workspace editor is green
- Create: `apps/platform/src/app/(app)/simulator/[workspaceId]/workspace-editor.test.tsx`

**Interfaces:**
- Consumes: Task 4 list/get/save/run actions and Wave 2 Monaco/mobile fallback.
- Produces: recent list, named workspace editor, 700 ms autosave, reset/copy/download/clear/fullscreen, Cmd/Ctrl+Enter, and structured output tabs.

- [ ] **Step 1: Write failing keyboard and recovery tests**

```tsx
// @vitest-environment jsdom
it("runs on Mod+Enter and preserves a failed-save recovery draft", async () => {
  const save = vi.fn().mockResolvedValue({ ok: false, code: "save_failed", message: "offline" });
  const run = vi.fn().mockResolvedValue({ kind: "success", console: "ok", durationMs: 12, diagnostics: [] });
  render(<WorkspaceEditor initial={workspace} saveAction={save} runAction={run} />);
  await userEvent.type(screen.getByLabelText("Code editor fallback"), "\n// changed");
  fireEvent.keyDown(window, { key: "Enter", metaKey: true });
  await waitFor(() => expect(run).toHaveBeenCalledOnce());
  await vi.advanceTimersByTimeAsync(700);
  expect(screen.getByText("Offline — draft kept on this device")).toBeVisible();
  expect(localStorage.getItem(`qa-mastery:code-workspace:${workspace.clientId}`)).toContain("changed");
});
```

- [ ] **Step 2: Run and verify the red state**

Run: `pnpm --filter @qa-mastery/platform test -- 'src/app/(app)/simulator/[workspaceId]/workspace-editor.test.tsx'`

Expected: FAIL because `WorkspaceEditor` is absent.

- [ ] **Step 3: Add recent workspace creation and routing**

The simulator landing Server Component calls `listCodeWorkspaces()`. `WorkspaceList` creates from the selected language's existing `starter`, accepts a name, and links recent rows to `/simulator/<uuid>`. Empty state creates “My first workspace”; no auto-created database row occurs during render.

- [ ] **Step 4: Add the owner-only dynamic editor page**

Await `params`, validate `workspaceId` as UUID, call `getOwnedCodeWorkspace`, and use `notFound()` for missing or unauthorized records. Pass only the DTO to the Client Component.

- [ ] **Step 5: Implement editor utilities and structured output**

Reset restores the selected language starter after confirmation; Copy uses `navigator.clipboard.writeText`; Download creates a Blob with extensions `.java`, `.py`, `.js`, `.ts`, `.cs`; Clear only clears output; Fullscreen uses the Fullscreen API with an inline unsupported message; Cmd/Ctrl+Enter calls `runWorkspaceCodeAction`. `OutputPanel` has Console, Diagnostics, and Tests tabs, announces completion with `role="status"`, and focuses a diagnostic by calling Monaco `revealLineInCenter(line)` plus `setPosition({ lineNumber: line, column: column ?? 1 })`.

- [ ] **Step 6: Run interaction and static checks**

Run: `pnpm --filter @qa-mastery/platform test -- 'src/app/(app)/simulator/[workspaceId]/workspace-editor.test.tsx'`

Expected: PASS.

Run: `pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck`

Expected: both exit 0.

- [ ] **Step 7: Commit the persistent editor**

```bash
git add 'apps/platform/src/app/(app)/simulator'
git commit -m "feat(simulator): add persistent coding workspace editor"
```

### Task 6: Add Custom Tests, Snapshots, Forking, and Sharing

**Files:**
- Create: `apps/platform/src/app/(app)/simulator/[workspaceId]/test-cases-panel.tsx`
- Create: `apps/platform/src/app/(app)/simulator/[workspaceId]/snapshots-panel.tsx`
- Create: `apps/platform/src/app/shared/code/[token]/page.tsx`
- Modify: `apps/platform/src/app/(app)/simulator/[workspaceId]/workspace-editor.tsx`
- Create: `e2e/tests/coding-workspaces.spec.ts`

**Interfaces:**
- Consumes: Task 4 artifact/share/run actions.
- Produces: test-case expected/actual comparison, named snapshots and restore, private forks, anonymous read-only shared code.

- [ ] **Step 1: Write the failing browser journey**

```ts
test("persists, tests, snapshots, and revokes a shared workspace", async ({ page, browser }) => {
  await signUpFreshLearner(page, "workspace");
  await page.goto("/simulator");
  await page.getByLabel("Workspace name").fill("Input echo");
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(/\/simulator\/[0-9a-f-]{36}$/);
  await page.getByLabel("Standard input").fill("hello");
  await expect(page.getByText("Saved")).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Create snapshot" }).click();
  await page.getByLabel("Snapshot label").fill("before parser");
  await page.getByRole("button", { name: "Save snapshot" }).click();
  await expect(page.getByText("before parser")).toBeVisible();
  await page.getByRole("button", { name: "Enable sharing" }).click();
  const url = await page.getByLabel("Share URL").inputValue();
  const anonymous = await browser.newPage();
  await anonymous.goto(url);
  await expect(anonymous.getByRole("heading", { name: "Input echo" })).toBeVisible();
  await expect(anonymous.getByRole("button", { name: "Fork workspace" })).toBeVisible();
  await anonymous.close();
  await page.getByRole("button", { name: "Disable sharing" }).click();
  const revoked = await browser.newPage();
  await revoked.goto(url);
  await expect(revoked.getByRole("heading", { name: /not found/i })).toBeVisible();
});
```

- [ ] **Step 2: Run and confirm missing UI**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/coding-workspaces.spec.ts --project=chromium`

Expected: FAIL at workspace creation or snapshot controls.

- [ ] **Step 3: Implement custom test management**

`TestCasesPanel` lists at most 20 owner rows, enforces unique order indexes, edits name/stdin/expected output, and runs exactly one selected test through `runWorkspaceCodeAction`. It displays Expected and Actual with whitespace-preserving `<pre>` elements and an explicit Pass/Fail badge based on trimmed trailing whitespace comparison.

- [ ] **Step 4: Implement snapshot and fork controls**

Snapshots require a label, show immutable creation time, and restore only after confirmation. Owner fork creates a new workspace titled `Copy of <title>` with a new `client_id`. Shared-page fork redirects anonymous users to `/login?next=<encoded shared URL>`; an authenticated fork produces a private workspace and never inherits share state.

- [ ] **Step 5: Implement the token-projected shared page**

Await and UUID-validate `params.token`; call `getSharedCodeWorkspace`; use `notFound()` on absent/revoked tokens. Render source read-only, include stdin only when allowed, and show language/runtime labels from `findSimulatorLanguage()`. Never instantiate Monaco on the public page; use `<pre><code>` to reduce bundle size.

- [ ] **Step 6: Run E2E and commit**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/coding-workspaces.spec.ts tests/simulator.spec.ts --project=chromium`

Expected: PASS; legacy simulator route still creates/opens a workspace and the shared token revokes.

```bash
git add 'apps/platform/src/app/(app)/simulator/[workspaceId]' apps/platform/src/app/shared/code e2e/tests/coding-workspaces.spec.ts
git commit -m "feat(simulator): add tests snapshots forks and sharing"
```

### Task 7: Integrate Navigation and Run the Full Gate

**Files:**
- Governor modify: authenticated `Practice` navigation configuration
- Governor modify: `apps/platform/src/app/(app)/dashboard/components/hub-grid.tsx`
- Modify: `e2e/tests/coding-workspaces.spec.ts`

**Interfaces:**
- Produces: “Coding workspaces” navigation at `/simulator` and a recent-work link from the dashboard.

- [ ] **Step 1: Add a navigation assertion**

Assert the Wave 2 Practice group and dashboard each expose a link named “Coding workspaces” with `href="/simulator"`; keep `/simulator` route compatibility.

- [ ] **Step 2: Transfer the two shared-file locks to the governor**

The feature lane supplies the exact link label, href, description “Saved browser workspaces for automation practice”, and recent-work count DTO; the governor applies the shared-shell changes after all other shell lanes release locks.

- [ ] **Step 3: Run the complete subsystem gate**

```bash
pnpm db:reset
pnpm --filter @qa-mastery/db test:rls
pnpm --filter @qa-mastery/grading test
pnpm --filter @qa-mastery/platform test
pnpm --filter @qa-mastery/platform lint
pnpm --filter @qa-mastery/platform typecheck
pnpm --filter @qa-mastery/platform build
pnpm --filter @qa-mastery/e2e exec playwright test tests/coding-workspaces.spec.ts tests/simulator.spec.ts --project=chromium
git diff --check
```

Expected: all commands exit 0; three new tables pass RLS coverage; a second user cannot read or mutate a workspace; runner stdin remains separate from source; public links project only allowed fields; failed saves retain browser drafts; run quota and cooldown remain enforced.

- [ ] **Step 4: Commit governor navigation after integration**

```bash
git add apps/platform/src/app/(app)/dashboard/components/hub-grid.tsx apps/platform/src/components/nav e2e/tests/coding-workspaces.spec.ts
git commit -m "feat(simulator): surface coding workspaces"
```

- [ ] **Step 5: Record the handoff**

Record migration `0037`, commits, exact test outputs, runner request evidence with stdin redacted, public DTO review, changed paths, and exclusions in the lane ledger. Leave status `review` for governor integration.
