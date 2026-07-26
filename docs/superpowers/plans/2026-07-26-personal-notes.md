# Personal Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a private, searchable personal-note workspace attached to Knowledge Base topics, with safe Markdown, conflict-aware autosave, local recovery, tags, favorites, version history, templates, read-only sharing, and Markdown/JSON export.

**Architecture:** `personal_notes` is learner-authored data protected by owner-only RLS; a SQL RPC performs compare-and-swap saves and version snapshots atomically. Thin Server Actions call a `server-only` data-access module, while the client editor maintains a browser recovery draft until the server confirms the same revision. User Markdown is rendered with `react-markdown` and `remark-gfm` without raw HTML or MDX evaluation.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase/PostgreSQL RLS, Zod 4, React Markdown, remark-gfm, Vitest, Testing Library, Playwright.

## Global Constraints

- Base this lane on the verified Wave 2 integration checkpoint, not an open stacked PR branch.
- The integration governor owns `pnpm-lock.yaml`, `apps/platform/package.json`, dashboard/navigation files, and migration ordering; the feature lane submits exact integration requests for those paths.
- This plan owns `supabase/migrations/20260726000036_personal_notes.sql`, `packages/db/test/personal-notes-rls.test.ts`, `apps/platform/src/lib/personal-notes/**`, `apps/platform/src/app/(app)/my-notes/**`, `apps/platform/src/app/shared/notes/**`, `apps/platform/src/app/api/my-notes/export/route.ts`, `apps/platform/src/app/(app)/notes/[module]/[chapter]/[topic]/personal-notes-panel.tsx`, and `e2e/tests/personal-notes.spec.ts`.
- The only shared Knowledge Base edit is the topic-page insertion in `apps/platform/src/app/(app)/notes/[module]/[chapter]/[topic]/page.tsx`; acquire that file lock before editing.
- Migration number `20260726000036` is reserved for this subsystem. Do not rename it or add another migration.
- Every Server Action is a public POST entry point: authenticate inside the action or its DAL, validate every argument, re-check record ownership, and return a narrow DTO.
- Follow the installed Next.js 16 guides `01-app/01-getting-started/07-mutating-data.md`, `01-app/01-getting-started/15-route-handlers.md`, `01-app/02-guides/data-security.md`, `01-app/02-guides/authentication.md`, `01-app/03-api-reference/03-file-conventions/dynamic-routes.md`, and `01-app/03-api-reference/04-functions/revalidatePath.md`.
- Dynamic route `params` are promises and must be awaited. Route Handlers and Server Actions authenticate independently of the authenticated layout.
- Never send a service-role client, database record, share token for another record, or private version history to a Client Component.
- Never compile learner content with MDX, `next-mdx-remote`, `dangerouslySetInnerHTML`, or a raw-HTML Markdown plugin.
- Editor limits are exact: title 1–160 characters, body 0–100,000 characters, at most 10 normalized tags of 2–32 characters, and at most 500 notes per learner.
- A share token is a 128-bit UUID bearer secret. Revoking sharing clears both `share_token` and `shared_at`; shared pages expose title, rendered body, tags, source backlink, and updated time only.
- Autosave uses a 700 ms idle debounce. Browser recovery key is `qa-mastery:personal-note:<clientId>` and is deleted only after the server acknowledges the saved version.
- Attachments, audio, Mermaid execution, collaborative editing, PDF generation, OCR, drawing, and handwriting are excluded from this increment. Markdown print styling supports browser “Save as PDF” without introducing a server PDF renderer.
- Do not push, merge, deploy, alter branch protection, or edit another lane's migration.

---

## File Structure

```text
supabase/migrations/20260726000036_personal_notes.sql
packages/db/test/personal-notes-rls.test.ts
apps/platform/src/lib/personal-notes/
  schema.ts                 # Zod inputs and exported inferred types
  types.ts                  # Narrow client DTOs and conflict result
  data.ts                   # server-only reads and atomic RPC writes
  templates.ts              # immutable note template catalog
apps/platform/src/app/(app)/my-notes/
  actions.ts                # thin authenticated actions and revalidation
  page.tsx                  # server-loaded personal-note index
  notes-workspace.tsx       # search, favorites, tags, create controls
  [id]/page.tsx             # owner-only editor page
  [id]/note-editor.tsx      # debounced save and local recovery
  [id]/history-panel.tsx    # version list and restore controls
apps/platform/src/app/(app)/notes/[module]/[chapter]/[topic]/
  personal-notes-panel.tsx  # topic annotations and create link
apps/platform/src/app/shared/notes/[token]/page.tsx
apps/platform/src/app/api/my-notes/export/route.ts
e2e/tests/personal-notes.spec.ts
```

### Task 1: Create the Personal-Note Schema and Prove RLS

**Files:**
- Create: `supabase/migrations/20260726000036_personal_notes.sql`
- Create: `packages/db/test/personal-notes-rls.test.ts`

**Interfaces:**
- Consumes: `public.profiles(id)`, `public.set_updated_at()`, `auth.uid()`.
- Produces: `public.personal_notes`, `public.personal_note_versions`, and `public.save_personal_note(...)` returning `(id uuid, version bigint, updated_at timestamptz)`.

