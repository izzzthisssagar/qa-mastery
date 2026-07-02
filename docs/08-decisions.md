# 08 — Decisions (ADRs)

Short architecture decision records for the choices that shape this codebase.
Format: **Context → Decision → Consequences**.

---

## ADR-1 — Two separate apps with a cookie-free token handoff

**Context.** BuggyShop is *deliberately broken* — its login/signup contain seeded
bugs learners must find. The platform holds the learner's real identity.

**Decision.** Ship two separate apps on separate origins. BuggyShop has its own
fake auth (`bs_users`/`bs_sessions`). Real identity crosses over only through a
signed handoff token in a URL fragment (`/enter#t=…`) → `localStorage` — never a
shared cookie.

**Consequences.** A BuggyShop bug can never escalate into the learner's real
account (fragments aren't sent to servers; no shared cookie). Cost: a token mint/
verify layer (`packages/shared`) and a cross-origin handoff that must stay
Safari-proof — hence WebKit is mandatory in e2e. (Invariants 3 & 4.)

---

## ADR-2 — Answer keys never ship to the client

**Context.** Quizzes and the BuggyShop bug manifest are answer keys. If they
reach the browser, the product is defeated.

**Decision.** Keep keys server-only. Quiz `correct`/`explanation` live in
`*.quiz.json` read only on the server; the learn page sends a stripped projection
and the grader returns the key only *after* submission. The bug manifest lives in
a deny-all schema read server-side.

**Consequences.** Grading must be a server action, not client logic. CI greps the
built bundle to keep it honest. (Invariants 1 & 2.)

---

## ADR-3 — Scores are written only by the service role

**Context.** Completion, XP, and pass/fail must be earned, not self-asserted.

**Decision.** Score tables (`quiz_attempts`, `xp_events`, …) get read-own RLS and
**no write policy**. Writes happen via the service role inside `submitQuiz`.
Low-stakes state (`progress`, `review_queue`) is owner-writable directly.

**Consequences.** A clean line between "earned" data (service-role only) and
"self-reported" data (owner). RLS enforces it in the database, so an app bug
can't grant a forged pass. (Invariant 2; [03](./03-data-model.md).)

---

## ADR-4 — MDX content with a DB registry mirror

**Context.** Lessons need rich authoring *and* relational integrity (progress,
attempts, and flashcards reference lessons by id).

**Decision.** Author lessons as MDX files (source of truth); mirror their
metadata into `tracks`/`modules`/`lessons` via a sync script. Slugs are immutable
once published; removed lessons are archived, not deleted.

**Consequences.** Authors work in files; the DB stays referentially sound. The
sync is a CI gate (validate) and a deploy step (`--apply`). Foreign keys from a
learner's history never dangle. (Invariants 5 & 6; [05](./05-curriculum-and-content.md).)

---

## ADR-5 — TS-source packages + Tailwind `@source`

**Context.** A monorepo of shared packages, wanting fast DX and one type graph.

**Decision.** Internal packages ship TypeScript source (no build step); each app
lists them in `transpilePackages`. For Tailwind v4 to see their classes, each app
`@source`s the package dirs in `globals.css`.

**Consequences.** Edit-and-refresh across packages, a single type-check. Cost: a
new package rendering UI in an app must be added to both `transpilePackages` and
an `@source` line, or its styles silently won't generate. (Both were already in
place when the widget first rendered in the platform.)

---

## ADR-6 — Public-schema grants as an explicit migration (0004)

**Context.** The `init` migration set default privileges for the `buggyshop`
schema but omitted the `public` schema. RLS policies existed, but the underlying
table GRANTs they sit on did not — so every service-role write and RLS-gated read
failed with `permission denied`. It stayed hidden until the first `public` write
(`curriculum sync --apply`).

**Decision.** Add `20260613000004_public_grants.sql`: grant `service_role` full
access, `authenticated` DML (gated by RLS), `anon` select-only, plus default
privileges so future tables inherit the same. RLS remains the security boundary.

**Consequences.** Server actions and the sync now work; the learn flow passes e2e
on both browsers. Lesson learned: an RLS policy is inert without a matching
table-level GRANT — when adding tables, ensure the role grants exist (now
automatic via default privileges). ([03](./03-data-model.md).)

---

## ADR-7 — Deploy via the Vercel CLI token, not the dashboard Git integration

