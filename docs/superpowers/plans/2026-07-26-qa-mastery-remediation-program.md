# QA Mastery Remediation Program Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute every approved repository and client-experience remediation through dependency-aware, collision-free lanes with recoverable state and release evidence.

**Architecture:** This file is the program governor and dependency index; detailed red/green implementation steps live in the linked subsystem plans. One governor integrates and verifies while at most three isolated implementation lanes own disjoint paths. Shared workflows, dependencies, lockfiles, migration numbering, authenticated shell files, and release state are serialized.

**Tech Stack:** pnpm 11, Turbo 2, TypeScript 5, Next.js 16, React 19, Vitest 4, Playwright 1.60, Supabase/PostgreSQL RLS, GitHub Actions, Vercel, Fly.io, Loop Context 1.3.0.

## Global Constraints

- Base every managed lane on a recorded clean integration checkpoint derived from current `origin/main`; existing branch tips are evidence and commit sources, not merge units.
- Preserve every pre-existing dirty worktree and untracked user file. Never force-remove a dirty worktree or delete an interrupted branch.
- Use one integration governor plus no more than three implementation/audit lanes.
- The governor exclusively owns `.github/**`, root package/dependency files, `pnpm-lock.yaml`, migration-number allocation/integration, backlog state, branch-protection handoff, and deployment evidence.
- Migrations `0036` through `0045` are serialized in the exact allocation recorded below; feature lanes may author only their allocated migration file.
- A lane may modify only its recorded allowlist. Any overlap stops both the new assignment and integration until the governor resolves ownership.
- Every behavior change follows red/green/refactor, runs focused lint/type/test checks, and commits an independently reviewable deliverable.
- No lane pushes, merges to `main`, changes repository rules, creates secrets, modifies hosting identities, deploys production, submits stores, or rewrites history.
- Production remains blocked until aggregate CI, aggregate security, staging smoke, accessibility, performance smoke, and scoped DAST pass for the exact promoted revision.
- Strategic features are not declared complete through scaffolding: product journeys, RLS, privacy lifecycle, observability, rollback, and manual accessibility evidence are required.

---

## Plan Catalog and Dependency Graph

| Order | Plan | Depends on | Exclusive collision keys |
|---|---|---|---|
| 0 | `2026-07-26-loop-control-plane-recovery.md` | approved specification | loop state, controller, worktree registry, video audit |
| 1 | `2026-07-26-release-repository-governance.md` | 0 | workflows, root manifests, lockfile, docs, deployment |
| 2A | `2026-07-26-client-shell-design-system.md` | 1 | authenticated layout, design tokens, shared UI exports |
| 2B | `2026-07-26-client-trust-accessibility.md` | 1 | global accessibility/error primitives, E2E accessibility config |
| 2C | `2026-07-26-immediate-learning-tools.md` | 1 | current notes completion, simulator client, mobile portfolio |
| 3A | `2026-07-26-personal-notes.md` | 2A, 2B, 2C | migration 0036, Knowledge Base topic annotations |
| 3B | `2026-07-26-coding-workspaces.md` | 2A, 2B, 2C | migration 0037, simulator persistence |
| 3C | `2026-07-26-community-notifications.md` | 2A, 2B, 3B | migration 0038, community/notification data and UI |
| 3D | `2026-07-26-onboarding-profile-mastery.md` | 2A, 2B | migrations 0039–0040, settings/profile/mastery contracts |
| 4A | `2026-07-26-adaptive-offline-credentials.md` | 3A, 3B, 3D | migrations 0041–0043, progress, sync, credential routes |
| 4B | `2026-07-26-security-performance-observability.md` | 1, stable client routes | workflows, dependencies, lockfile, CSP, telemetry, release evidence |
| 4C | `2026-07-26-privacy-media-lifecycle.md` | 3A–3D, 4A data contracts | migrations 0044–0045, privacy routes, upload lifecycle |

```text
control plane
  → release foundations
      → client foundations ─→ personal notes ────┐
                           ├→ coding workspaces ─┼→ adaptive/offline/credentials
                           │        └→ community │
                           └→ onboarding/mastery ┘
      → security/performance/observability (governor lane)
      → privacy/media lifecycle after all user-data contracts stabilize
```