- [ ] **Step 1: Write the RLS tests before the migration**

```ts
// packages/db/test/personal-notes-rls.test.ts
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasEnv = Boolean(URL && ANON && SERVICE);
const PASSWORD = "rls-test-password-123";

async function signedIn(email: string): Promise<SupabaseClient> {
  const client = createClient(URL!, ANON!, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(error.message);
  return client;
}

describe.skipIf(!hasEnv)("personal notes RLS", () => {
  const service = createClient(URL!, SERVICE!, { auth: { persistSession: false } });
  const aliceEmail = `pn-a-${randomUUID()}@e2e.local`;
  const bobEmail = `pn-b-${randomUUID()}@e2e.local`;
  let aliceId = "";
  let bobId = "";
  let alice: SupabaseClient;
  let bob: SupabaseClient;
  let noteId = "";

  beforeAll(async () => {
    for (const [email, setId] of [[aliceEmail, (id: string) => (aliceId = id)], [bobEmail, (id: string) => (bobId = id)]] as const) {
      const made = await service.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
      if (made.error) throw new Error(made.error.message);
      setId(made.data.user!.id);
    }
    alice = await signedIn(aliceEmail);
    bob = await signedIn(bobEmail);
  });

  afterAll(async () => {
    for (const id of [aliceId, bobId]) await service.auth.admin.deleteUser(id).catch(() => {});
  });

  it("lets an owner create and update through the atomic RPC", async () => {
    const clientId = randomUUID();
    const first = await alice.rpc("save_personal_note", {
      p_id: null,
      p_note_slug: "qa-foundations/what-is-qa/qa-vs-qc-vs-testing",
      p_client_id: clientId,
      p_title: "My QA distinction",
      p_body: "# QA\nQuality assurance is preventive.",
      p_tags: ["qa", "foundations"],
      p_favorite: false,
      p_expected_version: 0,
    });
    expect(first.error).toBeNull();
    noteId = first.data![0].id as string;
    const second = await alice.rpc("save_personal_note", {
      p_id: noteId,
      p_note_slug: "qa-foundations/what-is-qa/qa-vs-qc-vs-testing",
      p_client_id: clientId,
      p_title: "My QA distinction",
      p_body: "# QA\nQuality assurance prevents defects.",
      p_tags: ["qa"],
      p_favorite: true,
      p_expected_version: 1,
    });
    expect(second.data![0].version).toBe(2);
  });

  it("never exposes another learner's note or history", async () => {
    expect((await bob.from("personal_notes").select("id").eq("id", noteId)).data ?? []).toHaveLength(0);
    expect((await bob.from("personal_note_versions").select("id").eq("note_id", noteId)).data ?? []).toHaveLength(0);
  });

  it("rejects an unauthorized update and stale version", async () => {
    const forged = await bob.from("personal_notes").update({ title: "stolen" }).eq("id", noteId).select("id");
    expect(forged.data ?? []).toHaveLength(0);
    const stale = await alice.rpc("save_personal_note", {
      p_id: noteId,
      p_note_slug: "qa-foundations/what-is-qa/qa-vs-qc-vs-testing",
      p_client_id: randomUUID(),
      p_title: "stale",
      p_body: "stale",
      p_tags: [],
      p_favorite: false,
      p_expected_version: 1,
    });
    expect(stale.error?.message).toContain("personal_note_version_conflict");
  });
});
```

- [ ] **Step 2: Run the focused test and confirm the missing-table failure**

Run: `pnpm --filter @qa-mastery/db test:rls -- personal-notes-rls.test.ts`

Expected: FAIL with `relation "public.personal_notes" does not exist` or `Could not find the function public.save_personal_note`.

- [ ] **Step 3: Add the tables, indexes, RLS, triggers, and atomic save RPC**