**Context.** Vercel's GitHub integration is connected to account
`temporary-fun111`, but the repo is owned by `izzzthisssagar` — so the dashboard
"import the repo" path can't see it, and the owning account can't be connected
without credentials we won't enter on the user's behalf.

**Decision.** Deploy with the **Vercel CLI token** instead, which targets a
project by `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` and sidesteps GitHub entirely.
Projects were created via the REST API with `rootDirectory` set (monorepo).
CI (`deploy.yml`) does the same on every push to `main`.

**Consequences.** Fully automated CD without resolving the account tangle. Two
gotchas had to be handled: Vercel blocks deploys when the git commit author
isn't a team member (`TEAM_ACCESS_REQUIRED`) → drop git metadata before
deploying (`rm -rf .git` in CI; move `.git` aside locally); and the multi-GB
`.turbo` cache + symlinked `node_modules` abort the upload → `.vercelignore` +
`--archive=tgz`. ([09](./09-deployment.md).)

---

## ADR-8 — Trace curriculum content into the serverless bundle

**Context.** Lesson pages, quiz grading, and the tutor read lesson MDX / quiz
JSON from `packages/curriculum/content` **at request time**. Next's file tracer
follows static imports, not a path computed at runtime, so on Vercel those files
were absent from the serverless functions — every lesson/quiz/tutor route
returned 500 (the original "can't open any lesson" bug). A passing build hides
it, because the build never reads content.

**Decision.** Set `outputFileTracingRoot` (repo root) + `outputFileTracingIncludes`
in `apps/platform/next.config.ts` to force-bundle `packages/curriculum/content`
(and the `pnpm-workspace.yaml` marker `findContentRoot` walks up to) into the
functions.

**Consequences.** Lessons render in production. Lesson learned: dynamic
`fs`-reads of files outside the app dir need explicit tracing includes — local
`next start` works regardless, so this only surfaces on a real serverless
deploy. ([09](./09-deployment.md).)

---

## ADR-9 — Dual-theme semantic tokens (dark default, light behind Phase 7)

**Context.** The 2026-07 upgrade plan calls for a light+dark theme system, but
the codebase was dark-only: four raw vars in `globals.css` and ~500 hardcoded
`zinc-*` classes. New surfaces (BuggyAPI docs, communities, notes, hub
dashboard) shouldn't inherit that debt.

**Decision.** `globals.css` now defines semantic tokens twice — `:root` (light
palette) and `.dark` (the original brand palette) — mapped through
`@theme inline` (`--color-surface`, `--color-border`, `--color-muted`, …), with
`@custom-variant dark` keying `dark:` off the class, not the OS. `next-themes`
(class strategy, `defaultTheme="dark"`, no system preference) toggles the class;
provider in `app/layout.tsx` with `suppressHydrationWarning`. Default stays
dark, so nothing changed visually.

**Consequences.** New UI must use semantic classes (`bg-surface`,
`border-border`, `text-muted-foreground`) — never raw `zinc-*`. The existing
`zinc-*` sweep + light-mode polish (per-theme accent contrast, atmosphere
variants, toggle UI) lands in Phase 7. The practice apps keep their own single
themes (BuggyShop's light storefront, BuggyAPI's dark console) — they're
separate targets under test; theming them twice would double their seeded-bug
test surface.

---

## ADR-13 — Communities: RLS-first feed with service-role-only notifications (2026-07-02)

**Context.** The community feed (posts, questions, comments, likes, follows,
accepted answers, moderation) is the first fully social surface. Every row is
learner-writable, so the access rules have to live in the database, not the app.

**Decision.** All eight tables (`community_posts`/`_comments`/`_likes`/
`_follows`/`_tags`/`_post_tags`/`_reports`, plus a generic `notifications`) are
RLS-first (migration 0027): insert-own (`author_id = auth.uid()`), read-unless-
hidden (author + admins still see their hidden rows), author-or-admin update,
admin-only hide via a `security definer public.is_admin()` helper.
**`notifications` has no insert policy** — only the service role writes them from
server actions, so a learner can't forge a notice (same structural guarantee as
scores, invariant 2). Denormalized `like_count`/`comment_count` are kept honest
by `after insert/delete` triggers, and a generated `fts` tsvector + GIN index
backs `websearch_to_tsquery` search. Images go to the public `community-media`
Storage bucket (folder-scoped RLS); ≤60s video uses Cloudinary signed direct
upload with server-side duration verification (no bytes touch Supabase); the
bell reads `notifications` via Realtime `postgres_changes`.

