# Onboarding, Profile, and Mastery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Personalize the first session, expand profile and preference controls, turn learning evidence into explainable skill mastery and recommendations, and provide safe reminders and opt-in cohort comparison.

**Architecture:** `learner_preferences` is owner-managed intent and delivery configuration; `skill_evidence` and `skill_mastery` are authoritative service-written/read-own records. A pure mapping layer converts existing graded activity into normalized evidence, then a database function recomputes mastery states from score, confidence, count, and recency. Onboarding and settings use thin Server Actions over request-scoped RLS; complete export and seven-day cancellable deletion are supplied by the separate privacy subsystem after migration `0044`.

**Tech Stack:** Next.js 16 App Router and Route Handlers, React 19, TypeScript, Supabase Auth/PostgreSQL RLS, Zod 4, Canvas avatar crop, Vitest, Testing Library, Playwright, Vercel Cron.

## Global Constraints

- Base this lane on the verified Wave 2 checkpoint, migrations `0036`–`0038`, and the adaptive-foundation export `computeSkillMastery` from `@qa-mastery/grading`.
- The integration governor owns authentication files during Wave 1, `apps/platform/vercel.json`, central environment schemas, lockfile, authenticated navigation, and dashboard composition. This lane supplies exact patches after those locks are released.
- This plan owns `supabase/migrations/20260726000039_learner_preferences.sql`, `supabase/migrations/20260726000040_skill_evidence.sql`, `packages/db/test/learner-preferences-rls.test.ts`, `packages/db/test/skill-mastery-rls.test.ts`, `apps/platform/src/lib/onboarding/**`, `apps/platform/src/lib/mastery/**`, `apps/platform/src/app/(app)/onboarding/**`, `apps/platform/src/app/(app)/progress/**`, `apps/platform/src/app/(app)/settings/**`, `apps/platform/src/app/api/study-reminders/route.ts`, and the assigned E2E files.
- Migration `20260726000039_learner_preferences.sql` must produce `public.learner_preferences(user_id PK, outcome, experience_level, preferred_path, preferred_language, weekly_minutes, reminder_enabled, target_date, timezone, accessibility jsonb, notifications jsonb, updated_at)`.
- Migration `20260726000040_skill_evidence.sql` must produce `public.skill_evidence(id, user_id, skill_key, source, source_id, score, confidence, demonstrated_at, metadata, created_at)` and `public.skill_mastery(user_id, skill_key, state, score, confidence, evidence_count, last_demonstrated_at, updated_at)`.
- Migration numbers `0039` and `0040` are reserved exactly; do not rename them or allocate another migration.
- Preferences are owner read/write. Evidence and mastery are service-role write and owner read only. Public tester profiles continue to expose curated `talent_verified_skills`, not private mastery weaknesses or diagnostic answers.
- Follow installed Next.js 16 authentication, data-security, mutation, Route Handler, dynamic-route, and revalidation guides. Layout checks are not the only authorization boundary; actions, DAL functions, and Route Handlers authenticate independently.
- Onboarding outcomes are exactly `first_qa_role`, `current_qa_role`, `learn_automation`, `prepare_interviews`, `build_portfolio`, `explore_qa`.
- Experience levels are exactly `beginner`, `foundational`, `working`, `professional`; preferred paths are `manual`, `api`, `automation`, `performance`, `security`, `balanced`; preferred languages are `none`, `java`, `python`, `javascript`, `typescript`, `csharp`.
- Weekly commitment is 15–1,200 minutes. Target date is nullable. Timezone must be a valid `Intl.DateTimeFormat` IANA timezone, maximum 64 characters.
- Accessibility JSON shape is `{ reducedMotion:boolean|null, highContrast:boolean, largerText:boolean }`. Notification JSON shape is `{ studyDays:number[], reminderHour:number, digest:"off"|"weekly", quietStart:string|null, quietEnd:string|null }`, where days are unique integers 0–6 and hour is 0–23.
- Diagnostic assessment is optional, 12 questions, one per skill domain, with no penalty for skipping. It produces service-written evidence and never blocks access to content.
- Skill keys are exactly `qa-foundations`, `test-design`, `exploratory-testing`, `defect-reporting`, `api-testing`, `database-testing`, `ui-automation`, `performance-testing`, `security-testing`, `ci-cd`, `communication`, `test-strategy`.
- Mastery states are exactly `not_assessed`, `emerging`, `developing`, `proficient`, `verified`, `needs_refresh`. `not_assessed` is synthesized for missing rows; database rows use the other five states.
- A row is `needs_refresh` after 180 days without evidence. `verified` requires score at least 85, confidence at least 0.75, and at least 3 evidence records. `proficient` starts at 70; `developing` at 40; lower assessed scores are `emerging`.
- Mastery is guidance, not a credential or employment guarantee. Role-readiness copy must state what evidence is missing and how its percentage is calculated.
- Peer comparison is off by default, compares only the same experience level and preferred path, requires at least 20 opted-in active learners, returns quartile ranges, and never exposes identities or a public rank.
- Profile visibility is `private`, `members`, or `public`; discoverability, contact permission, portfolio visibility, and peer comparison each require explicit user control.
- Avatar uploads use the existing `talent-avatars` public bucket, client-side crop to 512×512 WebP, maximum source file 5 MiB, and update the core `profiles.avatar_url`. No URL field remains in the primary settings UI.
- Complete data export and seven-day cancellable deletion belong exclusively to the privacy plan and migration `0044`. This plan exposes a “Privacy & data” settings link/slot but does not create export routes, deletion actions, deletion UI, deletion secrets, or immediate irreversible deletion.
- Study reminders are in-app notifications only. Email, push, SMS, native-device sessions, adaptive sequencing, and opaque ML recommendations are excluded.
- Do not push, merge, deploy, change external cron configuration, or edit another lane's migration.

