# Security Policy

## Reporting a vulnerability

Email **izzzthisssagar@gmail.com** with `[security]` in the subject. Please include
reproduction steps and impact. We aim to acknowledge within 72 hours. Do not open
a public issue for a security report.

> Note: **BuggyShop** (`apps/buggyshop`) is a *deliberately* flawed practice app —
> its bugs are intentional teaching material (`BS-###`, see the seeded-bug
> manifest). Reports about BuggyShop behaviour are not security issues.

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
- **BuggyShop auth is fake and cookie-free.** Its login/signup are curriculum
  subjects; real identity crosses only via a signed handoff token in a URL
  fragment, never a shared cookie. The `buggyshop` schema is deny-all.
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
DB-backed e2e suite (Chromium + WebKit), plus the security workflow
(`.github/workflows/security.yml`): secret scanning (gitleaks) and a dependency
audit. The manifest-secrecy grep runs in the build stage.

## Supported versions

The `main` branch is the only supported version during the beta.