```sql
-- supabase/migrations/20260726000036_personal_notes.sql
create table public.personal_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null,
  note_slug text check (
    note_slug is null or
    (note_slug = lower(note_slug) and char_length(note_slug) between 3 and 160)
  ),
  title text not null check (char_length(title) between 1 and 160),
  body text not null default '' check (char_length(body) <= 100000),
  tags text[] not null default '{}'
    check (cardinality(tags) <= 10),
  favorite boolean not null default false,
  version bigint not null default 1 check (version > 0),
  share_token uuid unique,
  shared_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id),
  check ((share_token is null) = (shared_at is null))
);

create table public.personal_note_versions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.personal_notes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  version bigint not null check (version > 0),
  title text not null,
  body text not null,
  tags text[] not null default '{}',
  favorite boolean not null default false,
  created_at timestamptz not null default now(),
  unique (note_id, version)
);

create index personal_notes_owner_updated on public.personal_notes(user_id, updated_at desc);
create index personal_notes_owner_favorite on public.personal_notes(user_id, favorite, updated_at desc);
create index personal_notes_owner_slug on public.personal_notes(user_id, note_slug, updated_at desc);
create index personal_notes_tags on public.personal_notes using gin(tags);
create index personal_note_versions_note on public.personal_note_versions(note_id, version desc);

create trigger personal_notes_updated_at before update on public.personal_notes
for each row execute function public.set_updated_at();

alter table public.personal_notes enable row level security;
alter table public.personal_note_versions enable row level security;

create policy "owners read personal notes" on public.personal_notes for select
  using ((select auth.uid()) = user_id);
create policy "owners insert personal notes" on public.personal_notes for insert
  with check ((select auth.uid()) = user_id);
create policy "owners update personal notes" on public.personal_notes for update
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "owners delete personal notes" on public.personal_notes for delete
  using ((select auth.uid()) = user_id);
create policy "owners read personal note versions" on public.personal_note_versions for select
  using ((select auth.uid()) = user_id);
create policy "owners insert personal note versions" on public.personal_note_versions for insert
  with check ((select auth.uid()) = user_id);

create or replace function public.save_personal_note(
  p_id uuid,
  p_note_slug text,
  p_client_id uuid,
  p_title text,
  p_body text,
  p_tags text[],
  p_favorite boolean,
  p_expected_version bigint
) returns table(id uuid, version bigint, updated_at timestamptz)
language plpgsql
security invoker
set search_path = public
as $$
declare current_row public.personal_notes%rowtype;
begin
  if auth.uid() is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  if char_length(p_title) not between 1 and 160 or char_length(p_body) > 100000 then
    raise exception 'personal_note_invalid' using errcode = '22023';
  end if;
  if cardinality(p_tags) > 10 or exists (
    select 1 from unnest(p_tags) tag where tag <> lower(tag) or char_length(tag) not between 2 and 32
  ) then raise exception 'personal_note_tags_invalid' using errcode = '22023'; end if;

  if p_id is null then
    if (select count(*) from public.personal_notes where user_id = auth.uid()) >= 500 then
      raise exception 'personal_note_limit_reached' using errcode = '54000';
    end if;
    insert into public.personal_notes(user_id, client_id, note_slug, title, body, tags, favorite)
    values (auth.uid(), p_client_id, p_note_slug, p_title, p_body, p_tags, p_favorite)
    on conflict (user_id, client_id) do update set client_id = excluded.client_id
    returning personal_notes.id, personal_notes.version, personal_notes.updated_at
    into id, version, updated_at;
    return next;
    return;
  end if;

  select * into current_row from public.personal_notes
    where personal_notes.id = p_id and user_id = auth.uid() for update;
  if not found then raise exception 'personal_note_not_found' using errcode = '42501'; end if;
  if current_row.version <> p_expected_version then
    raise exception 'personal_note_version_conflict' using errcode = '40001';
  end if;
  insert into public.personal_note_versions(note_id, user_id, version, title, body, tags, favorite)
  values (current_row.id, current_row.user_id, current_row.version,
          current_row.title, current_row.body, current_row.tags, current_row.favorite);
  update public.personal_notes set
    note_slug = p_note_slug, title = p_title, body = p_body,
    tags = p_tags, favorite = p_favorite, version = current_row.version + 1
  where personal_notes.id = current_row.id
  returning personal_notes.id, personal_notes.version, personal_notes.updated_at
  into id, version, updated_at;
  return next;
end;
$$;

revoke all on function public.save_personal_note(uuid,text,uuid,text,text,text[],boolean,bigint) from public;
grant execute on function public.save_personal_note(uuid,text,uuid,text,text,text[],boolean,bigint) to authenticated;
```

- [ ] **Step 4: Reset the local database and run the RLS suite**

Run: `pnpm db:reset`

Expected: migration `20260726000036_personal_notes.sql` applies without warnings.

Run: `pnpm --filter @qa-mastery/db test:rls -- personal-notes-rls.test.ts`

Expected: PASS for owner create/update, cross-owner isolation, and stale-write rejection.

- [ ] **Step 5: Run the repository RLS coverage gate**

Run: `pnpm --filter @qa-mastery/db test:rls -- rls-coverage.test.ts`

Expected: PASS; both new tables are detected in `personal-notes-rls.test.ts`.

- [ ] **Step 6: Commit the database boundary**

```bash
git add supabase/migrations/20260726000036_personal_notes.sql packages/db/test/personal-notes-rls.test.ts
git commit -m "feat(notes): add private personal note storage"
```

### Task 2: Define Validation, DTOs, and Safe Markdown Templates

**Files:**
- Create: `apps/platform/src/lib/personal-notes/schema.ts`
- Create: `apps/platform/src/lib/personal-notes/types.ts`
- Create: `apps/platform/src/lib/personal-notes/templates.ts`
- Create: `apps/platform/src/lib/personal-notes/schema.test.ts`
- Governor modify: `apps/platform/package.json`
- Governor modify: `pnpm-lock.yaml`

**Interfaces:**
- Produces: `PersonalNoteInput`, `PersonalNoteDTO`, `PersonalNoteSummaryDTO`, `SavePersonalNoteResult`, `normalizeTags()`, `PERSONAL_NOTE_TEMPLATES`.
- Consumes: `react-markdown@10.1.0`, `remark-gfm@4.0.1` added by the integration governor.

- [ ] **Step 1: Write failing validation tests**

