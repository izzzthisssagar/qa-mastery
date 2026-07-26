# Security, Performance, and Observability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish typed configuration, measurable coverage, source and runtime security scanning, realistic performance thresholds, privacy-safe observability, and evidence-backed release promotion.

**Architecture:** Shared environment schemas fail fast at server startup and expose a separate browser-safe contract. Security policies are generated and unit-tested before report-only and enforced rollout. CI emits one aggregate security result, while scheduled or staging-only jobs run DAST and heavier load checks. OpenTelemetry and structured logging share a redaction boundary and release identifier.

**Tech Stack:** TypeScript 5, Zod 4, Next.js 16 App Router, Vitest 4 V8 coverage, GitHub Actions/CodeQL, OWASP ZAP, k6, OpenTelemetry, Vercel/Fly/Supabase.

## Global Constraints

- The integration governor exclusively owns `.github/**`, root dependency declarations, `pnpm-lock.yaml`, deployment files, and final branch-protection changes.
- Pin third-party actions to live-verified full 40-character commit SHAs, containers to immutable digests, and CLIs to explicit versions; never commit `@latest`, `@master`, or floating image tags.
- CodeQL and dependency review scan the production platform and repository; ZAP targets only the staging learning platform unless an explicit expected-findings baseline exists for BuggyShop and BuggyAPI.
- `NEXT_PUBLIC_*` values are build-time public data. Server secrets must never be imported through a client-safe module or serialized into a browser bundle.
- CSP enforcement must preserve the current Supabase, Paddle, Cloudinary, analytics, lesson-media, BuggyShop, BuggyAPI, and code-runner flows before report-only becomes blocking.
- Logs, spans, metrics, and CSP reports must not contain raw user IDs, email addresses, tokens, request bodies, learner-authored content, code, or seeded-bug answer keys.
- Heavy load, spike, and soak tests run manually or on a schedule; PRs run only a bounded smoke profile.
- Production promotion uses the exact artifact or commit that passed staging smoke, contract, accessibility, performance, DAST, and security gates.
- Read the installed Next.js 16 environment-variable, CSP, instrumentation, and OpenTelemetry guides before editing those surfaces.

---

## File Structure

- Modify `packages/config/package.json` and create `packages/config/src/env/*.ts`, `packages/config/test/env.test.ts`, and `packages/config/vitest.config.ts` — typed configuration contracts.
- Create `scripts/check-env-documentation.mjs` and `scripts/check-workflow-pins.mjs` with unit tests under `scripts/test/`.
- Modify application/service entry points and `.env.example` — validate the correct schema and document every key.
- Modify Vitest configs and package manifests; create `scripts/coverage-baseline.mjs`, `scripts/coverage-ratchet.mjs`, and `coverage-baseline.json` — measurable no-regression coverage.
- Create `apps/platform/src/lib/security/csp.ts`, `apps/platform/test/csp.test.ts`, and `apps/platform/src/app/api/security/csp-report/route.ts`; modify `apps/platform/next.config.ts` — tested CSP rollout.
- Create `apps/platform/src/instrumentation.ts`, `apps/platform/src/instrumentation.node.ts`, `apps/platform/src/lib/telemetry.ts`, and tests; harden `apps/platform/src/lib/logging.ts`.
- Modify `.github/workflows/security.yml`, `.github/workflows/ci.yml`, `.github/workflows/deploy-staging.yml`, and `.github/workflows/deploy.yml`; create CodeQL, dependency review, SBOM/provenance, staging security, and aggregate gates.
- Create `performance/k6/*.js`, `performance/README.md`, and `.github/workflows/performance.yml`.
- Create `security/zap/*.conf`, `security/zap/rules.tsv`, and `.github/workflows/staging-security.yml`.
- Create `docs/security/threat-model.md`, `docs/runbooks/observability.md`, `docs/runbooks/staging-promotion.md`, and `docs/runbooks/rollback.md`.