---

## File Structure

```text
supabase/migrations/20260726000039_learner_preferences.sql
supabase/migrations/20260726000040_skill_evidence.sql
packages/db/test/learner-preferences-rls.test.ts
packages/db/test/skill-mastery-rls.test.ts
apps/platform/src/lib/onboarding/
  schema.ts                    # preference JSON and onboarding validation
  diagnostic.ts                # immutable question bank and pure grading
  data.ts                      # server-only preference/profile DTO reads
apps/platform/src/lib/mastery/
  taxonomy.ts                  # 12 skill definitions and path mappings
  evidence.ts                  # pure evidence conversion
  data.ts                      # server-only reconcile/read/benchmark DAL
  recommendations.ts           # explainable next-action mapping
apps/platform/src/app/(app)/onboarding/
  page.tsx
  onboarding-wizard.tsx
  actions.ts
apps/platform/src/app/(app)/progress/
  page.tsx
  mastery-dashboard.tsx
  diagnostic-panel.tsx
apps/platform/src/app/(app)/settings/
  page.tsx
  actions.ts
  settings-form.tsx
  privacy-form.tsx
  learning-form.tsx
  accessibility-form.tsx
  avatar-cropper.tsx
  privacy-data-link.tsx
apps/platform/src/app/api/study-reminders/route.ts
e2e/tests/onboarding.spec.ts
e2e/tests/mastery.spec.ts
```

### Task 1: Add Learner Preferences and Profile Privacy with RLS

**Files:**
- Create: `supabase/migrations/20260726000039_learner_preferences.sql`
- Create: `packages/db/test/learner-preferences-rls.test.ts`

**Interfaces:**
- Consumes: `public.profiles`, `public.set_updated_at()`.
- Produces: mandated `public.learner_preferences` contract plus `profiles.onboarding_completed_at`, `profile_visibility`, `discoverable`, `contact_allowed`, `portfolio_public`, `peer_benchmark_opt_in`.

- [ ] **Step 1: Write the failing preference/privacy RLS tests**

```ts
it("allows only the owner to manage learner preferences", async () => {
  const row = { user_id: aliceId, outcome: "first_qa_role", experience_level: "beginner", preferred_path: "balanced", preferred_language: "python", weekly_minutes: 180, reminder_enabled: true, timezone: "Asia/Kathmandu", accessibility: {}, notifications: {} };
  expect((await asAlice.from("learner_preferences").upsert(row)).error).toBeNull();
  expect((await asBob.from("learner_preferences").select("user_id").eq("user_id", aliceId)).data ?? []).toHaveLength(0);
  expect((await asBob.from("learner_preferences").update({ weekly_minutes: 999 }).eq("user_id", aliceId).select("user_id")).data ?? []).toHaveLength(0);
});

it("respects private, members, and public core-profile visibility", async () => {
  await asAlice.from("profiles").update({ profile_visibility: "private", discoverable: false }).eq("id", aliceId);
  expect((await asBob.from("profiles").select("id").eq("id", aliceId)).data ?? []).toHaveLength(0);
  expect((await anon.from("profiles").select("id").eq("id", aliceId)).data ?? []).toHaveLength(0);
  await asAlice.from("profiles").update({ profile_visibility: "members", discoverable: true }).eq("id", aliceId);
  expect((await asBob.from("profiles").select("id").eq("id", aliceId)).data).toHaveLength(1);
  expect((await anon.from("profiles").select("id").eq("id", aliceId)).data ?? []).toHaveLength(0);
});
```

- [ ] **Step 2: Run and verify missing-column/relation failure**

Run: `pnpm --filter @qa-mastery/db test:rls -- learner-preferences-rls.test.ts`

Expected: FAIL because `learner_preferences` does not exist.

- [ ] **Step 3: Create the mandated table and profile controls**

