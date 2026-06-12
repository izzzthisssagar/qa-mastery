# QA Mastery — engineering conventions

Monorepo for the QA Mastery learning platform (apps/platform) and its practice
app BuggyShop (apps/buggyshop). The product plan, curriculum outlines and
BuggyShop bug spec live in the sibling notes repo:
`../My Qa Projecct/QA-Learning-Platform-Plan.md` and `../My Qa Projecct/Product/`.
The architecture decisions referenced below come from the approved engineering
plan (June 2026).

## Commands

- `pnpm dev` — both apps (platform :3000, buggyshop :3001)
- `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm e2e`
- `pnpm db:start|db:reset|db:status` — local Supabase stack (needs Docker)
- `pnpm --filter @qa-mastery/curriculum sync` — validate lesson MDX (CI gate)

## Invariants (do not break)

1. **Manifest secrecy.** BuggyShop's seeded-bug manifest never reaches a client
   bundle. Grading reads `buggyshop.bs_bug_manifest` server-side only. The
   client sees only the stripped taxonomy. CI greps `.next/static` for
   `title_internal` / `repro_steps_internal` and fails on a hit.
2. **Learners never write scores.** `quiz_attempts`, `lab_submissions`,
   `bug_reports` score/feedback writes go through the service role in server
   actions. RLS gives learners read-own only.
3. **BuggyShop auth is fake.** Its signup/login are curriculum subjects
   (seeded bugs live there) writing `bs_users`/`bs_sessions` sandbox rows.
   Real identity arrives only via the handoff token (`packages/shared`,
   `/enter#t=…` fragment → localStorage session). No cookies in that path.
4. **Every `bs_*` row is scoped by `sandbox_id`.** All BuggyShop data access is
   service-role via route handlers; deny-all RLS on the `buggyshop` schema.
5. **Lesson slugs are immutable once published.** The registry sync upserts on
   slug; removed lessons get archived, never deleted.
6. **Widgets are registry-validated.** Lesson frontmatter `widgets:` must name
   entries in `packages/widgets/src/names.ts`; the sync script enforces it.
7. **Seeded bugs go behind `bugFlag(id, release)`** (lands in M1) — never
   inline bug logic without the flag wrapper.

## Stack notes

- Next.js 16: middleware is now `src/proxy.ts`. Before using unfamiliar Next
  APIs, check `apps/*/node_modules/next/dist/docs/` — training data is stale.
- Supabase SSR: always `getAll`/`setAll` cookie methods; `auth.getUser()` (not
  `getSession()`) in server code. One client per request.
- Proxy does optimistic redirects only; the `(app)/layout.tsx` server check is
  the real boundary, and every mutating server action re-checks.
- Tailwind v4: workspace package sources need `@source` lines in each app's
  `globals.css`.
- Internal packages ship TS source; apps list them in `transpilePackages`.

## Testing bar

This platform teaches QA — its own suite is marketing. Unit tests for every
pure function (grading especially), Playwright e2e for every learner-facing
flow on Chromium AND WebKit (iframe/token handoff must stay Safari-proof),
RLS regression tests once the DB-backed CI stage lands (M1).