---

### Task 1: Add central typed environment schemas

**Files:**
- Modify: `packages/config/package.json`
- Create: `packages/config/src/env/common.ts`
- Create: `packages/config/src/env/platform-server.ts`
- Create: `packages/config/src/env/platform-client.ts`
- Create: `packages/config/src/env/buggyshop.ts`
- Create: `packages/config/src/env/buggyapi.ts`
- Create: `packages/config/src/env/websocket.ts`
- Create: `packages/config/src/env/ci.ts`
- Create: `packages/config/test/env.test.ts`
- Create: `packages/config/vitest.config.ts`
- Modify: `apps/platform/package.json`
- Modify: `apps/platform/next.config.ts`

**Interfaces:**
- Produces: `parsePlatformServerEnv`, `parsePlatformClientEnv`, `parseBuggyShopEnv`, `parseBuggyApiEnv`, `parseWebSocketEnv`, and `parseCiEnv`.

- [ ] **Step 1: Write failing secret-boundary tests**

```ts
import { describe, expect, it } from "vitest";
import { parsePlatformClientEnv } from "../src/env/platform-client";
import { parsePlatformServerEnv } from "../src/env/platform-server";

describe("environment schemas", () => {
  it("rejects a missing server service-role key", () => {
    expect(() => parsePlatformServerEnv({ NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321" })).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("returns only browser-safe keys", () => {
    const parsed = parsePlatformClientEnv({
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      SUPABASE_SERVICE_ROLE_KEY: "must-not-leak",
    });
    expect(parsed).not.toHaveProperty("SUPABASE_SERVICE_ROLE_KEY");
  });
});
```

- [ ] **Step 2: Run and confirm missing modules**

Run: `pnpm --filter @qa-mastery/config test`

Expected: FAIL because the scripts and env modules do not exist.

- [ ] **Step 3: Add Zod contracts with separate public and server exports**

```ts
import { z } from "zod";

export const publicSupabaseSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export function parsePlatformClientEnv(input: Record<string, unknown>) {
  return publicSupabaseSchema.parse(input);
}
```

The server schema extends this with `SUPABASE_SERVICE_ROLE_KEY`, `SANDBOX_JWT_SECRET`, application URLs, code-runner provider values, Paddle keys when billing is enabled, tutor providers, Cloudinary, observability, malware-scan, cron, and admin values. Use `superRefine` to require conditional secrets only when their feature flag is enabled. Export parsed values through functions, not module-load singletons, so tests can supply isolated inputs.

- [ ] **Step 4: Wire the package and runtime boundary**

Add Zod as a runtime dependency of `@qa-mastery/config`, add `test`, `lint`, and `typecheck` scripts, export `./env/*`, add the config package as a runtime dependency and transpiled package only where imported, and call server validation from Next instrumentation/server startup rather than client components.

- [ ] **Step 5: Verify and commit**

Run: `pnpm install && pnpm --filter @qa-mastery/config test && pnpm --filter @qa-mastery/config lint && pnpm --filter @qa-mastery/config typecheck && pnpm --filter @qa-mastery/platform typecheck`

Expected: PASS.

```bash
git add packages/config apps/platform/package.json apps/platform/next.config.ts pnpm-lock.yaml
git commit -m "feat(config): validate runtime environments centrally"
```

### Task 2: Make environment documentation mechanically complete

**Files:**
- Create: `scripts/check-env-documentation.mjs`
- Create: `scripts/test/check-env-documentation.test.mjs`
- Modify: `.env.example`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: direct `process.env.KEY` references and exported schema keys.
- Produces: `pnpm check:env` with actionable missing/unused-key output.

- [ ] **Step 1: Write fixture-based scanner tests**