```sql
-- supabase/migrations/20260726000039_learner_preferences.sql
create table public.learner_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  outcome text not null check (outcome in ('first_qa_role','current_qa_role','learn_automation','prepare_interviews','build_portfolio','explore_qa')),
  experience_level text not null check (experience_level in ('beginner','foundational','working','professional')),
  preferred_path text not null check (preferred_path in ('manual','api','automation','performance','security','balanced')),
  preferred_language text not null check (preferred_language in ('none','java','python','javascript','typescript','csharp')),
  weekly_minutes integer not null check (weekly_minutes between 15 and 1200),
  reminder_enabled boolean not null default false,
  target_date date,
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 64),
  accessibility jsonb not null default '{"reducedMotion":null,"highContrast":false,"largerText":false}'::jsonb
    check (jsonb_typeof(accessibility) = 'object'),
  notifications jsonb not null default '{"studyDays":[],"reminderHour":18,"digest":"off","quietStart":null,"quietEnd":null}'::jsonb
    check (jsonb_typeof(notifications) = 'object'),
  updated_at timestamptz not null default now()
);
create trigger learner_preferences_updated_at before update on public.learner_preferences
for each row execute function public.set_updated_at();
alter table public.learner_preferences enable row level security;
create policy "owners read learner preferences" on public.learner_preferences for select using ((select auth.uid()) = user_id);
create policy "owners insert learner preferences" on public.learner_preferences for insert with check ((select auth.uid()) = user_id);
create policy "owners update learner preferences" on public.learner_preferences for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "owners delete learner preferences" on public.learner_preferences for delete using ((select auth.uid()) = user_id);

alter table public.profiles
  add column onboarding_completed_at timestamptz,
  add column profile_visibility text not null default 'members' check (profile_visibility in ('private','members','public')),
  add column discoverable boolean not null default true,
  add column contact_allowed boolean not null default false,
  add column portfolio_public boolean not null default false,
  add column peer_benchmark_opt_in boolean not null default false;

drop policy if exists "profiles are publicly readable" on public.profiles;
create policy "owners read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "members read discoverable profiles" on public.profiles for select to authenticated
  using (discoverable and profile_visibility in ('members','public'));
create policy "anonymous reads public profiles" on public.profiles for select to anon
  using (discoverable and profile_visibility = 'public');
```

- [ ] **Step 4: Reset and prove RLS plus legacy behavior**

Run: `pnpm db:reset`

Expected: migrations through `0039` apply.

Run: `pnpm --filter @qa-mastery/db test:rls -- learner-preferences-rls.test.ts talent-rls.test.ts community-rls.test.ts rls-coverage.test.ts`

Expected: PASS; private profiles are hidden while public talent-profile behavior remains intact.

- [ ] **Step 5: Commit preference storage**

```bash
git add supabase/migrations/20260726000039_learner_preferences.sql packages/db/test/learner-preferences-rls.test.ts
git commit -m "feat(profile): add learner preferences and privacy"
```

### Task 2: Add Authoritative Skill Evidence and Mastery

**Files:**
- Create: `supabase/migrations/20260726000040_skill_evidence.sql`
- Create: `packages/db/test/skill-mastery-rls.test.ts`
- Create: `apps/platform/src/lib/mastery/sql-parity.test.ts`

**Interfaces:**
- Consumes: `computeSkillMastery(evidence, now)` from the adaptive plan's grading foundation.
- Produces: mandated `skill_evidence`, `skill_mastery`, service-only `recompute_skill_mastery(target uuid)`, and SQL/TypeScript parity evidence.

- [ ] **Step 1: Write failing mastery RLS tests**

```ts
it("lets learners read only their service-written evidence and mastery", async () => {
  await service.from("skill_evidence").insert({ user_id: aliceId, skill_key: "api-testing", source: "diagnostic", source_id: "attempt-1:q5", score: 80, confidence: 0.5, demonstrated_at: new Date().toISOString(), metadata: {} });
  await service.rpc("recompute_skill_mastery", { target: aliceId });
  expect((await asAlice.from("skill_mastery").select("skill_key,state")).data).toEqual(expect.arrayContaining([expect.objectContaining({ skill_key: "api-testing" })]));
  expect((await asBob.from("skill_mastery").select("skill_key").eq("user_id", aliceId)).data ?? []).toHaveLength(0);
});
it("blocks learner-authored scores and mastery", async () => {
  expect((await asAlice.from("skill_evidence").insert({ user_id: aliceId, skill_key: "security-testing", source: "diagnostic", source_id: "forged", score: 100, confidence: 1, demonstrated_at: new Date().toISOString() })).error).not.toBeNull();
  expect((await asAlice.from("skill_mastery").insert({ user_id: aliceId, skill_key: "security-testing", state: "verified", score: 100, confidence: 1, evidence_count: 99 })).error).not.toBeNull();
});
```

- [ ] **Step 2: Run and confirm missing relations**

Run: `pnpm --filter @qa-mastery/db test:rls -- skill-mastery-rls.test.ts`

Expected: FAIL because `skill_evidence` does not exist.

- [ ] **Step 3: Create exact tables and owner-read policies**

```sql
-- supabase/migrations/20260726000040_skill_evidence.sql
create table public.skill_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_key text not null check (skill_key in ('qa-foundations','test-design','exploratory-testing','defect-reporting','api-testing','database-testing','ui-automation','performance-testing','security-testing','ci-cd','communication','test-strategy')),
  source text not null check (source in ('diagnostic','quiz','note','bug_report','test_case','code_run','task','capstone','certificate')),
  source_id text not null check (char_length(source_id) between 1 and 200),
  score smallint not null check (score between 0 and 100),
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  demonstrated_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  unique(user_id, skill_key, source, source_id)
);
create table public.skill_mastery (
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_key text not null check (skill_key in ('qa-foundations','test-design','exploratory-testing','defect-reporting','api-testing','database-testing','ui-automation','performance-testing','security-testing','ci-cd','communication','test-strategy')),
  state text not null check (state in ('emerging','developing','proficient','verified','needs_refresh')),
  score smallint not null check (score between 0 and 100),
  confidence numeric(4,3) not null check (confidence between 0 and 1),
  evidence_count integer not null check (evidence_count > 0),
  last_demonstrated_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key(user_id, skill_key)
);
create index skill_evidence_owner_date on public.skill_evidence(user_id, demonstrated_at desc);
create index skill_evidence_skill_date on public.skill_evidence(skill_key, demonstrated_at desc);
alter table public.skill_evidence enable row level security;
alter table public.skill_mastery enable row level security;
create policy "owners read skill evidence" on public.skill_evidence for select using ((select auth.uid()) = user_id);
create policy "owners read skill mastery" on public.skill_mastery for select using ((select auth.uid()) = user_id);
```