```ts
// apps/platform/src/lib/personal-notes/schema.test.ts
import { describe, expect, it } from "vitest";
import { PersonalNoteInputSchema, normalizeTags } from "./schema";

describe("personal note schema", () => {
  it("normalizes and deduplicates tags", () => {
    expect(normalizeTags([" API ", "api", "Manual-QA"])).toEqual(["api", "manual-qa"]);
  });

  it("rejects unsafe source slugs and oversized content", () => {
    expect(PersonalNoteInputSchema.safeParse({
      id: null, clientId: crypto.randomUUID(), noteSlug: "../../admin",
      title: "x", body: "ok", tags: [], favorite: false, expectedVersion: 0,
    }).success).toBe(false);
    expect(PersonalNoteInputSchema.safeParse({
      id: null, clientId: crypto.randomUUID(), noteSlug: null,
      title: "x", body: "a".repeat(100001), tags: [], favorite: false, expectedVersion: 0,
    }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and confirm missing exports**

Run: `pnpm --filter @qa-mastery/platform test -- src/lib/personal-notes/schema.test.ts`

Expected: FAIL because `./schema` does not exist.

- [ ] **Step 3: Implement the validation contract and DTOs**

```ts
// apps/platform/src/lib/personal-notes/schema.ts
import { z } from "zod";

const NoteSlug = z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+$/).nullable();
const Tag = z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{1,31}$/);

export function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))].slice(0, 10);
}

export const PersonalNoteInputSchema = z.object({
  id: z.string().uuid().nullable(),
  clientId: z.string().uuid(),
  noteSlug: NoteSlug,
  title: z.string().trim().min(1).max(160),
  body: z.string().max(100_000),
  tags: z.array(Tag).max(10),
  favorite: z.boolean(),
  expectedVersion: z.number().int().min(0),
});

export type PersonalNoteInput = z.infer<typeof PersonalNoteInputSchema>;
```

```ts
// apps/platform/src/lib/personal-notes/types.ts
export interface PersonalNoteSummaryDTO {
  id: string; title: string; noteSlug: string | null; tags: string[];
  favorite: boolean; version: number; updatedAt: string;
}
export interface PersonalNoteDTO extends PersonalNoteSummaryDTO {
  clientId: string; body: string; shared: boolean;
}
export type SavePersonalNoteResult =
  | { ok: true; id: string; version: number; updatedAt: string }
  | { ok: false; code: "conflict" | "invalid" | "limit" | "save_failed"; message: string };
export interface PersonalNoteVersionDTO {
  version: number; title: string; body: string; tags: string[];
  favorite: boolean; createdAt: string;
}
```

- [ ] **Step 4: Add immutable templates**

```ts
// apps/platform/src/lib/personal-notes/templates.ts
export const PERSONAL_NOTE_TEMPLATES = [
  { id: "quick", label: "Quick capture", title: "Quick note", body: "## What I learned\n\n## Follow-up\n- [ ] " },
  { id: "lesson", label: "Lesson summary", title: "Lesson summary", body: "## Summary\n\n## Key terms\n\n## Example\n\n## Questions\n" },
  { id: "exploratory", label: "Exploratory session", title: "Exploratory testing session", body: "## Charter\n\n## Environment\n\n## Observations\n\n## Risks\n\n## Bugs\n" },
  { id: "bug", label: "Bug investigation", title: "Bug investigation", body: "## Symptom\n\n## Reproduction\n1. \n\n## Evidence\n\n## Hypothesis\n" },
  { id: "api", label: "API testing", title: "API testing notes", body: "## Endpoint\n\n## Request\n```http\n\n```\n\n## Response\n```json\n\n```\n\n## Assertions\n" },
  { id: "interview", label: "Interview preparation", title: "Interview preparation", body: "## Question\n\n## My answer\n\n## Evidence from my work\n\n## Improve next\n" },
] as const;
export type PersonalNoteTemplateId = (typeof PERSONAL_NOTE_TEMPLATES)[number]["id"];
```

- [ ] **Step 5: Add the safe Markdown dependencies through the governor**

Run in the integration worktree: `pnpm --filter @qa-mastery/platform add react-markdown@10.1.0 remark-gfm@4.0.1`

Expected: only `apps/platform/package.json` and `pnpm-lock.yaml` change; `react-markdown` is never configured with `rehype-raw`.

- [ ] **Step 6: Run tests and commit the domain contract**

Run: `pnpm --filter @qa-mastery/platform test -- src/lib/personal-notes/schema.test.ts`

Expected: PASS.

```bash
git add apps/platform/src/lib/personal-notes/schema.ts apps/platform/src/lib/personal-notes/types.ts apps/platform/src/lib/personal-notes/templates.ts apps/platform/src/lib/personal-notes/schema.test.ts
git commit -m "feat(notes): define personal note contracts"
```

### Task 3: Build the Server-Only Data Access Layer and Thin Actions

**Files:**
- Create: `apps/platform/src/lib/personal-notes/data.ts`
- Create: `apps/platform/src/app/(app)/my-notes/actions.ts`
- Create: `apps/platform/src/lib/personal-notes/data.test.ts`

**Interfaces:**
- Produces: `listPersonalNotes()`, `getPersonalNote()`, `listTopicPersonalNotes()`, `getPersonalNoteVersions()`, `getSharedPersonalNote()`, `savePersonalNoteAction()`, `deletePersonalNoteAction()`, `restorePersonalNoteVersionAction()`, `setPersonalNoteSharingAction()`.
- Consumes: Task 2 DTOs and `public.save_personal_note` from Task 1.

- [ ] **Step 1: Write a failing DTO-mapping unit test**

```ts
// apps/platform/src/lib/personal-notes/data.test.ts
import { describe, expect, it } from "vitest";
import { toPersonalNoteDTO } from "./data";