```js
import assert from "node:assert/strict";
import { findUndocumentedKeys } from "../check-env-documentation.mjs";

assert.deepEqual(
  findUndocumentedKeys(["SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_PLATFORM_URL"], "NEXT_PUBLIC_PLATFORM_URL=http://localhost:3000\n"),
  ["SUPABASE_SERVICE_ROLE_KEY"],
);
```

- [ ] **Step 2: Run and observe missing export failure**

Run: `node --test scripts/test/check-env-documentation.test.mjs`

Expected: FAIL.

- [ ] **Step 3: Implement the scanner and correct the template**

Scan tracked `.ts`, `.tsx`, `.js`, `.mjs`, YAML, Dockerfile, and TOML files while excluding `.next`, coverage, node_modules, snapshots, and public assets. Detect static `process.env.KEY` and `${{ secrets.KEY }}`/`${{ vars.KEY }}` references, compare them with `.env.example` or a documented CI-only allowlist, and fail with sorted names. Replace the personal admin address with `admin@example.com` and document every platform, BuggyShop, BuggyAPI, WebSocket, runner, billing, tutor, community-media, feature-flag, observability, and deployment value.

- [ ] **Step 4: Add the truthful root command and CI check**

Add `"check:env": "node scripts/check-env-documentation.mjs"` and run it in static checks before builds.

- [ ] **Step 5: Verify and commit**

Run: `node --test scripts/test/check-env-documentation.test.mjs && pnpm check:env`

Expected: PASS with zero undocumented keys.

```bash
git add scripts/check-env-documentation.mjs scripts/test/check-env-documentation.test.mjs .env.example package.json .github/workflows/ci.yml
git commit -m "chore(config): enforce environment documentation"
```

### Task 3: Establish measured coverage and ratcheting gates

**Files:**
- Modify: package manifests and Vitest configs for tested workspaces
- Create: `scripts/coverage-baseline.mjs`
- Create: `scripts/coverage-ratchet.mjs`
- Create: `scripts/test/coverage-ratchet.test.mjs`
- Create: `coverage-baseline.json`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: `pnpm coverage`, `pnpm coverage:baseline`, and `pnpm coverage:check`.

- [ ] **Step 1: Test no-regression and critical-floor behavior**

```js
assert.equal(compareCoverage({ lines: 79 }, { lines: 80 }, { lines: 0 }).ok, false);
assert.equal(compareCoverage({ branches: 89 }, { branches: 20 }, { branches: 90 }).ok, false);
assert.equal(compareCoverage({ lines: 81 }, { lines: 80 }, { lines: 0 }).ok, true);
```

- [ ] **Step 2: Install the V8 provider and capture main's real baseline**

Add `@vitest/coverage-v8` at the same version as Vitest. Configure JSON-summary, text, and HTML reporters with source inclusion and generated-file exclusions. Run `pnpm coverage:baseline` on a clean `origin/main` worktree; the script writes exact per-package percentages to `coverage-baseline.json` rather than inventing a round-number global target.

- [ ] **Step 3: Add explicit critical floors**

Require grading statements/branches at 90%, agent statements/branches at 85%, and every other package to stay at or above its committed baseline. New files below 70% statements fail unless they are declarative configuration or generated code identified in the checked-in exclusion list.

- [ ] **Step 4: Add CI artifacts and gate**

Run coverage after unit tests, upload HTML/JSON summaries, and fail the aggregate status when the ratchet fails. Do not use coverage as a substitute for RLS, E2E, interaction, visual, accessibility, or contract tests.

- [ ] **Step 5: Verify and commit**

Run: `node --test scripts/test/coverage-ratchet.test.mjs && pnpm coverage && pnpm coverage:check`

Expected: PASS against the captured baseline and critical floors.

```bash
git add package.json pnpm-lock.yaml packages apps/*/vitest.config.ts scripts/coverage-*.mjs scripts/test/coverage-ratchet.test.mjs coverage-baseline.json .github/workflows/ci.yml
git commit -m "test: add coverage baselines and ratcheting"
```

### Task 4: Roll out a tested Content Security Policy