- [ ] **Step 4: Add the deterministic recomputation function**

```sql
create or replace function public.recompute_skill_mastery(target uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.skill_mastery(user_id, skill_key, state, score, confidence, evidence_count, last_demonstrated_at, updated_at)
  with aggregate as (
    select user_id, skill_key,
      round(sum(score * confidence) / nullif(sum(confidence), 0))::smallint as weighted_score,
      least(1::numeric, sum(confidence) / 3)::numeric(4,3) as combined_confidence,
      count(*)::integer as item_count,
      max(demonstrated_at) as last_seen
    from public.skill_evidence where user_id = target group by user_id, skill_key
  )
  select user_id, skill_key,
    case
      when last_seen < now() - interval '180 days' then 'needs_refresh'
      when weighted_score >= 85 and combined_confidence >= 0.75 and item_count >= 3 then 'verified'
      when weighted_score >= 70 then 'proficient'
      when weighted_score >= 40 then 'developing'
      else 'emerging'
    end,
    weighted_score, combined_confidence, item_count, last_seen, now()
  from aggregate
  on conflict(user_id, skill_key) do update set
    state=excluded.state, score=excluded.score, confidence=excluded.confidence,
    evidence_count=excluded.evidence_count, last_demonstrated_at=excluded.last_demonstrated_at, updated_at=now();
  delete from public.skill_mastery m where m.user_id = target and not exists (
    select 1 from public.skill_evidence e where e.user_id=m.user_id and e.skill_key=m.skill_key
  );
end;
$$;
revoke all on function public.recompute_skill_mastery(uuid) from public;
grant execute on function public.recompute_skill_mastery(uuid) to service_role;
```

- [ ] **Step 5: Reset, test, and commit**

Before the commit, create a parity integration test that inserts representative evidence fixtures for emerging, developing, proficient, verified, and 181-day stale outcomes; computes the expected rows with `computeSkillMastery(fixtures, now)`; invokes `recompute_skill_mastery`; reads SQL rows; and compares `state`, rounded weighted `score`, combined `confidence`, `evidence_count`, and `last_demonstrated_at`. Use a fixed `now` fixture and evidence timestamps so the 180-day boundary is deterministic. The SQL and TypeScript implementations must both use weighted score, confidence capped at 1 from summed evidence confidence divided by 3, stale-after-180-days, and verified thresholds score 85/confidence 0.75/count 3.

Run: `pnpm db:reset`

Run: `pnpm --filter @qa-mastery/db test:rls -- skill-mastery-rls.test.ts rls-coverage.test.ts`

Expected: PASS; learners cannot create evidence/mastery.

Run in the same Supabase environment used by RLS tests: `pnpm --filter @qa-mastery/platform test -- src/lib/mastery/sql-parity.test.ts`

Expected: PASS with identical SQL and `computeSkillMastery` states/scores/confidence/count/recency for every fixture.

```bash
git add supabase/migrations/20260726000040_skill_evidence.sql packages/db/test/skill-mastery-rls.test.ts apps/platform/src/lib/mastery/sql-parity.test.ts
git commit -m "feat(mastery): add authoritative skill evidence"
```

### Task 3: Build Preference Validation and the Optional Diagnostic

**Files:**
- Create: `apps/platform/src/lib/onboarding/schema.ts`
- Create: `apps/platform/src/lib/onboarding/diagnostic.ts`
- Create: `apps/platform/src/lib/onboarding/diagnostic.test.ts`
- Create: `apps/platform/src/lib/onboarding/data.ts`

**Interfaces:**
- Produces: `LearnerPreferencesSchema`, `DIAGNOSTIC_QUESTIONS`, `gradeDiagnostic()`, `getLearnerPreferences()`, `isValidTimeZone()`.

- [ ] **Step 1: Write failing validation and grading tests**

```ts
it("grades each diagnostic answer into one bounded evidence item", () => {
  const result = gradeDiagnostic({ "qa-foundations": 1, "api-testing": 2 });
  expect(result).toEqual([
    expect.objectContaining({ skillKey: "qa-foundations", score: 100, confidence: 0.35 }),
    expect.objectContaining({ skillKey: "api-testing", score: 0, confidence: 0.35 }),
  ]);
});
it("rejects an unknown timezone and invalid reminder hour", () => {
  expect(isValidTimeZone("Mars/Olympus")).toBe(false);
  expect(LearnerPreferencesSchema.safeParse(validPrefs({ timezone: "Mars/Olympus" })).success).toBe(false);
  expect(LearnerPreferencesSchema.safeParse(validPrefs({ notifications: { studyDays: [1], reminderHour: 24, digest: "off", quietStart: null, quietEnd: null } })).success).toBe(false);
});
```

