# Privacy and Media Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give learners complete data export and recoverable account deletion while preventing unscanned uploads from becoming public.

**Architecture:** A declarative data-domain registry drives export, purge, retention documentation, and coverage tests so new user-owned tables cannot silently escape privacy handling. Account deletion uses a seven-day cancellable request and a service-role processor with an explicit audit trail. Uploads enter private quarantine, pass type/hash/malware checks, and are copied to public or private clean buckets only after a signed scan result.

**Tech Stack:** TypeScript 5, Next.js 16 Route Handlers and Server Actions, Zod 4, Supabase Auth/PostgreSQL/Storage RLS, Vitest 4, Playwright, `fflate` 0.8.2, HMAC-SHA256 scanner callbacks.

## Global Constraints

- Reserve `20260726000044_privacy_requests.sql` and `20260726000045_media_quarantine.sql`; the integration governor applies them after migrations 0036–0043.
- No real user data is deleted during implementation or verification. Tests use local Supabase fixtures and prove cancellation before purge.
- Account deletion requires reauthentication, an explicit typed confirmation, seven-day grace period, and a final background processor; it is never an immediate button-side cascade.
- Export and purge registries must cover every current and future user-owned table, storage bucket, and external processor or fail CI.
- Audit and security records retain only the lawful minimum and dissociate the deleted account; product content, private notes, code, messages, media, and profile data are removed.
- Quarantine buckets are private and have no anonymous read policy. Public URLs exist only for records whose scan status is `clean`.
- Production upload scanning fails closed. A missing scanner configuration leaves the asset quarantined and never silently marks it clean.
- Scanner callbacks require timestamped HMAC verification, a five-minute replay window, constant-time comparison, known asset ID, matching content hash, and idempotent state transitions.
- Media descriptions are required for informative community images and may be explicitly marked decorative only where product rules allow it.
- All service-role export, purge, promotion, rejection, and callback operations emit privacy-safe audit records without filenames, object bodies, user email, or raw storage paths.
- Read the installed Next.js 16 Route Handler and environment-variable guides before editing those boundaries.

---

## File Structure

### Privacy registry, requests, export, and deletion

- Create `apps/platform/src/lib/privacy/data-domains.ts` — table/storage/external-processor registry.
- Create `apps/platform/test/privacy-registry.test.ts` — migration and registry completeness checks.
- Create `supabase/migrations/20260726000044_privacy_requests.sql` and `packages/db/test/privacy-requests-rls.test.ts`.
- Create `apps/platform/src/lib/privacy/export.ts`, `apps/platform/src/lib/privacy/purge.ts`, and focused tests.
- Create `apps/platform/src/app/api/privacy/export/route.ts` and `apps/platform/test/privacy-export-route.test.ts`.
- Create `apps/platform/src/app/(app)/settings/privacy/actions.ts` and `apps/platform/src/app/(app)/settings/privacy/privacy-controls.tsx`.
- Create `apps/platform/src/app/api/internal/privacy/process/route.ts` and tests.
- Modify `apps/platform/src/app/(app)/settings/page.tsx` and `.env.example`.
- Create `e2e/tests/privacy-controls.spec.ts`.

### Quarantined media pipeline

- Create `supabase/migrations/20260726000045_media_quarantine.sql` and `packages/db/test/media-quarantine-rls.test.ts`.
- Create `apps/platform/src/lib/media/types.ts`, `detect.ts`, `scanner.ts`, `repository.ts`, and tests.
- Create `apps/platform/src/app/api/media/upload/route.ts`, `apps/platform/src/app/api/media/scan-callback/route.ts`, and route tests.
- Modify `apps/platform/src/lib/community/media.ts`, community composer/actions/cards, talent avatar and portfolio upload paths.
- Create `apps/platform/src/components/media/upload-field.tsx`, `media-status.tsx`, and `responsive-media.tsx`.
- Create `e2e/tests/media-quarantine.spec.ts`.