**Files:**
- Create: `apps/platform/src/lib/security/csp.ts`
- Create: `apps/platform/test/csp.test.ts`
- Create: `apps/platform/src/app/api/security/csp-report/route.ts`
- Modify: `apps/platform/next.config.ts`
- Modify: `apps/platform/src/proxy.ts`
- Create: `e2e/tests/csp.spec.ts`

**Interfaces:**
- Produces: `buildContentSecurityPolicy({ mode, origins, isDev }): string` and a size-limited report endpoint.

- [ ] **Step 1: Write directive and injection tests**

```ts
it("denies objects and foreign framing without interpolating invalid origins", () => {
  const policy = buildContentSecurityPolicy({ mode: "enforce", isDev: false, origins: validOrigins });
  expect(policy).toContain("object-src 'none'");
  expect(policy).toContain("base-uri 'self'");
  expect(policy).toContain("frame-ancestors 'none'");
  expect(policy).not.toContain("unsafe-eval");
  expect(() => buildContentSecurityPolicy({ mode: "enforce", isDev: false, origins: { ...validOrigins, supabase: "https://ok.test; script-src *" } })).toThrow();
});
```

- [ ] **Step 2: Run and confirm the CSP module is absent**

Run: `pnpm --filter @qa-mastery/platform test -- csp.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement an origin-validated policy generator**

Build directives for `default-src 'self'`, scripts, styles, images, fonts, connections, frames, workers, media, objects, base URI, forms, frame ancestors, and upgrades. Parse every configured URL with `new URL()` and use `.origin`; never concatenate arbitrary raw environment text. Allow `unsafe-eval` only in development. Keep the current static-rendering performance by using an allowlist policy without per-request nonces; do not enable experimental SRI.

- [ ] **Step 4: Add report-only collection with privacy-safe normalization**

Accept only `application/csp-report` or JSON, reject bodies above 16 KiB, retain directive, disposition, blocked-origin (origin only), source-file origin, status code, and document route pattern, and discard query strings, samples, cookies, and raw referrers. Apply IP-independent bounded rate limiting and emit through the redacted logger.

- [ ] **Step 5: Run report-only E2E before enforcement**

Set `Content-Security-Policy-Report-Only` in staging; exercise authentication, Supabase, Paddle-disabled and enabled test mode, Cloudinary uploads, embedded media, BuggyShop/BuggyAPI handoffs, Monaco, code execution, analytics, and both themes. Add explicit E2E assertions for no unexpected `securitypolicyviolation` events.

- [ ] **Step 6: Switch the verified policy to enforcement**

Change the response header to `Content-Security-Policy`, keep a stricter candidate in report-only for future tightening, and retain the current non-CSP security headers.

- [ ] **Step 7: Verify and commit**

Run: `pnpm --filter @qa-mastery/platform test -- csp.test.ts && pnpm --filter @qa-mastery/platform lint && pnpm --filter @qa-mastery/platform typecheck && pnpm --filter @qa-mastery/platform build && pnpm --filter @qa-mastery/e2e e2e -- csp.spec.ts`

Expected: PASS with no unintended violations.

```bash
git add apps/platform/src/lib/security apps/platform/test/csp.test.ts apps/platform/src/app/api/security/csp-report apps/platform/next.config.ts apps/platform/src/proxy.ts e2e/tests/csp.spec.ts
git commit -m "feat(security): enforce tested content security policy"
```

### Task 5: Add privacy-safe telemetry and release correlation

**Files:**
- Create: `apps/platform/src/instrumentation.ts`
- Create: `apps/platform/src/instrumentation.node.ts`
- Create: `apps/platform/src/lib/telemetry.ts`
- Create: `apps/platform/test/telemetry.test.ts`
- Modify: `apps/platform/src/lib/logging.ts`
- Modify: `apps/platform/test/logging.test.ts`
- Modify: `apps/platform/package.json`
- Modify: `.env.example`

**Interfaces:**
- Produces: `withSpan`, `recordCounter`, `sanitizeTelemetryAttributes`, and release-correlated structured action logs.

- [ ] **Step 1: Write redaction tests**

```ts
it("drops secrets and hashes stable actor identifiers", () => {
  expect(sanitizeTelemetryAttributes({ email: "a@example.com", token: "secret", userId: "user-a", route: "/settings" })).toEqual({
    actorHash: expect.stringMatching(/^[a-f0-9]{16}$/),
    route: "/settings",
  });
});
```

- [ ] **Step 2: Install OpenTelemetry and implement Node-only startup**

Add `@vercel/otel` and `@opentelemetry/api`. `src/instrumentation.ts` conditionally imports `instrumentation.node.ts` only for `NEXT_RUNTIME === "nodejs"`; the Node file calls `registerOTel({ serviceName: "qa-mastery-platform" })` only when `OTEL_EXPORTER_OTLP_ENDPOINT` exists, so local tests remain offline.

- [ ] **Step 3: Harden structured logging**

Replace raw error messages with a bounded error code/classification, add `release` from `VERCEL_GIT_COMMIT_SHA` or `APP_RELEASE_SHA`, route/action, duration, outcome, and actor hash. Reject keys matching password, secret, token, authorization, cookie, email, body, content, code, manifest, or answer. Preserve stack traces only in the error provider with server-side scrubbing.

- [ ] **Step 4: Instrument critical boundaries**

Add spans/counters around authentication callback, grading, sandbox provisioning, code execution, notification delivery, media scanning, data export/deletion, sync batches, and credential issuance. Record result codes and durations, never payloads.

- [ ] **Step 5: Verify and commit**

Run: `pnpm --filter @qa-mastery/platform test -- logging.test.ts telemetry.test.ts && pnpm --filter @qa-mastery/platform typecheck && pnpm --filter @qa-mastery/platform build`

Expected: PASS; test output and built client contain no test secret.

```bash
git add apps/platform/src/instrumentation.ts apps/platform/src/instrumentation.node.ts apps/platform/src/lib/telemetry.ts apps/platform/src/lib/logging.ts apps/platform/test apps/platform/package.json .env.example pnpm-lock.yaml
git commit -m "feat(observability): add redacted release-correlated telemetry"
```

### Task 6: Add immutable workflow, CodeQL, dependency-review, SBOM, and provenance gates

**Files:**
- Create: `scripts/check-workflow-pins.mjs`
- Create: `scripts/test/check-workflow-pins.test.mjs`
- Modify: `.github/workflows/security.yml`
- Modify: `.github/workflows/ci.yml`
- Create: `.github/workflows/release-evidence.yml`
- Modify: `.github/dependabot.yml`

**Interfaces:**
- Produces: required `security-gate` and release SBOM/provenance artifacts.

- [ ] **Step 1: Test the immutable-reference checker**

Create fixtures containing `uses: owner/action@v4`, `uses: owner/action@master`, `image: tool:latest`, and full-SHA/digest examples. Assert only 40-hex action refs and `sha256:` images pass; allow local `./.github/actions/...` references.

- [ ] **Step 2: Resolve and record current immutable references**

For every external action, run `git ls-remote https://github.com/OWNER/REPO.git refs/tags/TAG 'refs/tags/TAG^{}'`, select the peeled commit when present, verify it against the official repository release, and replace the tag with that 40-character SHA plus a `# vX.Y.Z` comment. Resolve container tags with `docker buildx imagetools inspect --format '{{json .Manifest.Digest}}' IMAGE:TAG` and pin the digest. Run `pnpm check:workflow-pins` to reject drift.