- [ ] **Step 2: Run and verify the red result**

Run: `pnpm --filter @qa-mastery/platform test -- src/lib/onboarding/diagnostic.test.ts`

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement strict preference validation**

Use Zod enums matching Global Constraints, `weeklyMinutes` 15–1,200, ISO date validation, unique study-day refinement, 24-hour `HH:mm` quiet values, and:

```ts
export function isValidTimeZone(value: string): boolean {
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }).format(); return true; }
  catch { return false; }
}
```

- [ ] **Step 4: Define the immutable 12-question bank and grader**

Each question has `skillKey`, `prompt`, four options, one `correctIndex`, and a source lesson path. The bank covers all 12 exact skill keys once. `gradeDiagnostic` ignores unanswered/unknown keys, returns score 100 or 0 with confidence 0.35, and includes `{ questionId, selectedIndex }` metadata; no answer text is stored.

- [ ] **Step 5: Add server-only preference DTO reads**

`data.ts` imports `server-only`, reads through request-scoped RLS, validates database JSON with the same schema, and returns a camelCase DTO. Invalid legacy JSON falls back only the malformed sub-object to the documented defaults and records a server warning without values.

- [ ] **Step 6: Run tests and commit**

Run: `pnpm --filter @qa-mastery/platform test -- src/lib/onboarding/diagnostic.test.ts`

Expected: PASS.

```bash
git add apps/platform/src/lib/onboarding
git commit -m "feat(onboarding): define preferences and diagnostic"
```

### Task 4: Build the Three-Stage Onboarding and Auth Destination Rules

**Files:**
- Create: `apps/platform/src/app/(app)/onboarding/page.tsx`
- Create: `apps/platform/src/app/(app)/onboarding/onboarding-wizard.tsx`
- Create: `apps/platform/src/app/(app)/onboarding/actions.ts`
- Governor modify after auth lock release: `apps/platform/src/app/(auth)/actions.ts`
- Governor modify after auth lock release: `apps/platform/src/app/auth/callback/route.ts`
- Create: `e2e/tests/onboarding.spec.ts`

**Interfaces:**
- Produces: outcome → baseline/diagnostic → commitment flow; `saveOnboardingAction()`, `submitDiagnosticAction()`, `resolvePostAuthDestination()`.

- [ ] **Step 1: Write the failing first-session journey**

```ts
test("new learner sets a goal and lands on a personalized first milestone", async ({ page }) => {
  await signUpFreshLearner(page, "onboarding", { expectedDestination: /\/onboarding/ });
  await page.getByRole("radio", { name: "Get my first QA role" }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("radio", { name: "Complete beginner" }).check();
  await page.getByRole("radio", { name: "Balanced manual and automation" }).check();
  await page.getByRole("button", { name: "Skip diagnostic" }).click();
  await page.getByLabel("Weekly study target").selectOption("180");
  await page.getByRole("button", { name: "Create my learning plan" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText("Your first milestone")).toBeVisible();
});
```

- [ ] **Step 2: Run and confirm current dashboard redirect**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/onboarding.spec.ts --project=chromium`

Expected: FAIL because signup lands directly on `/dashboard` and `/onboarding` is absent.

- [ ] **Step 3: Add preference and diagnostic actions**

`saveOnboardingAction(input)` authenticates, validates, upserts `learner_preferences`, updates `profiles.onboarding_completed_at=now()`, revalidates `/dashboard` and `/settings`, then returns `{ ok:true, destination:"/dashboard" }`. `submitDiagnosticAction(attemptId, answers)` UUID-validates the client attempt ID, grades answers, service-upserts `skill_evidence` with source `diagnostic` and source IDs `<attemptId>:<skillKey>`, calls `recompute_skill_mastery`, and returns only `{ skillKey, score }[]`.

- [ ] **Step 4: Build accessible staged UI**

Use fieldsets/legends, radiogroups, a visible “Step 1 of 3”, Back, Skip diagnostic, and a final review. Persist in-progress non-sensitive choices to `sessionStorage` key `qa-mastery:onboarding`; remove after success. The final screen states the exact first milestone derived from preferred path and outcome.

- [ ] **Step 5: Integrate safe post-auth routing through the governor**

After successful login/signup/callback, preserve a validated explicit `next` destination. Without `next`, query `learner_preferences` for the authenticated user: missing row routes to `/onboarding`, existing row routes to `/dashboard`. Do not query in Proxy; the local authentication guide reserves Proxy for optimistic cookie checks.

- [ ] **Step 6: Run E2E and commit**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/onboarding.spec.ts tests/login.spec.ts tests/signup.spec.ts tests/auth.spec.ts --project=chromium`

Expected: PASS; explicit destinations still win, password recovery still routes to reset, returning learners skip onboarding.

```bash
git add 'apps/platform/src/app/(app)/onboarding' e2e/tests/onboarding.spec.ts
git commit -m "feat(onboarding): personalize the first session"
```

The governor commits the two auth files separately as `feat(auth): route new learners through onboarding` after running auth tests.

### Task 5: Expand Settings, Avatar Upload, Privacy, and Session Controls