### Public policy and operations

- Create `apps/platform/src/app/privacy/page.tsx` and `apps/platform/src/app/terms/page.tsx`.
- Create `docs/privacy/data-inventory.md`, `docs/privacy/retention.md`, `docs/privacy/subprocessors.md`, `docs/runbooks/privacy-requests.md`, and `docs/runbooks/media-quarantine.md`.
- Modify `SECURITY.md`, `README.md`, and deployment documentation.

---

### Task 1: Create a mechanically complete privacy data registry

**Files:**
- Create: `apps/platform/src/lib/privacy/data-domains.ts`
- Create: `apps/platform/test/privacy-registry.test.ts`

**Interfaces:**
- Produces: `USER_DATA_TABLES`, `USER_STORAGE_DOMAINS`, `EXTERNAL_PROCESSORS`, and `assertPrivacyRegistryCoverage`.

- [ ] **Step 1: Write a failing migration-coverage test**

```ts
it("classifies every table that references profiles", () => {
  const migrationTables = extractUserOwnedTables(readMigrations());
  expect(findUnregisteredUserTables(migrationTables, USER_DATA_TABLES)).toEqual([]);
});

it("defines export, purge, and retention behavior for each domain", () => {
  for (const domain of USER_DATA_TABLES) {
    expect(domain).toMatchObject({ table: expect.any(String), ownerColumn: expect.any(String), export: expect.any(Boolean), purge: expect.any(String), retention: expect.any(String) });
  }
});
```

- [ ] **Step 2: Run and confirm the registry is absent**

Run: `pnpm --filter @qa-mastery/platform test -- privacy-registry.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement explicit data-domain contracts**

```ts
export interface UserDataDomain {
  table: string;
  ownerColumn: string;
  export: boolean;
  purge: "cascade" | "delete" | "dissociate";
  retention: string;
}