**Consequences.** The feed is safe by construction — 7 RLS regression tests
(`community-rls.test.ts`) prove insert-own, hidden-invisible, non-author-can't-
moderate, and no-forged-notifications hold at the DB. Video is a $0 opt-in
(image-only until `CLOUDINARY_*` is set). The generic `notifications` table is
where Tasks + talent alerts converge later.

---

## ADR-14 — Hub dashboard + minimal nav (2026-07-02)

**Context.** The navbar had grown to seven destinations (Dashboard, Portfolio,
Test cases, Talent, Settings, email, Sign out) and new surfaces (Community,
Simulator, Notes, Tasks) would only make it worse.

**Decision.** The header is now just logo + Dashboard + notification bell +
avatar menu. Everything else moves onto the dashboard as a **hub grid** of
cards (Community, Simulator, Notes, Portfolio, Test cases, Tasks, Talent) —
Notes/Tasks render disabled "Soon" until their phases land. The dashboard is
**role-adaptive**: it reads `profiles.talent_role` server-side and appends a
tester and/or client panel for marketplace members (`none` = plain learner).
The avatar menu (Profile, Settings, theme toggle, Sign out) and bell are built
on a new headless `DropdownMenu` primitive in `packages/ui` (no Radix —
click/Escape/outside-close, `prefers-reduced-motion`-aware entrance).

**Consequences.** One obvious home for every feature; the nav stays flat as the
product grows. Old routes are untouched — only nav entries moved, so deep links
still resolve. e2e that clicked header links (the auth sign-out flow) now open
the avatar menu first. New nav UI uses semantic tokens (`border-border`,
`bg-surface`, `text-muted-foreground`), continuing the Phase-0 migration.

---

## ADR-15 — Notes wiki: taxonomy-first pure MDX, no registry (2026-07-03)

**Context.** The Notes wiki is a reference encyclopedia spanning every QA domain,
separate from the lesson curriculum. Unlike lessons it has no progress, no
grading, and no relational integrity to protect — so the lesson machinery
(DB registry mirror, sync, immutable slugs) would be pure overhead.