## Migration Allocation

| Migration | Owner plan |
|---|---|
| `20260726000036_personal_notes.sql` | Personal notes |
| `20260726000037_code_workspaces.sql` | Coding workspaces |
| `20260726000038_community_quality_notifications.sql` | Community and notifications |
| `20260726000039_learner_preferences.sql` | Onboarding/profile/mastery |
| `20260726000040_skill_evidence.sql` | Onboarding/profile/mastery |
| `20260726000041_adaptive_learning.sql` | Adaptive/offline/credentials |
| `20260726000042_offline_sync.sql` | Adaptive/offline/credentials |
| `20260726000043_trusted_credentials.sql` | Adaptive/offline/credentials |
| `20260726000044_privacy_requests.sql` | Privacy/media lifecycle |
| `20260726000045_media_quarantine.sql` | Privacy/media lifecycle |

---

### Task 1: Recover and install the safe program control plane

**Files:**
- Follow: `docs/superpowers/plans/2026-07-26-loop-control-plane-recovery.md`
- Produce: canonical backlog, generated state views, lane ledgers, path locks, safe-resume controller, preserved-work inventory, and corrected video-audit state.

**Interfaces:**
- Produces: `ready` tickets with dependencies/allowlists and a controller that never destroys interrupted state.

- [ ] **Step 1: Execute the control-plane plan task by task**

Use the required execution sub-skill and stop on any mismatch between recorded and actual Git state.

- [ ] **Step 2: Verify recovery evidence**

Run the control-plane plan's focused tests and dry-run resume scenarios. Expected: all 41 historical tickets and every new audit ticket have one canonical status; P2-1 is explicitly recovered or restarted; the old unsafe driver cannot run accidentally; no existing worktree changed.

- [ ] **Step 3: Commit and record the integration checkpoint**

Record commit SHA, tests, backlog schema version, active locks, and zero dirty managed lanes in the program handoff.

### Task 2: Establish release and repository foundations

**Files:**
- Follow: `docs/superpowers/plans/2026-07-26-release-repository-governance.md`

**Interfaces:**
- Consumes: Task 1 controller and canonical state.
- Produces: green dependency audit, truthful root verification, aggregate CI/security statuses, immutable automation, gated staging/promotion, corrected docs/governance, and stable integration base.

- [ ] **Step 1: Execute ticket-only recovery in dependency order**

Inspect and transplant only reviewed commits for PostCSS, authentication destination preservation, sharding, conventions, note save, mobile fallback, accessibility, notifications, and output tracing. Never merge stacked tips.

- [ ] **Step 2: Complete every release-governance task**

Run red/green tests and commits from the plan. Serialize workflow, root package, lockfile, and documentation changes through the governor.

- [ ] **Step 3: Run the Wave 1 aggregate gate**

Run frozen install, formatter, all-workspace lint/type/test, curriculum validation, local DB reset/RLS, three app builds, WebSocket build, manifest/secret scans, Chromium/WebKit core E2E, BuggyAPI contracts, accessibility, visual, first-paint, and production dependency audit.

Expected: every gate passes on one commit; production remains disabled until repository-rule and environment approvals are performed by the user.

### Task 3: Run the three client-foundation lanes concurrently

**Files:**
- Follow: `docs/superpowers/plans/2026-07-26-client-shell-design-system.md`
- Follow: `docs/superpowers/plans/2026-07-26-client-trust-accessibility.md`
- Follow: `docs/superpowers/plans/2026-07-26-immediate-learning-tools.md`

**Interfaces:**
- Consumes: Task 2 stable base.
- Produces: released shared shell/design primitives, accessibility/trust primitives, and reliable immediate learning tools.

- [ ] **Step 1: Create three worktrees from the same checkpoint**

Assign disjoint allowlists. Treat `apps/platform/src/app/(app)/layout.tsx`, `apps/platform/src/app/layout.tsx`, `apps/platform/src/app/globals.css`, `packages/ui/src/index.ts`, `packages/ui/src/button.tsx`, `apps/platform/src/components/nav/app-shell.tsx`, E2E config, and package/lock files as governor-mediated collision keys even when one lane proposes them. `button.tsx` is shared by shell/design (token/variant pass) and trust/accessibility (touch-target/focus-ring pass); trust/accessibility's change lands only after shell/design's is integrated.