describe("personal note DTO", () => {
  it("does not expose user_id or share_token", () => {
    const dto = toPersonalNoteDTO({
      id: "11111111-1111-4111-8111-111111111111", client_id: "22222222-2222-4222-8222-222222222222",
      title: "API", body: "private", note_slug: null, tags: ["api"], favorite: false,
      version: 2, share_token: "33333333-3333-4333-8333-333333333333", shared_at: "2026-07-26T00:00:00Z",
      updated_at: "2026-07-26T00:00:00Z", user_id: "secret-owner",
    });
    expect(dto).not.toHaveProperty("user_id");
    expect(dto).not.toHaveProperty("share_token");
    expect(dto.shared).toBe(true);
  });
});
```

- [ ] **Step 2: Run the unit test and confirm the missing mapper failure**

Run: `pnpm --filter @qa-mastery/platform test -- src/lib/personal-notes/data.test.ts`

Expected: FAIL because `toPersonalNoteDTO` is not exported.

- [ ] **Step 3: Implement `server-only` reads and narrow mapping**

```ts
// apps/platform/src/lib/personal-notes/data.ts
import "server-only";
import { createServiceClient } from "@qa-mastery/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PersonalNoteDTO, PersonalNoteSummaryDTO, PersonalNoteVersionDTO } from "./types";

type NoteRow = Record<string, unknown>;
export function toPersonalNoteDTO(row: NoteRow): PersonalNoteDTO {
  return {
    id: String(row.id), clientId: String(row.client_id), title: String(row.title),
    body: String(row.body), noteSlug: row.note_slug ? String(row.note_slug) : null,
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [], favorite: Boolean(row.favorite),
    version: Number(row.version), shared: Boolean(row.shared_at), updatedAt: String(row.updated_at),
  };
}

export async function listPersonalNotes(filters: { query?: string; tag?: string; favorite?: boolean } = {}): Promise<PersonalNoteSummaryDTO[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("personal_notes")
    .select("id,title,note_slug,tags,favorite,version,updated_at")
    .order("updated_at", { ascending: false }).limit(500);
  if (filters.favorite) query = query.eq("favorite", true);
  if (filters.tag) query = query.contains("tags", [filters.tag]);
  if (filters.query?.trim()) query = query.ilike("title", `%${filters.query.trim().replaceAll("%", "\\%")}%`);
  const { data, error } = await query;
  if (error) throw new Error("Could not load personal notes");
  return (data ?? []).map((row) => ({
    id: String(row.id), title: String(row.title), noteSlug: row.note_slug ? String(row.note_slug) : null,
    tags: (row.tags as string[]) ?? [], favorite: Boolean(row.favorite),
    version: Number(row.version), updatedAt: String(row.updated_at),
  }));
}

export async function getSharedPersonalNote(token: string) {
  const service = createServiceClient();
  const { data } = await service.from("personal_notes")
    .select("title,body,note_slug,tags,updated_at")
    .eq("share_token", token).not("shared_at", "is", null).maybeSingle();
  return data ? { title: String(data.title), body: String(data.body), noteSlug: data.note_slug ? String(data.note_slug) : null,
    tags: (data.tags as string[]) ?? [], updatedAt: String(data.updated_at) } : null;
}
```

- [ ] **Step 4: Add authenticated write actions with conflict mapping**

```ts
// apps/platform/src/app/(app)/my-notes/actions.ts
"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PersonalNoteInputSchema, normalizeTags } from "@/lib/personal-notes/schema";
import type { SavePersonalNoteResult } from "@/lib/personal-notes/types";

async function authed() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in.");
  return { supabase, user };
}