**Files:**
- Modify: `apps/platform/src/app/(app)/settings/page.tsx`
- Modify: `apps/platform/src/app/(app)/settings/actions.ts`
- Modify: `apps/platform/src/app/(app)/settings/settings-form.tsx`
- Create: `apps/platform/src/app/(app)/settings/privacy-form.tsx`
- Create: `apps/platform/src/app/(app)/settings/learning-form.tsx`
- Create: `apps/platform/src/app/(app)/settings/accessibility-form.tsx`
- Create: `apps/platform/src/app/(app)/settings/avatar-cropper.tsx`
- Create: `apps/platform/src/app/(app)/settings/privacy-data-link.tsx`
- Create: `apps/platform/src/app/(app)/settings/avatar-cropper.test.tsx`

**Interfaces:**
- Produces: profile-completion meter, avatar crop/upload, learning/accessibility/notification/privacy controls, current-session display, sign-out-other-sessions, and a reserved Privacy & data destination owned by migration `0044`.

- [ ] **Step 1: Write the failing profile-completion test**

```ts
it("uses evidence-backed completion fields", () => {
  expect(calculateProfileCompletion({ displayName: true, username: true, avatar: false, goal: true, baseline: false, portfolio: true }))
    .toEqual({ completed: 4, total: 6, percent: 67, missing: ["Avatar", "Skill baseline"] });
});
```

- [ ] **Step 2: Run and confirm the missing calculator**

Run: `pnpm --filter @qa-mastery/platform test -- 'src/app/(app)/settings/settings-form.test.ts'`

Expected: FAIL.

- [ ] **Step 3: Split settings into stable sections and narrow actions**

Create separate actions `updateCoreProfileAction`, `updateLearningPreferencesAction`, `updateAccessibilityPreferencesAction`, `updateProfilePrivacyAction`, and `signOutOtherSessionsAction`. Every action authenticates and validates. `signOutOtherSessionsAction` calls `supabase.auth.signOut({ scope: "others" })`; the page labels only the current browser because Supabase does not expose a trustworthy per-device session inventory through the current client API.

- [ ] **Step 4: Replace avatar URL with crop/upload**

Read PNG/JPEG/WebP under 5 MiB with `createImageBitmap`, render a square crop to a 512×512 canvas, export `image/webp` quality `0.86`, upload to `talent-avatars/<userId>/profile-avatar` through existing storage RLS, and update `profiles.avatar_url` to the public URL. Revoke object URLs on cleanup. Preserve alt text “Your profile photo” and keyboard-operable zoom/position controls.

- [ ] **Step 5: Add privacy and preference forms**

Privacy controls map exactly to migration `0039` fields. Learning and accessibility forms reuse Task 3 schema. Global notification form edits only `learner_preferences.notifications`; community category toggles link to `/notifications` and remain stored in `community_notification_preferences`.

`PrivacyDataLink` links to the route reserved by the privacy plan and states “Export your data or schedule account deletion”. It contains no export fetch, deletion mutation, secret, countdown, or immediate-delete control; migration `0044` supplies the complete export and seven-day cancellable deletion workflow.

- [ ] **Step 6: Run interaction/static checks and commit**

Run:

```bash
pnpm --filter @qa-mastery/platform test -- 'src/app/(app)/settings'
pnpm --filter @qa-mastery/platform lint
pnpm --filter @qa-mastery/platform typecheck
```

Expected: all exit 0.

```bash
git add 'apps/platform/src/app/(app)/settings'
git commit -m "feat(settings): add learning profile and privacy controls"
```

### Task 6: Reconcile Existing Activity into Mastery Evidence

**Files:**
- Create: `apps/platform/src/lib/mastery/taxonomy.ts`
- Create: `apps/platform/src/lib/mastery/evidence.ts`
- Create: `apps/platform/src/lib/mastery/evidence.test.ts`
- Create: `apps/platform/src/lib/mastery/data.ts`
- Create: `apps/platform/src/app/(app)/progress/actions.ts`

**Interfaces:**
- Produces: 12-skill taxonomy, `mapActivityToEvidence()`, `refreshMyMasteryAction()`, `getMyMastery()`, `getPeerBenchmark()`.

- [ ] **Step 1: Write failing evidence mapping tests**

```ts
it("maps authoritative activity without treating volume as competence", () => {
  expect(mapActivityToEvidence({ kind: "bug_report", id: "b1", target: "buggyapi", matched: true, createdAt: ISO }))
    .toEqual(expect.objectContaining({ skillKey: "api-testing", score: 85, confidence: 0.7, source: "bug_report" }));
  expect(mapActivityToEvidence({ kind: "code_run", id: "r1", language: "typescript", passed: false, createdAt: ISO }))
    .toEqual(expect.objectContaining({ skillKey: "ui-automation", score: 30, confidence: 0.35 }));
});
it("maps note modules to explicit skill keys", () => {
  expect(skillForNoteSlug("api-testing/rest/http-methods")).toBe("api-testing");
  expect(skillForNoteSlug("security-testing-web/owasp/broken-access-control")).toBe("security-testing");
});
```

- [ ] **Step 2: Run and confirm missing mappings**

Run: `pnpm --filter @qa-mastery/platform test -- src/lib/mastery/evidence.test.ts`

Expected: FAIL.