- [ ] **Step 2: Execute all three plans independently**

Each lane completes its own failing tests, implementation, focused verification, commits, and handoff without importing unintegrated code from a sibling lane.

- [ ] **Step 3: Integrate one lane at a time**

Integration order is shell/design, trust/accessibility, then immediate learning tools unless a recorded interface dependency requires one focused prerequisite commit earlier. Regenerate the lockfile once after dependency reconciliation.

- [ ] **Step 4: Run combined client journeys**

Verify desktop rail, mobile bottom navigation, Light/Dark/System, keyboard/screen-reader interactions, route errors/offline states, Knowledge Base naming, honest note save, simulator controls/fallback/diagnostics, responsive portfolio, visual snapshots, and both browser engines.

### Task 4: Run creation lanes with bounded dependency-aware concurrency

**Files:**
- Follow: `docs/superpowers/plans/2026-07-26-personal-notes.md`
- Follow: `docs/superpowers/plans/2026-07-26-coding-workspaces.md`
- Follow: `docs/superpowers/plans/2026-07-26-community-notifications.md`

**Interfaces:**
- Consumes: Task 3 integrated UI and learning-tool contracts.
- Produces: migrations 0036–0038 and complete personal-note, coding-workspace, and community/notification journeys.

- [ ] **Step 1: Allocate the three migration files and disjoint worktrees**

The governor reserves the exact numbers above. Personal notes and coding workspaces begin together. The third slot runs the independent security/environment/coverage tasks from the security plan while community waits for the `code_workspaces` contract required by code embeds. Each feature lane owns only its migration and matching RLS test; migration reset/integration remains serial.

- [ ] **Step 2: Integrate coding workspaces before starting community persistence**

After migration 0037 and its workspace-sharing contract pass RLS and integration checks, create the community lane from that checkpoint. This prevents its migration, RLS tests, and embed actions from targeting a table absent from the lane base.

- [ ] **Step 3: Execute every task in the three subsystem plans**

Require owner isolation, service-role boundaries, autosave/local recovery, accessible interaction, responsive views, product E2E, observability hooks, export/deletion classification, and documentation.

- [ ] **Step 4: Integrate migrations and lanes serially**

Apply 0036, reset/RLS test, integrate code; repeat for 0037 and 0038. Re-run earlier RLS suites after each addition and reject any new exemption.

- [ ] **Step 5: Verify cross-feature behavior**

Confirm lesson-linked notes, workspace sharing privacy, community code embeds, notification deep links/preferences, media descriptions, moderation, reputation, and browser/mobile behavior without data leakage between fixture users.

### Task 5: Implement onboarding, profile, and mastery contracts

**Files:**
- Follow: `docs/superpowers/plans/2026-07-26-onboarding-profile-mastery.md`

**Interfaces:**
- Consumes: Task 3 UI system and Task 4 evidence-producing activities.
- Produces: `learner_preferences`, `skill_evidence`, and `skill_mastery` contracts required by adaptive learning and credentials.

- [ ] **Step 1: Establish the shared mastery calculation before persistence**

Execute Task 1 from `2026-07-26-adaptive-offline-credentials.md` first. The onboarding migration's SQL recomputation and live integration test must match the shared weighted-score/confidence calculation, 180-day refresh rule, and verified thresholds exactly.

- [ ] **Step 2: Execute migrations 0039 and 0040 serially**

Run live owner/service-role RLS tests after each migration and retain the exact contracts documented in the subsystem plan.

- [ ] **Step 3: Complete onboarding, settings, profile completion, evidence derivation, and mastery UI**

Verify destination preservation, progressive disclosure, accessibility/notification/timezone/privacy settings, avatar flow, evidence recency/confidence, strongest/weakest/refresh states, and opt-in cohort-safe comparison.

- [ ] **Step 4: Run combined first-user and returning-user journeys**