export async function savePersonalNoteAction(raw: unknown): Promise<SavePersonalNoteResult> {
  const normalized = typeof raw === "object" && raw !== null
    ? { ...raw, tags: normalizeTags(Array.isArray((raw as { tags?: unknown }).tags) ? (raw as { tags: string[] }).tags : []) }
    : raw;
  const parsed = PersonalNoteInputSchema.safeParse(normalized);
  if (!parsed.success) return { ok: false, code: "invalid", message: parsed.error.issues[0]?.message ?? "Invalid note" };
  const { supabase } = await authed();
  const p = parsed.data;
  const { data, error } = await supabase.rpc("save_personal_note", {
    p_id: p.id, p_note_slug: p.noteSlug, p_client_id: p.clientId, p_title: p.title,
    p_body: p.body, p_tags: p.tags, p_favorite: p.favorite, p_expected_version: p.expectedVersion,
  });
  if (error?.message.includes("personal_note_version_conflict")) return { ok: false, code: "conflict", message: "This note changed on another device. Reload before saving again." };
  if (error?.message.includes("personal_note_limit_reached")) return { ok: false, code: "limit", message: "You have reached the 500-note limit." };
  if (error || !data?.[0]) return { ok: false, code: "save_failed", message: "Could not save your note." };
  revalidatePath("/my-notes");
  if (p.noteSlug) revalidatePath(`/notes/${p.noteSlug}`);
  return { ok: true, id: String(data[0].id), version: Number(data[0].version), updatedAt: String(data[0].updated_at) };
}
```

- [ ] **Step 5: Add delete, history restore, and share actions**

Implement these exact signatures in `actions.ts`; each calls `authed()`, scopes by `user_id`, checks the returned row count, and revalidates `/my-notes`:

```ts
export async function deletePersonalNoteAction(id: string): Promise<{ ok: boolean; error?: string }>;
export async function restorePersonalNoteVersionAction(id: string, version: number): Promise<SavePersonalNoteResult>;
export async function setPersonalNoteSharingAction(id: string, enabled: boolean): Promise<{ ok: true; url: string | null } | { ok: false; error: string }>;
```

For sharing, generate `crypto.randomUUID()` only when enabling a currently private owner row, persist `share_token` plus `shared_at`, and return `/shared/notes/<token>`. For restoration, load the owner-visible version, then call `savePersonalNoteAction` with the current row's version so restoration itself creates history.

- [ ] **Step 6: Run tests and commit the server boundary**

Run: `pnpm --filter @qa-mastery/platform test -- src/lib/personal-notes/data.test.ts`

Expected: PASS.

Run: `pnpm --filter @qa-mastery/platform typecheck`

Expected: PASS with no raw database record crossing the action boundary.

```bash
git add apps/platform/src/lib/personal-notes/data.ts apps/platform/src/lib/personal-notes/data.test.ts 'apps/platform/src/app/(app)/my-notes/actions.ts'
git commit -m "feat(notes): add secure personal note actions"
```

### Task 4: Build the Personal-Note Index and Conflict-Aware Editor

**Files:**
- Create: `apps/platform/src/app/(app)/my-notes/page.tsx`
- Create: `apps/platform/src/app/(app)/my-notes/notes-workspace.tsx`
- Create: `apps/platform/src/app/(app)/my-notes/[id]/page.tsx`
- Create: `apps/platform/src/app/(app)/my-notes/[id]/note-editor.tsx`
- Create: `apps/platform/src/app/(app)/my-notes/[id]/note-editor.test.tsx`

**Interfaces:**
- Consumes: Tasks 2–3 DTOs/actions and Wave 2 shared `Field`, `Input`, `Textarea`, `SaveIndicator`, `Tabs`, `EmptyState`, `Button`.
- Produces: `/my-notes`, `/my-notes/[id]`, and `NoteEditor` with `idle | saving | saved | offline | conflict | error` status.

- [ ] **Step 1: Write the failing autosave/recovery interaction test**

```tsx
// apps/platform/src/app/(app)/my-notes/[id]/note-editor.test.tsx
// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoteEditor } from "./note-editor";

const save = vi.fn();
describe("NoteEditor", () => {
  beforeEach(() => { vi.useFakeTimers(); save.mockReset(); localStorage.clear(); });
  it("keeps a recovery draft until the matching server revision is saved", async () => {
    save.mockResolvedValue({ ok: true, id: "11111111-1111-4111-8111-111111111111", version: 2, updatedAt: "2026-07-26T00:00:00Z" });
    render(<NoteEditor initial={{ id: "11111111-1111-4111-8111-111111111111", clientId: "22222222-2222-4222-8222-222222222222", title: "QA", body: "old", noteSlug: null, tags: [], favorite: false, version: 1, shared: false, updatedAt: "2026-07-25T00:00:00Z" }} saveAction={save} />);
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).clear(screen.getByLabelText("Note body"));
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).type(screen.getByLabelText("Note body"), "new body");
    expect(localStorage.getItem("qa-mastery:personal-note:22222222-2222-4222-8222-222222222222")).toContain("new body");
    await vi.advanceTimersByTimeAsync(700);
    await waitFor(() => expect(screen.getByText("Saved")).toBeVisible());
    expect(localStorage.getItem("qa-mastery:personal-note:22222222-2222-4222-8222-222222222222")).toBeNull();
  });
});
```

- [ ] **Step 2: Run the editor test and confirm the missing-component failure**

Run: `pnpm --filter @qa-mastery/platform test -- 'src/app/(app)/my-notes/[id]/note-editor.test.tsx'`

Expected: FAIL because `NoteEditor` does not exist.

- [ ] **Step 3: Implement the server pages and list filters**

```tsx
// apps/platform/src/app/(app)/my-notes/page.tsx
import { listPersonalNotes } from "@/lib/personal-notes/data";
import { NotesWorkspace } from "./notes-workspace";

export const metadata = { title: "My Notes · QA Mastery" };
export default async function MyNotesPage() {
  const notes = await listPersonalNotes();
  return <main className="mx-auto max-w-6xl"><h1>My Notes</h1><NotesWorkspace initialNotes={notes} /></main>;
}
```

`NotesWorkspace` keeps query/tag/favorite filters client-side over the maximum 500 summaries, offers all six templates, creates a UUID `clientId`, calls `savePersonalNoteAction` with version `0`, and routes to `/my-notes/<id>` only after success.

- [ ] **Step 4: Implement the 700 ms editor save loop**

`NoteEditor` must use this exact persistence order: update React state, synchronously write the serialized draft to the recovery key, reset a 700 ms timer, call `saveAction` with the current acknowledged version, update the version from a successful response, then delete the recovery key. A `conflict` response leaves the recovery key intact and disables further automatic writes until the learner chooses Reload server copy or Copy my draft.

Render Markdown preview with:

```tsx
<ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
  {draft.body}
