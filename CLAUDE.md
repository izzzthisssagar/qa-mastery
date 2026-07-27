# QA Mastery — engineering conventions

Monorepo for the QA Mastery learning platform (apps/platform) and its practice
apps BuggyShop (apps/buggyshop) and BuggyAPI (apps/buggyapi — a live practice
REST API, "TaskFlight", with generated OpenAPI docs). The product plan,
curriculum outlines and BuggyShop bug spec live in the sibling notes repo:
`../My Qa Projecct/QA-Learning-Platform-Plan.md` and `../My Qa Projecct/Product/`.
The architecture decisions referenced below come from the approved engineering
plan (June 2026).

## Commands

- `pnpm dev` — all apps (platform :3000, buggyshop :3001, buggyapi :3002)
- `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` / `pnpm e2e`
- `pnpm db:start|db:reset|db:status` — local Supabase stack (needs Docker)
- `pnpm --filter @qa-mastery/curriculum sync` — validate lesson MDX (CI gate)

## Invariants (do not break)

1. **Manifest secrecy.** The seeded-bug manifests never reach a client bundle.
   Grading reads `buggyshop.bs_bug_manifest` and `buggyapi.ba_bug_manifest`
   server-side only (BuggyAPI reports grade in `dashboard/actions.ts`
   `submitApiBugReport`). The client sees only the stripped taxonomy
   (`bug-taxonomy.ts`, `api-bug-taxonomy.ts`). CI greps `.next/static` across
   platform + buggyshop + buggyapi for `title_internal` / `repro_steps_internal`
   and fails on a hit.
2. **Learners never write scores (or forge notifications).** `quiz_attempts`,
   `lab_submissions`, `bug_reports` score/feedback and all `notifications` rows
   are written by the service role in server actions. RLS gives learners
   read-own only — `notifications` has no insert policy at all (see ADR-13).
3. **Practice-app auth is fake.** BuggyShop signup/login and BuggyAPI's
   users/API keys/OAuth clients are curriculum subjects writing sandbox rows
   (`bs_users`/`bs_sessions`, `ba_users`/`ba_api_keys`/…). Real identity
   arrives only via the handoff token (`packages/shared`, `/enter#t=…`
   fragment → localStorage session). No cookies in that path.
4. **Every `bs_*`/`ba_*` row is scoped by `sandbox_id`.** All practice-app data
   access is service-role via route handlers; deny-all RLS on the `buggyshop`
   and `buggyapi` schemas. Both share `public.sandboxes` (one per learner).
5. **Lesson slugs are immutable once published.** The registry sync upserts on
   slug; removed lessons get archived, never deleted.
6. **Widgets are registry-validated.** Lesson frontmatter `widgets:` must name
   entries in `packages/widgets/src/names.ts`; the sync script enforces it.
7. **Seeded bugs go behind a flag** — BuggyShop uses `bugFlag(id, release)`,
   BuggyAPI uses `apiBugFlag(id, mode)` (`apps/buggyapi/src/api/bugs.ts`; mode
   read from `ba_sandbox_state`, set from the handoff token's `mode` claim).
   Clean mode = perfect reference API. Never inline bug logic without the flag.

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
- Code execution goes through `RunnerProvider` (`packages/grading`). Synchronous
  runners implement `executeSync` (run inline, persist `code_runs.result`);
  async ones use `submit`/`getResult`. The simulator + code labs run on
  **Wandbox** (`WandboxRunner` — free, keyless; public Piston died Feb 2026);
  `USE_JUDGE0` / `WANDBOX_URL` override. Monaco is `@monaco-editor/react`
  (dynamic `ssr:false`). See ADR-12.

## Testing bar

This platform teaches QA — its own suite is marketing. Unit tests for every
pure function (grading especially), Playwright e2e for every learner-facing
flow on Chromium AND WebKit (iframe/token handoff must stay Safari-proof), and
RLS regression tests (`pnpm test:rls`) that run in the DB-backed CI stage.

## Deployment & design (live)

All three apps run on Vercel (BuggyAPI's infra isn't provisioned yet — its
matrix entry in `deploy.yml` skips cleanly) and **redeploy once CI finishes
verifying a commit on `main`** — `deploy.yml` triggers on CI's own completion
(`workflow_run`), not the push itself, and deploys the exact `head_sha` CI
checked. Full detail: `docs/09-deployment.md`. Keep in mind when deploying:

- **Live:** platform `qa-mastery-platform.vercel.app`, buggyshop
  `qa-mastery-buggyshop.vercel.app`. One Supabase cloud project backs both.
- **Vercel blocks deploys (`TEAM_ACCESS_REQUIRED`)** when the git commit author
  isn't a team member. Deploy with no git metadata: CI archives the exact
  verified commit (`git archive <head_sha> | tar -x`) into a scratch dir and
  deploys from there instead of the full checkout; a local deploy moves
  `.git` aside (`mv .git /tmp/x …; mv /tmp/x .git`). Always use
  `--archive=tgz` and rely on `.vercelignore` (excludes the multi-GB
  `.turbo` + symlinked `node_modules`) or the upload aborts.
- **Runtime content reads need file tracing.** Lesson/quiz/tutor routes read
  `packages/curriculum/content` at request time, so `apps/platform/next.config.ts`
  sets `outputFileTracingRoot` + `outputFileTracingIncludes`. Don't remove it —
  it's the difference between lessons rendering and a 500.
- **Design tokens** (`apps/platform/src/app/globals.css`): dual-theme semantic
  tokens — `:root` = light palette, `.dark` = brand dark (`--accent` emerald,
  `--bug` amber); toggled by `next-themes` (class strategy, dark default; see
  ADR-9). **New UI must use semantic classes** (`bg-surface`, `border-border`,
  `text-muted-foreground`) — never raw `zinc-*`, and never a raw Tailwind
  pastel (`text-emerald-300`, `text-red-400`, …) as text color either: those
  are tuned for the dark palette only and measure well under AA (as low as
  1.2:1) against the light background — axe caught this repeatedly in Phase 7. Use the **text-tone tokens** instead, each independently AA-verified
  against `--background`/`--surface`/`--surface-raised` on light, unchanged
  (already-safe) pastels on dark: `text-accent-text` (general accent-colored
  copy — labels, inline code, links; distinct from `text-accent`, which is
  tuned for `bg-accent` buttons paired with `--accent-foreground`, not for
  text-on-background), `text-success-text`, `text-warning-text`,
  `text-info-text`, `text-danger-text` (state/feedback copy — success
  messages, warnings, info, errors). A one-off brand color with no matching
  tone token (BuggyAPI's cyan, the coding-simulator card's violet) gets an
  explicit `dark:` variant instead of a new global token — see
  `dashboard/buggyapi-card.tsx`. Fonts Bricolage Grotesque (display), Geist
  (body/mono), Instrument Serif italic (`.font-serif-accent`). Atmosphere via
  `.bg-grid` / `.bg-glow` / `.grain`. Respect `prefers-reduced-motion`.
  BuggyShop stays dark-only on purpose.