**Decision.** Notes are **pure MDX** under
`content/notes/<module>/<chapter>/<topic>.mdx`, read at request time (already
covered by the platform's `outputFileTracingIncludes`). A typed
`notes/taxonomy.ts` is the single source of truth for the tree; a topic with
`planned: true` is a stub the tree shows but no file backs yet. A vitest
(`notes.test.ts`) asserts the contract that lets content fill in incrementally
without breaking CI: every MDX maps to a leaf, every **non-planned** leaf has a
valid file, every **planned** leaf has none. Search scans the corpus in-process
in a server action (tens of topics — no client index, no build step, always in
sync). Rendering reuses the lessons' `mdxComponents`.

**Consequences.** Adding a topic = write the MDX + flip `planned: false`; the
test enforces both halves. Zero new infra or dependencies, $0. The dashboard hub
card flips from "Soon" to a live link. `generateStaticParams` pre-enumerates only
backed leaves, so planned stubs never 404. (Gotcha: YAML parses an unquoted
`updated: 2026-07-02` as a `Date`; the frontmatter schema normalizes Date→string.)

---

## ADR-10 — BuggyAPI: Hono + zod-openapi inside a Next.js shell

**Context.** The API-testing practice app needs live endpoints AND perfect
documentation — teaching material where spec drift is fatal. A standalone
Express/Hono server would add a new deploy shape; raw Next route handlers
can't generate an OpenAPI spec from their validation code.

**Decision.** `apps/buggyapi` is a Next 16 app (copies the BuggyShop shell,
port 3002, same Vercel matrix deploy) hosting an `OpenAPIHono` app in a
catch-all route (`/api/[[...route]]`). Every endpoint is defined with Zod
schemas via `@hono/zod-openapi`, so the OpenAPI 3.1 spec (`/api/v1/openapi.json`,
Swagger UI at `/api/docs`) is generated from the same schemas the runtime
validates with. Sandbox model mirrors BuggyShop exactly: deny-all `buggyapi`
schema, `sandbox_id` scoping, fake auth (three schemes: X-API-Key, Bearer via
`/v1/auth/login`, Basic + X-Sandbox-Id as the multi-tenant pattern), shared
`public.sandboxes`, handoff via parameterized token audiences
(`buggyapi-handoff`/`-session`; BuggyShop's literals unchanged).

**Consequences.** Docs can't drift from behavior — the spec IS the validator.
One new Vercel project + `VERCEL_BUGGYAPI_PROJECT_ID` var; `buggyapi` schema
must be in the PostgREST exposed-schemas list (config.toml locally, dashboard
setting in cloud). RPC functions are named `reset_buggyapi_sandbox`/
`provision_buggyapi_sandbox` — NOT `reset_sandbox` — so the platform's existing
unqualified `rpc("reset_sandbox")` can never resolve ambiguously.

## ADR-11 — BuggyAPI bug-hunt: mode claim + shared bug_reports (2026-07-02)

**Context.** BuggyAPI needs the same "find seeded bugs, get graded" loop as
BuggyShop, but its bugs are contract violations (wrong status code, dropped
filter, schema-shape mismatch) rather than UI defects, and it has no lesson to
anchor a report to.

**Decision.** A per-sandbox `mode` (`clean`|`bughunt`) lives in
`buggyapi.ba_sandbox_state`, set from an optional `mode` claim on the handoff
token (default `clean`). `apiBugFlag(id, mode)` (`apps/buggyapi/src/api/bugs.ts`)
gates each seeded bug; clean mode serves a perfect reference API. Reports grade
through the platform (`dashboard/actions.ts` `submitApiBugReport`) against
`buggyapi.ba_bug_manifest` and land in the **shared** `public.bug_reports`
table, gaining a `target text ('buggyshop'|'buggyapi')` column; `lesson_id`
becomes nullable (API reports aren't lesson-tied). Match is exact on
surface+endpoint; category+severity shape the score — same rubric as
`matchBugReport`.

**Consequences.** One graded-artifact table, one RLS story — invariant 2 holds
(service-role writes only, learners read-own). Manifest secrecy (invariant 1)
extends to `ba_bug_manifest` via the CI `.next/static` grep over buggyapi. The
five v1 bugs (BA-001 pagination floor, BA-002 create 200-not-201, BA-003 dropped
status filter, BA-004 delete 200+body, BA-005 labels comma-string) are all
verified to fire only in bughunt mode and stay correct in clean mode.

---

## ADR-12 — Coding simulator: synchronous runner + Wandbox (not Piston) (2026-07-02)

**Context.** The plan's coding simulator (Java/Python/JS/TS/C#) was to run on
the free public Piston API. Two problems surfaced during the build: (1) the
existing runner seam (`RunnerProvider.submit`/`getResult`) models an async queue
with client polling, but Piston/Wandbox are synchronous request/response; (2)
the public Piston API went **whitelist-only in Feb 2026**, and no $0 host grants
the privileged container Piston needs to self-host.

**Decision.** Add an optional `executeSync(request)` to `RunnerProvider`. When a
runner implements it, `submitCodeLab` runs it inline and persists the full
`RunResult` into a new `code_runs.result jsonb` column; `pollCodeRun` replays
that instead of re-executing. `code_runs.lesson_id` becomes nullable and gains a
`language` column so standalone simulator runs (no lesson) fit the same table.
The executor is **Wandbox** (wandbox.org — free, keyless, no quota); Wandbox
compiles the main file as `prog.EXT`, so a `normalize` step strips `public` from
top-level Java classes and C# uses the mono single-file compiler, keeping the
code learners write idiomatic. `USE_JUDGE0` swaps in the existing Judge0 runner;
`WANDBOX_URL` points at a self-hosted instance.

**Consequences.** Monaco (`@monaco-editor/react`, dynamic `ssr:false`) drives
both the standalone `(app)/simulator` scratchpad and lesson code labs. A per-user
1-run/10s cooldown (on `code_runs.created_at`) plus the existing daily quota keep
us a good neighbour on the shared Wandbox service. CI never hits the network —
the runner is unit-tested with a mocked fetch and the e2e is a render-only smoke.
Invariant 2 is untouched: `code_runs` is not a score table; a pass still flows to
progress via the service-role server action.

---

Back to the [index](./README.md).