</ReactMarkdown>
```

Do not add `rehypeRaw` or pass HTML to the DOM.

- [ ] **Step 5: Run interaction, type, and lint checks**

Run: `pnpm --filter @qa-mastery/platform test -- 'src/app/(app)/my-notes/[id]/note-editor.test.tsx'`

Expected: PASS for local draft retention and server acknowledgement cleanup.

Run: `pnpm --filter @qa-mastery/platform typecheck`

Expected: PASS.

Run: `pnpm --filter @qa-mastery/platform lint`

Expected: PASS.

- [ ] **Step 6: Commit the workspace**

```bash
git add 'apps/platform/src/app/(app)/my-notes'
git commit -m "feat(notes): add personal note workspace"
```

### Task 5: Attach Notes to Knowledge Base Topics

**Files:**
- Create: `apps/platform/src/app/(app)/notes/[module]/[chapter]/[topic]/personal-notes-panel.tsx`
- Modify: `apps/platform/src/app/(app)/notes/[module]/[chapter]/[topic]/page.tsx:95-193`
- Test: `e2e/tests/personal-notes.spec.ts`

**Interfaces:**
- Consumes: `listTopicPersonalNotes(noteSlug)` and `savePersonalNoteAction()`.
- Produces: a “My notes for this topic” panel beneath the lesson body and a stable source backlink from each personal note.

- [ ] **Step 1: Add the failing topic-annotation E2E case**

```ts
// e2e/tests/personal-notes.spec.ts
import { expect, test } from "@playwright/test";
import { signUpFreshLearner } from "./signup-helper";

const TOPIC = "/notes/qa-foundations/what-is-qa/qa-vs-qc-vs-testing";
test("creates a private note from a Knowledge Base topic", async ({ page }) => {
  await signUpFreshLearner(page, "personal-note");
  await page.goto(TOPIC);
  await page.getByRole("button", { name: "Add personal note" }).click();
  await page.getByLabel("Note title").fill("QA and QC");
  await page.getByLabel("Note body").fill("QA prevents; QC detects.");
  await expect(page.getByText("Saved")).toBeVisible({ timeout: 10_000 });
  await page.reload();
  await expect(page.getByRole("link", { name: "QA and QC" })).toBeVisible();
});
```

- [ ] **Step 2: Run the test and confirm the missing-button failure**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/personal-notes.spec.ts --project=chromium`

Expected: FAIL because “Add personal note” is absent.

- [ ] **Step 3: Render the panel from the Server Component**

In the topic page, load completion, lab, capstone, and `listTopicPersonalNotes(noteSlug)` in one `Promise.all`, then render:

```tsx
<PersonalNotesPanel noteSlug={noteSlug} initialNotes={personalNotes} />
```

The client panel creates a note with the exact `noteSlug`, shows existing note links, and labels the area “My notes for this topic”; it does not expose another learner's rows because the read uses the request-scoped client.