- [ ] **Step 3: Add CodeQL and dependency review**

Add TypeScript/JavaScript CodeQL init, build-mode `none`, and analyze jobs with least-privilege permissions. Add dependency review only on pull requests, fail on high severity, deny GPL-only dependencies unless explicitly reviewed, and retain the production `pnpm audit` job.

- [ ] **Step 4: Generate release evidence**

On signed release tags or approved production promotion, generate CycloneDX JSON and SPDX JSON from the frozen lockfile, attest build provenance for the tested artifact, upload evidence with retention, and include commit SHA, artifact digest, dependency-audit result, and staging run ID.

- [ ] **Step 5: Add one aggregate security status**

Create `security-gate` depending on secret scan, audit, workflow pinning, CodeQL, dependency review when applicable, and configuration validation. It fails if any required dependency is skipped unexpectedly and is the only security status production consumes.

- [ ] **Step 6: Verify and commit**

Run: `node --test scripts/test/check-workflow-pins.test.mjs && pnpm check:workflow-pins && actionlint .github/workflows/*.yml`

Expected: PASS; `rg -n '@(latest|master|v[0-9])|:[[:space:]]*latest' .github` returns no unapproved mutable execution reference.

```bash
git add scripts/check-workflow-pins.mjs scripts/test/check-workflow-pins.test.mjs .github package.json
git commit -m "ci(security): add immutable aggregate security gates"
```