- [ ] **Step 3: Define exact taxonomy and activity weights**

Each skill has label, description, recommended Knowledge Base module, and role paths. Evidence mappings are fixed: diagnostic 0.35; completed note score 60/confidence 0.2; normalized quiz score/confidence 0.55; matched bug score 85/confidence 0.7 otherwise 30/0.3; ready test case 70/0.4 and passed 85/0.55; successful code run 75/0.45 otherwise 30/0.35; passed task 85/0.7 otherwise its bounded score/0.45; capstone bounded score/0.8; certificate 100/1.0.

- [ ] **Step 4: Implement server-only reconciliation**

`refreshMyMasteryAction` authenticates then delegates to `reconcileMastery(userId)`. The DAL selects only the current user's rows through service filters, maps each to `{ user_id, skill_key, source, source_id, score, confidence, demonstrated_at, metadata }`, upserts on `user_id,skill_key,source,source_id`, invokes `recompute_skill_mastery`, and returns counts only. Never accept a score from client input.

- [ ] **Step 5: Implement opt-in cohort benchmark**

Return null unless the caller's `peer_benchmark_opt_in` is true. Build a cohort from opted-in profiles joined to same `experience_level` and `preferred_path`, with a mastery update in the last 180 days. If fewer than 20, return `{ available:false, cohortSize }`. Otherwise return per skill `{ cohortSize, lowerQuartile, median, upperQuartile, myScore }`; no user IDs or exact rank.

- [ ] **Step 6: Run tests and commit**

Run: `pnpm --filter @qa-mastery/platform test -- src/lib/mastery/evidence.test.ts`

Expected: PASS.

```bash
git add apps/platform/src/lib/mastery 'apps/platform/src/app/(app)/progress/actions.ts'
git commit -m "feat(mastery): reconcile learning evidence"
```

### Task 7: Build the Mastery Dashboard and Explainable Recommendations

**Files:**
- Create: `apps/platform/src/lib/mastery/recommendations.ts`
- Create: `apps/platform/src/lib/mastery/recommendations.test.ts`
- Create: `apps/platform/src/app/(app)/progress/page.tsx`
- Create: `apps/platform/src/app/(app)/progress/mastery-dashboard.tsx`
- Create: `apps/platform/src/app/(app)/progress/diagnostic-panel.tsx`
- Governor modify: `apps/platform/src/app/(app)/dashboard/page.tsx`
- Governor modify: `apps/platform/src/app/(app)/dashboard/components/recommended-next-card.tsx`
- Create: `e2e/tests/mastery.spec.ts`

**Interfaces:**
- Produces: strongest/weakest/improving/refresh panels, evidence details, next action, role readiness, optional benchmark ranges.

- [ ] **Step 1: Write failing recommendation tests**

```ts
it("prioritizes stale and weak goal-relevant skills with an explanation", () => {
  const rec = recommendNextActivity({ preferredPath: "api", mastery: [
    mastery("api-testing", "developing", 52), mastery("qa-foundations", "needs_refresh", 80),
  ] });
  expect(rec).toMatchObject({ skillKey: "api-testing", href: "/notes/api-testing", reason: expect.stringContaining("API path") });
});
it("calculates role readiness only from named required skills", () => {
  expect(calculateRoleReadiness("manual", [mastery("qa-foundations", "proficient", 80), mastery("test-design", "developing", 50)]))
    .toMatchObject({ percent: expect.any(Number), missingSkills: expect.arrayContaining(["exploratory-testing", "defect-reporting"]) });
});
```

- [ ] **Step 2: Run and confirm missing functions**

Run: `pnpm --filter @qa-mastery/platform test -- src/lib/mastery/recommendations.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement deterministic recommendations and readiness**

Rank goal-required skills by state priority `needs_refresh`, `not_assessed`, `emerging`, `developing`, `proficient`, `verified`, then score ascending, then taxonomy order. Readiness is the arithmetic mean of available required-skill scores with missing skills scored zero; return the named denominator and evidence timestamp. Copy states “evidence-based estimate, not a hiring guarantee”.

- [ ] **Step 4: Build the owner-only dashboard**

Server-load preferences, 12 synthesized mastery rows, evidence counts, recommendation, role readiness, and optional benchmark. Render state labels, score, confidence, evidence count, last demonstrated date, “Needs refresh” reasons, and links. Do not display private diagnostic answers or peer identities.

- [ ] **Step 5: Add browser coverage and dashboard integration**

E2E completes diagnostic, refreshes mastery, verifies one state/evidence panel and exact recommendation reason, opts into comparison and verifies the minimum-cohort unavailable message. The governor adds a compact “Skill mastery” dashboard card linking `/progress` after its file lock is released.

- [ ] **Step 6: Run and commit**

Run: `pnpm --filter @qa-mastery/e2e exec playwright test tests/mastery.spec.ts --project=chromium`

Expected: PASS.

```bash
git add apps/platform/src/lib/mastery/recommendations.ts apps/platform/src/lib/mastery/recommendations.test.ts 'apps/platform/src/app/(app)/progress' e2e/tests/mastery.spec.ts
git commit -m "feat(mastery): add explainable skill dashboard"
```

### Task 8: Add Weekly Plan and In-App Study Reminders

**Files:**
- Create: `apps/platform/src/app/api/study-reminders/route.ts`
- Create: `apps/platform/src/lib/onboarding/reminders.ts`
- Create: `apps/platform/src/lib/onboarding/reminders.test.ts`
- Governor modify: `apps/platform/vercel.json`
- Governor modify: central environment schema and `.env.example`
- Modify: `apps/platform/src/app/(app)/dashboard/page.tsx` only after governor lock transfer

**Interfaces:**
- Produces: `shouldSendStudyReminder()`, daily cron endpoint, deduplicated weekly plan notifications, dashboard weekly target progress.

- [ ] **Step 1: Write failing timezone/quiet-hour tests**

```ts
it("sends only on a configured local study day/hour outside quiet hours", () => {
  expect(shouldSendStudyReminder(prefs({ studyDays: [1], reminderHour: 18, timezone: "Asia/Kathmandu" }), new Date("2026-07-27T12:15:00Z"))).toBe(true);
  expect(shouldSendStudyReminder(prefs({ studyDays: [1], reminderHour: 18, timezone: "Asia/Kathmandu", quietStart: "18:00", quietEnd: "20:00" }), new Date("2026-07-27T12:15:00Z"))).toBe(false);
});
```

- [ ] **Step 2: Run and verify missing helper**

Run: `pnpm --filter @qa-mastery/platform test -- src/lib/onboarding/reminders.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement deterministic timezone scheduling**