- [ ] **Step 4: Run topic and legacy Knowledge Base tests**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/personal-notes.spec.ts tests/notes.spec.ts --project=chromium`

Expected: PASS; existing `/notes/**` URLs remain stable.

- [ ] **Step 5: Commit the topic integration**

```bash
git add 'apps/platform/src/app/(app)/notes/[module]/[chapter]/[topic]/personal-notes-panel.tsx' 'apps/platform/src/app/(app)/notes/[module]/[chapter]/[topic]/page.tsx' e2e/tests/personal-notes.spec.ts
git commit -m "feat(notes): attach private notes to knowledge topics"
```

### Task 6: Add History, Read-Only Sharing, and Export

**Files:**
- Create: `apps/platform/src/app/(app)/my-notes/[id]/history-panel.tsx`
- Create: `apps/platform/src/app/shared/notes/[token]/page.tsx`
- Create: `apps/platform/src/app/api/my-notes/export/route.ts`
- Modify: `apps/platform/src/app/(app)/my-notes/[id]/page.tsx`
- Modify: `apps/platform/src/app/(app)/my-notes/[id]/note-editor.tsx`
- Test: `e2e/tests/personal-notes.spec.ts`

**Interfaces:**
- Consumes: history/share actions, `getSharedPersonalNote(token)`, and authenticated note reads.
- Produces: version restore, revocable bearer-link sharing, `GET /api/my-notes/export?format=json|markdown`, and print-safe shared-note rendering.

- [ ] **Step 1: Add failing E2E assertions for export and share revocation**

Append a test that creates a note, enables sharing, opens the returned `/shared/notes/<uuid>` URL in a new anonymous context, verifies only title/body/tags/source/updated time are visible, disables sharing, and expects the same URL to return the branded not-found page. Append an export assertion:

```ts
const downloadPromise = page.waitForEvent("download");
await page.getByRole("link", { name: "Export JSON" }).click();
const download = await downloadPromise;
expect(download.suggestedFilename()).toBe("qa-mastery-personal-notes.json");
```

- [ ] **Step 2: Run the focused E2E case and confirm missing controls**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/personal-notes.spec.ts --project=chromium`

Expected: FAIL because share and export controls are absent.

- [ ] **Step 3: Build the dynamic shared page with validated async params**

```tsx
// apps/platform/src/app/shared/notes/[token]/page.tsx
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getSharedPersonalNote } from "@/lib/personal-notes/data";

export default async function SharedNotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();
  const note = await getSharedPersonalNote(token);
  if (!note) notFound();
  return <main className="prose-notes mx-auto max-w-2xl px-4 py-10 print:max-w-none">
    <h1>{note.title}</h1>
    <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>{note.body}</ReactMarkdown>
  </main>;
}
```

- [ ] **Step 4: Build the authenticated, uncached export Route Handler**

The handler calls `supabase.auth.getUser()` itself, returns 401 without a user, selects only owner-visible fields through the request-scoped client, and sets `Cache-Control: private, no-store` plus `Content-Disposition`. JSON shape is `{ exportedAt, notes: [{ title, body, tags, favorite, noteSlug, createdAt, updatedAt }] }`; Markdown joins notes with `\n\n---\n\n` and a source-link line.

```ts
export async function GET(request: Request) {
  const format = new URL(request.url).searchParams.get("format");
  if (format !== "json" && format !== "markdown") return Response.json({ error: "format must be json or markdown" }, { status: 400 });
  // authenticate, owner-scoped select, serialize, return attachment
}
```

- [ ] **Step 5: Wire history restore and print controls**

`HistoryPanel` lists version number and date, expands a read-only preview, and calls `restorePersonalNoteVersionAction(id, version)` only after a confirmation dialog. The editor exposes Enable/Disable sharing, Copy link, and Print; Print calls `window.print()` and never sends content to a PDF service.

- [ ] **Step 6: Run security and behavior checks**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/personal-notes.spec.ts --project=chromium`

Expected: PASS for anonymous shared read, revoked-link 404, private history, and JSON download.

Run: `pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck`

Expected: both exit 0.

- [ ] **Step 7: Commit history and export**

```bash
git add 'apps/platform/src/app/(app)/my-notes/[id]' apps/platform/src/app/shared/notes apps/platform/src/app/api/my-notes/export e2e/tests/personal-notes.spec.ts
git commit -m "feat(notes): add history sharing and export"
```

### Task 7: Integrate Navigation and Verify the Subsystem

**Files:**
- Governor modify: `apps/platform/src/app/(app)/dashboard/components/hub-grid.tsx`
- Governor modify: authenticated navigation configuration created by the Wave 2 shell plan
- Modify: `e2e/tests/personal-notes.spec.ts`

**Interfaces:**
- Consumes: stable `/notes` Knowledge Base route and `/my-notes` personal workspace.
- Produces: distinct “Knowledge Base” and “My Notes” navigation labels without breaking `/notes/**` links.

- [ ] **Step 1: Add the navigation assertion**

```ts
test("separates Knowledge Base from My Notes", async ({ page }) => {
  await signUpFreshLearner(page, "notes-nav");
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: "Knowledge Base" })).toHaveAttribute("href", "/notes");
  await expect(page.getByRole("link", { name: "My Notes" })).toHaveAttribute("href", "/my-notes");
});
```

- [ ] **Step 2: Run the assertion and confirm the label/link failure**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/personal-notes.spec.ts --project=chromium`

Expected: FAIL until the governor integrates the two destinations.

- [ ] **Step 3: Submit the exact governor integration patch**

Replace dashboard copy “Notes wiki”/“Notes” with “Knowledge Base” while keeping `href="/notes"`; add a “My Notes” destination with `href="/my-notes"`. Add the same two destinations under the Wave 2 `Learn` navigation group. Do not rename the physical `/notes` directory in this program.

- [ ] **Step 4: Run the complete verification matrix**

Run:

```bash
pnpm db:reset
pnpm --filter @qa-mastery/db test:rls
pnpm --filter @qa-mastery/platform test
pnpm --filter @qa-mastery/platform lint
pnpm --filter @qa-mastery/platform typecheck
pnpm --filter @qa-mastery/platform build
pnpm --filter @qa-mastery/e2e exec playwright test tests/personal-notes.spec.ts tests/notes.spec.ts tests/notes-v2.spec.ts --project=chromium
git diff --check
```

Expected: every command exits 0; the RLS coverage gate has no new exemption; anonymous users cannot read private notes/history/export; shared URLs expose only the projected DTO; recovery drafts survive failed saves; `/notes/**` remains compatible.

- [ ] **Step 5: Commit the governor-owned navigation integration after lock transfer**

```bash
git add apps/platform/src/app/(app)/dashboard/components/hub-grid.tsx apps/platform/src/components/nav e2e/tests/personal-notes.spec.ts
git commit -m "feat(notes): separate knowledge base and personal notes"
```

- [ ] **Step 6: Record the handoff**

Record migration `0036`, all commit hashes, dependency-lock commit, RLS output, platform test/lint/type/build output, Playwright output, changed paths, and the explicit exclusions from Global Constraints in the lane ledger. Mark the lane `review` rather than `integrated`; only the governor changes integration state.