### Task 7: Add k6 performance profiles and thresholds

**Files:**
- Create: `performance/k6/helpers.js`
- Create: `performance/k6/smoke.js`
- Create: `performance/k6/load.js`
- Create: `performance/k6/spike.js`
- Create: `performance/k6/soak.js`
- Create: `performance/README.md`
- Create: `.github/workflows/performance.yml`

**Interfaces:**
- Consumes: `TARGET_BASE_URL` and a dedicated staging test identity/token created outside source control.
- Produces: JSON summaries and threshold-gated staging evidence.

- [ ] **Step 1: Add a bounded PR smoke profile**

Use 1 virtual user for 30 seconds against `/api/health`, homepage, and one authenticated lightweight dashboard endpoint. Set thresholds `http_req_failed < 0.01`, `p(95) < 750ms`, and `p(99) < 1500ms`; tag each scenario and abort when the staging base URL is not HTTPS or does not match the configured staging allowlist.

- [ ] **Step 2: Add scheduled load, spike, and soak profiles**

Load: ramp 1→25→50→0 VUs over 12 minutes with p95 < 1000 ms and error < 1%. Spike: 5→100→5 VUs over 4 minutes with p95 < 2000 ms and error < 3%. Soak: 20 VUs for 60 minutes with p95 < 1200 ms, error < 1%, and dropped iterations = 0. Include quiz submission and WebSocket echo only through dedicated non-production test accounts; never mutate shared learner evidence.

- [ ] **Step 3: Add workflow separation**

PR/staging promotion runs smoke only. Scheduled/manual workflow offers `load`, `spike`, or `soak`, has concurrency cancellation, uploads JSON summaries, and requires the staging environment. No performance workflow targets production by default.

- [ ] **Step 4: Verify scripts locally**

Run: `K6_DIGEST="$(docker buildx imagetools inspect --format '{{json .Manifest.Digest}}' grafana/k6:2.0.0 | tr -d '"')"; docker run --rm -i "grafana/k6@${K6_DIGEST}" inspect - < performance/k6/smoke.js`, then record the resolved digest in the workflow and documentation.

Expected: valid script with the stated scenarios and thresholds.

- [ ] **Step 5: Commit performance suites**

```bash
git add performance .github/workflows/performance.yml
git commit -m "test(performance): add staged k6 profiles"
```

### Task 8: Add staging DAST without scanning intentional teaching vulnerabilities

**Files:**
- Create: `security/zap/platform-baseline.conf`
- Create: `security/zap/rules.tsv`
- Create: `security/zap/README.md`
- Create: `.github/workflows/staging-security.yml`

**Interfaces:**
- Produces: `staging-security-gate` with ZAP HTML/JSON evidence.