export const USER_DATA_TABLES: readonly UserDataDomain[] = [
  { table: "profiles", ownerColumn: "id", export: true, purge: "cascade", retention: "account lifetime" },
  { table: "progress", ownerColumn: "user_id", export: true, purge: "cascade", retention: "account lifetime" },
  { table: "quiz_attempts", ownerColumn: "user_id", export: true, purge: "cascade", retention: "account lifetime" },
  { table: "review_queue", ownerColumn: "user_id", export: true, purge: "cascade", retention: "account lifetime" },
  { table: "xp_events", ownerColumn: "user_id", export: true, purge: "cascade", retention: "account lifetime" },
  { table: "bug_reports", ownerColumn: "user_id", export: true, purge: "cascade", retention: "account lifetime" },
  { table: "code_runs", ownerColumn: "user_id", export: true, purge: "cascade", retention: "90 days" },
  { table: "help_agent_messages", ownerColumn: "user_id", export: true, purge: "cascade", retention: "7 days" },
  { table: "help_agent_profiles", ownerColumn: "user_id", export: true, purge: "cascade", retention: "account lifetime" },
  { table: "help_agent_memories", ownerColumn: "user_id", export: true, purge: "cascade", retention: "account lifetime" },
  { table: "personal_notes", ownerColumn: "user_id", export: true, purge: "cascade", retention: "account lifetime" },
  { table: "code_workspaces", ownerColumn: "owner_id", export: true, purge: "cascade", retention: "account lifetime" },
  { table: "learner_preferences", ownerColumn: "user_id", export: true, purge: "cascade", retention: "account lifetime" },
  { table: "skill_evidence", ownerColumn: "user_id", export: true, purge: "cascade", retention: "account lifetime" },
  { table: "skill_mastery", ownerColumn: "user_id", export: true, purge: "cascade", retention: "account lifetime" },
  { table: "learning_recommendations", ownerColumn: "user_id", export: true, purge: "cascade", retention: "until expired" },
  { table: "sync_operations", ownerColumn: "user_id", export: false, purge: "cascade", retention: "30 days" },
  { table: "issued_credentials", ownerColumn: "user_id", export: true, purge: "dissociate", retention: "verification lifetime" },
];
```

Complete the array with every existing task, test-case, evidence, sandbox, note-progress/lab, talent, community, notification, feedback, and audit domain discovered by the migration scanner. The coverage test, not this prose, is the completeness authority.

- [ ] **Step 4: Register storage and external processors**

Add bucket/prefix ownership for evidence, scope evidence, talent avatars, talent portfolio, community quarantine/clean media, and future note/workspace attachments. Register Supabase, Vercel, Fly, Paddle, Cloudinary, configured LLM providers, code runners, malware scanner, and telemetry provider with purpose, fields, location, deletion API, and retention.

- [ ] **Step 5: Verify and commit**

Run: `pnpm --filter @qa-mastery/platform test -- privacy-registry.test.ts && pnpm --filter @qa-mastery/platform typecheck`

Expected: PASS with zero unregistered user tables.

```bash
git add apps/platform/src/lib/privacy/data-domains.ts apps/platform/test/privacy-registry.test.ts
git commit -m "feat(privacy): register all user data domains"
```

### Task 2: Add cancellable privacy requests with RLS

**Files:**
- Create: `supabase/migrations/20260726000044_privacy_requests.sql`
- Create: `packages/db/test/privacy-requests-rls.test.ts`

**Interfaces:**
- Produces: `privacy_requests` and service-role-only claim/complete/fail functions.

- [ ] **Step 1: Create the migration and live tests together**

Create `privacy_requests(id uuid, user_id uuid, kind text check export/delete, status text check pending/processing/ready/completed/cancelled/failed, confirmation_hash text, scheduled_for timestamptz, artifact_path text, artifact_expires_at timestamptz, error_code text, created_at, updated_at, completed_at)`. Users may select their own rows, insert their own export request, insert a deletion request only through the authenticated server action, and cancel their own pending request. Authenticated clients cannot mark processing/complete or set artifact paths. Service-role functions claim with `FOR UPDATE SKIP LOCKED` and update terminal states.

- [ ] **Step 2: Prove owner isolation and lifecycle rules**

Test user A cannot read/cancel B, direct processing transition fails, cancellation during the seven-day grace succeeds, cancellation after processing begins fails, and service role claims exactly one pending due request.

- [ ] **Step 3: Reset and run live RLS tests**

Run: `pnpm db:reset && pnpm --filter @qa-mastery/db test:rls -- privacy-requests-rls.test.ts`

Expected: PASS with no RLS exemption.

- [ ] **Step 4: Commit request persistence**

```bash
git add supabase/migrations/20260726000044_privacy_requests.sql packages/db/test/privacy-requests-rls.test.ts
git commit -m "feat(privacy): add cancellable data requests"
```

### Task 3: Build authenticated portable data export

**Files:**
- Create: `apps/platform/src/lib/privacy/export.ts`
- Create: `apps/platform/test/privacy-export.test.ts`
- Create: `apps/platform/src/app/api/privacy/export/route.ts`
- Create: `apps/platform/test/privacy-export-route.test.ts`
- Modify: `apps/platform/package.json`

**Interfaces:**
- Consumes: `USER_DATA_TABLES` and `USER_STORAGE_DOMAINS`.
- Produces: a streamed `qa-mastery-export-YYYY-MM-DD.zip` containing `manifest.json`, table JSON files, and owned storage objects.

- [ ] **Step 1: Write export-boundary tests**

```ts
it("never exports another user's rows or private service fields", async () => {
  const archive = await buildExportArchive("user-a", fakeExportRepository);
  expect(archive.names).toContain("data/personal_notes.json");
  expect(archive.text()).not.toContain("user-b-secret");
  expect(archive.text()).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
});
```

- [ ] **Step 2: Implement export repositories with fixed tables and owner columns**

Never accept table or column names from a request. Iterate the compiled registry, query with the configured owner column, remove internal moderation flags, hashes, service references, answer-key fields, and operational error details, then serialize UTF-8 JSON. Download owned storage objects through the service role only after path ownership is checked; preserve original MIME and safe filename metadata in `manifest.json`.

- [ ] **Step 3: Stream a ZIP with bounded memory**

Add `fflate@0.8.2`. Use its streaming ZIP API, cap individual files at configured bucket limits and total export at 500 MiB, emit entries incrementally, and fail with a stable `export_too_large` code rather than buffering all data. Do not log archive contents or paths.

- [ ] **Step 4: Add the authenticated route**

`GET /api/privacy/export` rechecks `auth.getUser()`, applies a one-export-per-24-hours quota, creates the privacy request, streams the ZIP, marks it completed only after stream close, sets `Content-Disposition`, `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`, and returns 401/429/500 with non-sensitive codes.

- [ ] **Step 5: Verify and commit**

Run: `pnpm install && pnpm --filter @qa-mastery/platform test -- privacy-export.test.ts privacy-export-route.test.ts && pnpm --filter @qa-mastery/platform typecheck`

Expected: PASS.

```bash
git add apps/platform/src/lib/privacy/export.ts apps/platform/test/privacy-export.test.ts apps/platform/src/app/api/privacy/export apps/platform/test/privacy-export-route.test.ts apps/platform/package.json pnpm-lock.yaml
git commit -m "feat(privacy): export portable learner data"
```

### Task 4: Add seven-day account deletion and cancellation

**Files:**
- Create: `apps/platform/src/lib/privacy/purge.ts`
- Create: `apps/platform/test/privacy-purge.test.ts`
- Create: `apps/platform/src/app/(app)/settings/privacy/actions.ts`
- Create: `apps/platform/src/app/(app)/settings/privacy/privacy-controls.tsx`
- Create: `apps/platform/src/app/api/internal/privacy/process/route.ts`
- Create: `apps/platform/test/privacy-process-route.test.ts`
- Modify: `apps/platform/src/app/(app)/settings/page.tsx`
- Modify: `.env.example`
- Create: `e2e/tests/privacy-controls.spec.ts`

**Interfaces:**
- Produces: `requestAccountDeletion`, `cancelAccountDeletion`, and cron-authenticated `processDuePrivacyRequests`.

- [ ] **Step 1: Test confirmation and grace-period behavior**

```ts
it("requires the exact confirmation and schedules seven days ahead", async () => {
  expect(await requestDeletion({ confirmation: "delete" }, fixture)).toEqual({ ok: false, code: "confirmation_required" });
  expect((await requestDeletion({ confirmation: "DELETE MY ACCOUNT" }, fixture)).scheduledFor).toBe("2026-08-02T00:00:00.000Z");
});
```

- [ ] **Step 2: Implement the authenticated actions**

Require a recent authenticated session, exact `DELETE MY ACCOUNT`, and no existing pending deletion. Store only a SHA-256 confirmation audit hash, schedule seven days ahead, email the account address through the configured transactional provider, sign out all current browser sessions, and show the cancellation deadline. Cancellation reauthenticates and updates only a pending request.

- [ ] **Step 3: Implement the fail-safe processor**

The internal route requires `Authorization: Bearer ${PRIVACY_CRON_SECRET}` with constant-time comparison. Claim one due request, delete owned storage, notify/revoke external processor data where APIs exist, revoke active credentials, dissociate legally retained audit/billing references, delete the profile so `ON DELETE CASCADE` removes product rows, call `supabase.auth.admin.deleteUser(userId)`, and mark completed. On any failure, stop, record a stable error code, and never report completed.

- [ ] **Step 4: Add destructive-action fixture tests only**

Use local users with explicit fixture IDs. Prove cancellation preserves data, processing removes only the target, a failed external/storage step leaves the request failed and auth user intact, retries are idempotent, and audit logs contain no email or raw IDs.

- [ ] **Step 5: Add UI and browser coverage**

Settings shows export, deletion explanation, grace date, confirmation dialog, request status, and cancel action. E2E requests then cancels deletion and verifies login still works; it never lets the due processor run against a non-fixture account.

- [ ] **Step 6: Verify and commit**

Run: `pnpm --filter @qa-mastery/platform test -- privacy-purge.test.ts privacy-process-route.test.ts && pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck && pnpm --filter @qa-mastery/e2e e2e -- privacy-controls.spec.ts`

Expected: PASS.

```bash
git add apps/platform/src/lib/privacy/purge.ts apps/platform/test/privacy-purge.test.ts apps/platform/src/app/'(app)'/settings/privacy apps/platform/src/app/'(app)'/settings/page.tsx apps/platform/src/app/api/internal/privacy/process apps/platform/test/privacy-process-route.test.ts e2e/tests/privacy-controls.spec.ts .env.example
git commit -m "feat(privacy): add recoverable account deletion"
```

### Task 5: Add private quarantine and media lifecycle persistence

**Files:**
- Create: `supabase/migrations/20260726000045_media_quarantine.sql`
- Create: `packages/db/test/media-quarantine-rls.test.ts`

**Interfaces:**
- Produces: `media_assets`, private `media-quarantine`, existing clean buckets, and public clean-media view.

- [ ] **Step 1: Create the lifecycle schema**

Create `media_assets(id uuid, user_id uuid, purpose text check community/avatar/portfolio/note, status text check quarantined/scanning/clean/rejected/error, quarantine_path text, clean_bucket text, clean_path text, original_name text, mime_type text, byte_size bigint, sha256 text, alt_text text, decorative boolean, scan_provider text, scan_ref text, scan_error_code text, created_at, scanned_at, published_at, updated_at)`. Constrain informative community images to non-empty alt text, enforce one of clean path or rejection after scanning, and index user/status and hash/status.

- [ ] **Step 2: Add storage policies**

Create private `media-quarantine` with 10 MiB limit and allowlisted image/PDF/text MIME types. Do not grant authenticated direct upload/read; all quarantine access goes through authenticated server routes. Keep `community-media` and `talent-avatars` public only as clean destinations; keep `talent-portfolio` private. Owners read their metadata; service role writes state. Public view returns only clean asset ID, purpose, clean bucket/path, MIME, dimensions, alt text, decorative flag, and publication date.

- [ ] **Step 3: Prove RLS and storage isolation**

Test anon/auth cannot list or fetch quarantine objects, user A cannot read B metadata, direct metadata insert/update fails, service role transitions valid states, invalid clean/rejected combinations fail, and the public view excludes quarantined/rejected assets and internal hashes/paths.

- [ ] **Step 4: Reset, verify, and commit**

Run: `pnpm db:reset && pnpm --filter @qa-mastery/db test:rls -- media-quarantine-rls.test.ts`

Expected: PASS.

```bash
git add supabase/migrations/20260726000045_media_quarantine.sql packages/db/test/media-quarantine-rls.test.ts
git commit -m "feat(media): add private quarantine lifecycle"
```

### Task 6: Implement validated upload and signed scanning boundaries

**Files:**
- Create: `apps/platform/src/lib/media/types.ts`
- Create: `apps/platform/src/lib/media/detect.ts`
- Create: `apps/platform/src/lib/media/scanner.ts`
- Create: `apps/platform/src/lib/media/repository.ts`
- Create: `apps/platform/test/media-detect.test.ts`
- Create: `apps/platform/test/media-scanner.test.ts`
- Create: `apps/platform/src/app/api/media/upload/route.ts`
- Create: `apps/platform/src/app/api/media/scan-callback/route.ts`
- Create: `apps/platform/test/media-routes.test.ts`

**Interfaces:**
- Produces: `POST /api/media/upload` returning `{ assetId, status }` and signed scanner callback processing.

- [ ] **Step 1: Test magic-byte and callback verification**

```ts
it("rejects a JPEG declaration with executable bytes", () => {
  expect(() => detectMediaType(new Uint8Array([0x4d, 0x5a, 0x90]), "image/jpeg")).toThrow(/content does not match/);
});