Use `Intl.DateTimeFormat(..., { timeZone, weekday:"short", hour:"2-digit", hourCycle:"h23", minute:"2-digit" }).formatToParts(now)`; send within the configured hour only, respect wraparound quiet windows, require `reminder_enabled`, and skip a user whose current-week XP/note activity already meets `weekly_minutes` converted by a documented proxy of 10 minutes per completed note until real duration tracking exists.

- [ ] **Step 4: Add cron Route Handler with exact-commit-safe authorization**

`GET` requires `Authorization: Bearer ${CRON_SECRET}` and returns 401 otherwise. Service-query eligible preferences in pages of 500; use `shouldSendStudyReminder`; insert an `announcement` notification with href `/dashboard`, message including the weekly target, and dedupe key `study-reminder:<userId>:<ISO-week>:<day>`. Return counts only and never log user IDs.

- [ ] **Step 5: Register the cron through the governor**

Add `{ "path": "/api/study-reminders", "schedule": "0 * * * *" }` to `apps/platform/vercel.json`. Add `CRON_SECRET` to the central server schema if it is not already formalized by the help-agent cron; one canonical secret field is used by both endpoints.

- [ ] **Step 6: Run tests and commit**

Run: `pnpm --filter @qa-mastery/platform test -- src/lib/onboarding/reminders.test.ts`

Expected: PASS.

```bash
git add apps/platform/src/lib/onboarding/reminders.ts apps/platform/src/lib/onboarding/reminders.test.ts apps/platform/src/app/api/study-reminders
git commit -m "feat(onboarding): add in-app study reminders"
```

### Task 9: Run the Integrated Verification Gate

**Files:**
- Modify: `e2e/tests/onboarding.spec.ts`
- Modify: `e2e/tests/mastery.spec.ts`
- Governor modify: authenticated Profile/Progress navigation and dashboard cards

**Interfaces:**
- Produces: release evidence for onboarding, preferences, profile privacy, mastery, and reminders.

- [ ] **Step 1: Add accessibility and negative authorization cases**

Cover keyboard-only three-stage onboarding, diagnostic skip, 200% zoom, private-profile invisibility, cross-user mastery isolation, SQL/TypeScript mastery parity, benchmark minimum cohort, cron 401, and the non-mutating Privacy & data link to the migration `0044` route. Add axe scans for onboarding, settings, and progress in light/dark themes.

- [ ] **Step 2: Run the full gate**

```bash
pnpm db:reset
pnpm --filter @qa-mastery/db test:rls
pnpm --filter @qa-mastery/platform test
pnpm --filter @qa-mastery/platform lint
pnpm --filter @qa-mastery/platform typecheck
pnpm --filter @qa-mastery/platform build
pnpm --filter @qa-mastery/e2e exec playwright test tests/onboarding.spec.ts tests/mastery.spec.ts tests/auth.spec.ts tests/a11y.spec.ts --project=chromium
git diff --check
```

Expected: every command exits 0; preferences are owner-only; evidence/mastery reject learner writes; SQL and `computeSkillMastery` agree; auth destination preservation remains green; private profiles stay hidden; reminders deduplicate; benchmarking returns no identities; no migration `0044` privacy behavior is duplicated.

- [ ] **Step 3: Commit governor-owned integration after lock transfer**

Add Progress and Settings under Profile navigation, onboarding-aware dashboard milestone/weekly-plan/mastery cards, auth routing, environment fields, and cron registration in separate governor commits. Run the focused tests after each shared-file commit rather than batching unrelated changes.

- [ ] **Step 4: Record the handoff**

Record migrations `0039` and `0040`, the adaptive-foundation dependency revision, all feature and governor commits, RLS/unit/parity/lint/type/build/E2E outputs, cron authorization evidence, migration `0044` link boundary, changed paths, and exclusions in the lane ledger. Mark status `review`; only the governor marks it integrated.