Test signup→goal/baseline/commitment→personalized first milestone and existing-user migration with safe defaults. Confirm no onboarding loop and no public exposure of private preferences/evidence.

### Task 6: Run strategic product and security lanes with governor serialization

**Files:**
- Follow: `docs/superpowers/plans/2026-07-26-adaptive-offline-credentials.md`
- Follow: `docs/superpowers/plans/2026-07-26-security-performance-observability.md`
- Follow: `docs/superpowers/plans/2026-07-26-privacy-media-lifecycle.md`

**Interfaces:**
- Consumes: Tasks 2–5 and all stable user-data contracts.
- Produces: migrations 0041–0045, adaptive recommendations, cross-device drafts, PWA shell, credentials, typed env, coverage, CSP, telemetry, security/load/DAST, privacy controls, and scanned media.

- [ ] **Step 1: Start adaptive and security lanes from the same stable checkpoint**

The adaptive lane owns migrations 0041–0043 and its product paths. The security plan runs as a governor-controlled lane because it owns dependencies, lockfile, workflows, CSP, and release files.

- [ ] **Step 2: Integrate adaptive work before privacy registry finalization**

Apply and verify 0041–0043 serially. Prove explainable recommendations, deterministic conflict handling, idempotent sync, non-cached authenticated HTML, and revocable public credentials with minimum-data verification.

- [ ] **Step 3: Execute privacy/media after every user-data table exists**

The privacy registry scanner must see migrations 0036–0043 before its baseline is committed. Apply 0044 and 0045 serially, then verify export completeness, cancellable deletion using fixtures only, private quarantine, signed scan callbacks, and only-clean publication.

- [ ] **Step 4: Complete staged security and performance evidence**

Verify environment coverage, code coverage ratchets, enforced CSP, redacted telemetry, immutable workflow refs, CodeQL, dependency review, SBOM/provenance, k6 smoke, scoped ZAP, and same-artifact staging promotion/rollback dry run.

### Task 7: Run final aggregate verification and requirement traceability

**Files:**
- Modify: canonical backlog and generated state views
- Create: `docs/reports/2026-07-26-remediation-completion-matrix.md`
- Modify: architecture, development, deployment, data, invariants, security, privacy, and contributor documentation as required by subsystem plans

**Interfaces:**
- Consumes: all prior tasks and lane handoffs.
- Produces: one evidence-backed release candidate and requirement-by-requirement verdict.

- [ ] **Step 1: Reconcile every requirement to delivered evidence**

Map every repository-audit row, client-audit recommendation, historical Loop ticket, Claude handoff item, open/superseded PR, migration, and external action to `implemented`, `rejected with rationale`, or `evidence-gated with trigger`. No item may remain implicit.

- [ ] **Step 2: Run the complete local gate from a clean install**

```bash
pnpm install --frozen-lockfile
pnpm verify
pnpm db:reset
pnpm test:rls
pnpm --filter @qa-mastery/curriculum sync
pnpm build
pnpm --filter @qa-mastery/e2e e2e
pnpm audit --prod --audit-level high
```

Expected: every command exits 0, every declared table has a direct RLS test or a previously approved shrinking legacy exemption, and no client bundle contains secrets or seeded answer keys.

- [ ] **Step 3: Run manual and staged evidence gates**

Record VoiceOver and NVDA critical journeys, keyboard-only navigation, 200%/400% zoom, high contrast, touch targets, mobile/tablet/desktop layouts, offline/two-device conflicts, notification preferences, media scanning, privacy request cancellation, credential revocation, performance smoke, DAST, health, and rollback dry run.

- [ ] **Step 4: Close ambiguity without mutating external state**

Prepare the exact branch-protection checks, superseded-PR closure list, required environment approvals, secret/identity configuration, and release promotion instructions. Do not apply, merge, push, deploy, delete, or close externally without the user's explicit approval.

- [ ] **Step 5: Commit the completion matrix and final documentation**

```bash
git add docs
git commit -m "docs: record QA Mastery remediation evidence"
```

Expected: the branch is clean, all tickets have explicit terminal or gated state, and the completion matrix links every claim to fresh command, CI, manual, or staged evidence.