it("rejects a callback outside the replay window", () => {
  expect(verifyScanSignature(body, signature, "2026-07-26T00:00:00Z", secret, new Date("2026-07-26T00:06:00Z"))).toBe(false);
});
```

- [ ] **Step 2: Implement deterministic validation**

Recognize PNG, JPEG, WebP, GIF, PDF, UTF-8 CSV, and UTF-8 plain text by content, not extension. Enforce purpose-specific MIME/size rules, sanitize display names, compute SHA-256, require alt/decorative classification for community images, and reject SVG/HTML/JS/archives regardless of declared MIME.

- [ ] **Step 3: Implement authenticated quarantine upload**

The upload route resolves the user, accepts one multipart file plus purpose/description, caps the request before buffering, validates bytes, creates metadata, uploads to `media-quarantine/<user-hash>/<asset-id>`, transitions to scanning, obtains a five-minute signed download URL, and calls `MALWARE_SCAN_URL` with asset ID, hash, size, MIME, callback URL, timestamp, and HMAC. In development test mode, a local deterministic scanner rejects the EICAR signature; in production, missing HTTP scanner configuration returns queued/error and leaves the object private.

- [ ] **Step 4: Implement idempotent callback and clean promotion**

Verify HMAC/timestamp/hash, lock the metadata row, ignore an identical terminal replay, reject contradictory replays, and copy clean objects to the purpose bucket under `<user-id>/<asset-id>.<safe-ext>`. Delete quarantine only after copy and metadata transaction succeed. Rejected objects remain private for 24 hours for operator evidence, then a guarded retention job deletes them.

- [ ] **Step 5: Run focused verification and commit**

Run: `pnpm --filter @qa-mastery/platform test -- media-detect.test.ts media-scanner.test.ts media-routes.test.ts && pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck`

Expected: PASS.

```bash
git add apps/platform/src/lib/media apps/platform/test/media-*.test.ts apps/platform/src/app/api/media
git commit -m "feat(media): validate quarantine and scan uploads"
```

### Task 7: Migrate product uploaders to clean-asset references

**Files:**
- Create: `apps/platform/src/components/media/upload-field.tsx`
- Create: `apps/platform/src/components/media/media-status.tsx`
- Create: `apps/platform/src/components/media/responsive-media.tsx`
- Modify: `apps/platform/src/lib/community/media.ts`
- Modify: `apps/platform/src/app/(app)/community/new/composer.tsx`
- Modify: `apps/platform/src/app/(app)/community/actions.ts`
- Modify: `apps/platform/src/app/(app)/community/post-card.tsx`
- Modify: `apps/platform/src/app/(app)/talent/_components/avatar-uploader.tsx`
- Modify: talent portfolio upload components/actions
- Create: `e2e/tests/media-quarantine.spec.ts`

**Interfaces:**
- Consumes: Task 6 upload API and clean-media view.
- Produces: accessible upload progress and only-clean publication.

- [ ] **Step 1: Change media records from raw paths to asset IDs**

`MediaItem` becomes `{ type: "image"; assetId: string; alt: string; decorative: boolean } | { type: "video"; assetId: string; provider: "cloudinary"; alt: string }`. `createPost` resolves each asset server-side, checks ownership/purpose/status clean, and stores the immutable clean projection; raw caller URLs and paths are rejected.

- [ ] **Step 2: Build shared accessible upload states**

Render `Validating`, `Scanning`, `Ready`, `Rejected`, and `Retry` through `role="status"`/`role="alert"`; keep submit disabled until every attachment is clean; allow removal; require alt text or explicit decorative choice; display preview with intrinsic dimensions and responsive sources after promotion.

- [ ] **Step 3: Replace direct browser-to-public uploads**

Community, avatar, and portfolio clients call `/api/media/upload`, poll owner metadata with bounded backoff, and never construct a public Supabase URL from user-controlled path text. Existing clean legacy assets continue rendering through a read-only compatibility mapper until migrated.

- [ ] **Step 4: Add browser scenarios**

Test clean image publication, MIME spoof rejection, EICAR rejection in local scan mode, cross-user asset attachment rejection, informative image without alt rejection, decorative image acceptance, scan-pending submit disabled, and responsive rendered dimensions.

- [ ] **Step 5: Run product verification and commit**

Run: `pnpm --filter @qa-mastery/platform test && pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck && pnpm --filter @qa-mastery/e2e e2e -- media-quarantine.spec.ts community.spec.ts talent-profile.spec.ts`

Expected: PASS.

```bash
git add apps/platform/src/components/media apps/platform/src/lib/community/media.ts apps/platform/src/app/'(app)'/community apps/platform/src/app/'(app)'/talent e2e/tests/media-quarantine.spec.ts
git commit -m "feat(media): publish only scanned accessible assets"
```

### Task 8: Publish policy, retention, and operator evidence

**Files:**
- Create: `apps/platform/src/app/privacy/page.tsx`
- Create: `apps/platform/src/app/terms/page.tsx`
- Create: `docs/privacy/data-inventory.md`
- Create: `docs/privacy/retention.md`
- Create: `docs/privacy/subprocessors.md`
- Create: `docs/runbooks/privacy-requests.md`
- Create: `docs/runbooks/media-quarantine.md`
- Modify: `SECURITY.md`
- Modify: `README.md`
- Modify: `docs/09-deployment.md`

**Interfaces:**
- Consumes: Tasks 1–7.
- Produces: user-facing disclosure and exact operations runbooks.

- [ ] **Step 1: Generate the inventory table from the registry**

Add a script or render helper that converts registry entries into purpose, fields, lawful/product basis, visibility, retention, export, deletion, and processor tables. Fail CI when generated documentation differs from the registry.

- [ ] **Step 2: Publish privacy and terms pages**

Explain collected data, learning analytics, tutor providers, code execution, uploads, community visibility, credentials, cookies/analytics, subprocessors, export, seven-day deletion, retention, contact, and change date in plain language. Do not claim certifications or legal compliance not independently verified.

- [ ] **Step 3: Write executable runbooks**

Document request lookup by request UUID, cancellation, failed export, partial purge, external processor outage, scanner outage, false positive, quarantine retention, public clean-object takedown, and credential revocation. Every procedure includes read-only diagnosis before mutation and requires explicit target confirmation before deletion.

- [ ] **Step 4: Run final privacy/media gate**

Run:

```bash
pnpm db:reset
pnpm --filter @qa-mastery/db test:rls -- privacy-requests-rls.test.ts media-quarantine-rls.test.ts
pnpm --filter @qa-mastery/platform test -- privacy-registry.test.ts privacy-export.test.ts privacy-purge.test.ts media-detect.test.ts media-scanner.test.ts media-routes.test.ts
pnpm --filter @qa-mastery/platform lint
pnpm --filter @qa-mastery/platform typecheck
pnpm --filter @qa-mastery/platform build
pnpm --filter @qa-mastery/e2e e2e -- privacy-controls.spec.ts media-quarantine.spec.ts
```

Expected: PASS; no quarantine object is public; no non-fixture deletion executes; exported fixture archive contains all registered fixture domains and no other user's data.

- [ ] **Step 5: Commit policy and runbooks**

```bash
git add apps/platform/src/app/privacy apps/platform/src/app/terms docs/privacy docs/runbooks/privacy-requests.md docs/runbooks/media-quarantine.md SECURITY.md README.md docs/09-deployment.md
git commit -m "docs: publish privacy and media lifecycle policy"
```
