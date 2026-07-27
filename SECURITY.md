# Security Policy

## Reporting a vulnerability

Email **izzzthisssagar@gmail.com** with `[security]` in the subject. Please include
reproduction steps and impact. We aim to acknowledge within 72 hours. Do not open
a public issue for a security report.

> Note: **BuggyShop** (`apps/buggyshop`) and **BuggyAPI** (`apps/buggyapi`) are
> _deliberately_ flawed practice apps — their bugs are intentional teaching
> material (`BS-###` / `BA-###`, see each app's seeded-bug manifest). Reports
> about either app's seeded behaviour are not security issues.

## Security model

The platform's guarantees are enforced in the **database** (Postgres Row-Level
Security), not just the app — see `docs/04-invariants.md`. The load-bearing ones:

- **Learners never write their own scores.** `quiz_attempts`, `bug_reports`,
  `xp_events`, and `entitlements` have read-own RLS and **no write policy**;
  only the service role (inside server actions) writes them. An RLS regression
  suite (`pnpm test:rls`) proves this.
- **Answer keys never reach the client.** Quiz `correct`/`explanation` and the
  BuggyShop bug manifest are read server-side only; the client gets a stripped
  projection (the manifest schema is deny-all). CI greps the built bundle for
  manifest answer-key strings.
- **BuggyShop/BuggyAPI auth is fake and cookie-free.** Their signup/login and
  API keys/OAuth clients are curriculum subjects; real identity crosses only
  via a signed handoff token in a URL fragment, never a shared cookie. Both
  the `buggyshop` and `buggyapi` schemas are deny-all.
- **Auth & sessions** are managed by Supabase (`@supabase/ssr`): cookie-based,
  `auth.getUser()` re-checked server-side on every protected page and in every
  mutating server action.

## Secrets

- No secrets in source. Local Supabase keys live in a gitignored `.env.local`
  (throwaway local-stack keys). Production secrets come from the host's secret
  store.
- `pnpm-lock.yaml` is committed and CI installs `--frozen-lockfile`.

## Automated checks (CI)

Every PR runs lint, typecheck, unit tests, the curriculum validation, a
DB-backed live-RLS regression suite, and a sharded Playwright e2e suite
(Chromium + WebKit) across every practice app, plus the reusable security
workflow (`.github/workflows/security.yml`, called from `ci.yml`): secret
scanning (gitleaks), a production dependency audit, and `dependabot.yml`
validation, aggregated into one `security-gate` result that the release gate
depends on. The manifest-secrecy grep runs in each e2e job's build stage.
Every third-party GitHub Action, Docker image, and CLI invocation across
`.github/workflows/**` is pinned to an immutable commit SHA / digest / exact
version (`scripts/check-workflow-pins.mjs`) — nothing resolves a floating
`@main`/`@latest` tag that could change what CI runs without a code review.

## Supported versions

The `main` branch is the only supported version during the beta.