- [ ] **Step 1: Define the target boundary**

Allow only the exact staging platform origin and its same-origin routes. Explicitly deny BuggyShop, BuggyAPI, Fly WebSocket, localhost, link-local, RFC1918, cloud metadata, and production origins. Abort when `TARGET_BASE_URL` fails the allowlist.

- [ ] **Step 2: Add baseline rules**

Start with no blanket ignores. Encode only reviewed false positives with rule ID, route, rationale, owner, expiry date, and issue URL. Fail new high findings and reviewed medium classes; upload all findings even when the gate fails.

- [ ] **Step 3: Pin and run ZAP after staging smoke**

Resolve the official ZAP stable image to an immutable digest, run baseline mode after staging deploy and contract smoke, pass an authenticated automation context with a dedicated low-privilege account, and remove cookies/tokens from artifacts.

- [ ] **Step 4: Verify target validation and workflow syntax**

Run unit shell tests for allowed/denied URLs and `actionlint .github/workflows/staging-security.yml`; expected PASS.

- [ ] **Step 5: Commit DAST configuration**

```bash
git add security/zap .github/workflows/staging-security.yml
git commit -m "ci(security): add scoped staging ZAP baseline"
```

### Task 9: Prove promotion, health, rollback, and incident evidence

**Files:**
- Modify: `.github/workflows/deploy-staging.yml`
- Modify: `.github/workflows/deploy.yml`
- Create: `scripts/verify-release-artifact.mjs`
- Create: `scripts/post-deploy-smoke.mjs`
- Create: `docs/runbooks/observability.md`
- Create: `docs/runbooks/staging-promotion.md`
- Create: `docs/runbooks/rollback.md`
- Create: `docs/security/threat-model.md`

**Interfaces:**
- Consumes: aggregate CI, `security-gate`, performance smoke, and `staging-security-gate` for the same SHA.
- Produces: auditable promotion and rollback result for production.

- [ ] **Step 1: Add release-identity verification tests**

Test `verify-release-artifact` against mismatched commit SHA, missing artifact digest, wrong staging run ID, and a complete signed manifest. Only the complete same-SHA manifest passes.

- [ ] **Step 2: Gate production on exact-revision staging evidence**

Production receives an immutable artifact reference and evidence manifest from staging, verifies SHA/digest and all required conclusions, then deploys that artifact without rebuilding. Environment approval remains an explicit human gate.

- [ ] **Step 3: Add post-deploy health criteria**

Check platform, BuggyShop, BuggyAPI, and WebSocket health; authenticate a synthetic learner; load dashboard; exercise one read-only contract request; verify error rate/latency remain within the runbook window; and confirm release correlation in telemetry. Redact synthetic credentials.

- [ ] **Step 4: Add rollback behavior**

If health fails, restore the previous verified application artifact. Database migrations must be backward-compatible expand/migrate/contract changes; destructive contract migrations require a later release after rollback risk expires. Record rollback target, reason, health evidence, and final state.

- [ ] **Step 5: Write the threat model and operator runbooks**

Cover auth/session, RLS/service role, seeded manifests, code execution, uploads, community abuse, tutor prompt/data leakage, supply chain, deployment, offline sync, credentials, privacy export/deletion, and observability. Each threat has asset, attacker, boundary, abuse case, control, detection, residual risk, and owner.

- [ ] **Step 6: Run aggregate verification and commit**

Run: `node --test scripts/test/*.test.mjs && pnpm verify && actionlint .github/workflows/*.yml`

Expected: PASS; a dry-run promotion with mismatched SHA fails before deployment and a matching evidence fixture passes.

```bash
git add .github/workflows/deploy-staging.yml .github/workflows/deploy.yml scripts/verify-release-artifact.mjs scripts/post-deploy-smoke.mjs docs/runbooks docs/security/threat-model.md
git commit -m "ci(release): promote verified artifacts with rollback evidence"
```
