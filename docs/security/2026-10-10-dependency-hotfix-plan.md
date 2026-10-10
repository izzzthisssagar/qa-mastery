# QA Mastery security remediation plan — 2026-10-10

**Branch:** `fix/security-dependencies-2026-10` | **Base:** clean `main` at `c1ba7c5`.
**Goal:** unblock failed production dependency audit in draft PR #163, in a **separate security hotfix branch**, without modifying Sprint 02/03, auth, DB, grading, existing product code or production deployment.

## Baseline

GitHub security job `dependency-audit` reported **47 advisories**: 3 critical, 10 high, 27 moderate, 7 low. Independent `pnpm audit --prod --audit-level high --json` on this exact clean `main` lockfile confirmed the 13 critical/high findings. Current vulnerable versions and patched floors:

| Package              | Baseline        | Required patch | Where                                                                                                                              |
| -------------------- | --------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Next.js              | 16.2.12         | >=16.3.8       | platform, BuggyShop, BuggyAPI; several RCE and SSRF advisories                                                                     |
| sharp                | 0.35.3          | >=0.35.5       | Next image optimization                                                                                                            |
| js-yaml (3.x)        | 3.15.0          | >=3.15.2       | gray-matter (must stay within major 3 for legacy safeLoad API)                                                                     |
| nanoid               | 3.3.16          | >=3.3.18       | Next/PostCSS                                                                                                                       |
| @fastify/busboy      | 3.2.0           | >=3.2.1        | GraphQL Yoga/whatwg-node                                                                                                           |
| source-map-js        | 1.2.1           | >=1.2.2        | Next/PostCSS                                                                                                                       |
| @graphql-tools/utils | 10.11.0, 11.1.1 | >=12.0.1       | GraphQL Yoga, schema/executor; prefer compatible same-major Yoga upgrade to 5.24.4 rather than overriding incompatible old clients |

## Planned tasks, with verification

- **SEC-01** Create this isolated branch and capture exact baseline audit & dependency graph. Complete.
- **SEC-02** Upgrade `next` and `eslint-config-next` to **16.3.8** across the three apps, and bump direct GraphQL Yoga 5.x to 5.24.4. No application source changes without a proven regression.
- **SEC-03** Replace outdated selective `pnpm-workspace.yaml` transitive pins to patched versions and update `pnpm-lock.yaml` with `pnpm install --lockfile-only`.
- **SEC-04** Test-first contract checking selected patched versions and regression safety. Re-run `pnpm audit --prod --audit-level high`; require zero high/critical with **no ignore rules or suppressions**.
- **SEC-05** Install dependencies (guarded due only 4–5 GiB Mac disk). Run app/unit/typecheck/build tests and GraphQL API smoke; do not launch local Supabase/Colima.
- **SEC-06** Re-run full repository `pnpm verify`, all three production builds and audit; independently inspect diff; record actual outcomes and limitations.
- **SEC-07** Preserve branch for controlled review/PR/merge order; PR #163 stays draft until security patch and both E2E suites pass. Do not merge or deploy without separate explicit approval.

## Risk controls

- Scope includes version manifests, pnpm lockfile, security regression test, and verification docs only.
- Align `eslint-config-next` with Next. Beware GraphQL Tools major jumps; GraphQL Yoga same-major upgrade requires API regression tests.
- Old existing `sharp@0.35.3` and `js-yaml@3.15.0` overrides are now vulnerable and must be replaced; do not disable the security gate.
- Disk guard: earlier separate Supabase attempt nearly exhausted Mac disk. Keep free host space safe; no Docker, DB or excessive cached build artifacts. If builds cannot run, record them as blocked and use isolated CI later, not fabricated green results.
- Main checkout, Sprint 02/03, hidden challenge manifests, credentials and remote environments unchanged.

## Acceptance

Fresh registry audit: **zero high/critical**; real unit/typechecks/builds/GraphQL tests where feasible; no regressions or vulnerability ignores. Do not claim release readiness from audit alone; require review and branch CI.
