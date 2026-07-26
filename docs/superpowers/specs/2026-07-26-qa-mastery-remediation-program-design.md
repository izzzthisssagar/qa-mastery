# QA Mastery Remediation Program Design

- **Date:** 2026-07-26
- **Status:** Approved architecture; program specification awaiting user review
- **Repository base:** `origin/main` at `39f7d0e`
- **Program scope:** unfinished Claude work, the 41-ticket improvement backlog, the repository assessment, the client-experience audit, and the Loop/context-control defects discovered during handoff

## 1. Objective

Complete the full QA Mastery remediation program without losing interrupted work, merging stacked branches as if they were independent, allowing parallel workers to collide, or deploying a revision that has not passed the complete quality and security gate.

“Complete” has three meanings in this program:

1. Existing defects and incomplete pull requests are corrected, integrated, and verified.
2. New product capabilities in the audits are implemented as independently reviewable subsystems.
3. Strategic capabilities are implemented only after their prerequisite data models, security boundaries, usage evidence, and rollout controls exist.

The program does not turn all recommendations into one branch. It uses dependency-aware waves and isolated work lanes so independent work proceeds concurrently while shared foundations remain serialized.

## 2. Evidence and current state

The design is based on direct inspection of:

- `origin/main` and all local QA Mastery worktrees and branches;
- the latest Claude JSONL history ending at the weekly-limit interruption;
- live pull-request and branch-protection state observed on 2026-07-26;
- `loop-build/backlog.json`, session logs, generated vault state, and control scripts;
- `loop-engineering/tools/loop-context` version 1.3.0;
- the repository assessment and QA Mastery Client Experience Audit supplied by the user.

Important facts that govern the design:

- The shared QA checkout is a feature branch with pre-existing untracked user files. It is not an integration base.
- The open Loop PR branches are stacked through auth, PostCSS, and E2E commits. Their tips are not safe independent merge units.
- PR #131 gates production on the CI workflow but not the separate security workflow, and its dependency audit is red.
- Branch protection requires only `checks` and `secret-scan`; it does not require RLS, dependency audit, or the E2E shards.
- `wt-p1-governance` contains three uncommitted, unverified files. Its BS-016 test contains an incorrect release expectation.
- `loop-build` has 41 tickets, not the documented 38. Its durable states disagree, P2-1 is stranded, and the current driver does not safely resume interrupted work.
- `loop-context` is a deterministic ledger/circuit-breaker library. It does not manage backlogs, worktrees, path locks, retries, verification, or Git integration.

## 3. Chosen architecture

### 3.1 One integration governor

One root coordinator owns:

- the canonical integration branch;
- `.github/**`;
- dependency declarations and the workspace lockfile;
- migration-number allocation and migration integration;
- the unified backlog and lane ownership map;
- aggregate verification;
- pull-request supersession and final release handoff.

Feature lanes never modify those shared integration surfaces without first releasing their lane and transferring ownership to the governor.

### 3.2 Clean integration base

The program starts from a clean worktree created from a freshly fetched `origin/main`. Existing branches are evidence and commit sources, not the base of new feature lanes.

Ticket-only commits are transplanted when useful. Branch tips are not merged wholesale. The initial known extraction set is:

| Capability | Commit(s) to inspect and transplant |
|---|---|
| PostCSS audit fix | `1cab5d5` |
| Auth destination preservation | `6877207` or its clean rebased equivalent |
| Honest note save | `5133aa4`, `5fda70d` |
| Convention gates | `29e208f` |
| Mobile touch and Monaco fallback | `34572df`, `43e4d38` |
| Widget accessibility | `79c5a9e`, `41798ec` |
| Notification regression work | `95b6cdb`, `87f802b` |
| E2E sharding | `13dc612` |
| Output tracing guard | `308066b` |

Every extracted commit is reviewed against current `main`, stripped of unrelated ancestry, and reverified.

### 3.3 Parallel worktrees with ownership locks

Each active lane receives:

- one branch based on the current integration checkpoint;
- one isolated worktree;
- one explicit allowlist of owned paths;
- one machine-readable task definition with acceptance criteria;
- one Loop Context ledger;
- one verification command set;
- one handoff record containing current diff, test evidence, blockers, and next action.

The controller refuses to start a lane if its path allowlist overlaps an active lane. Locks apply to directories and individual shared files. Lock ownership is released only after the lane is committed, verified, and queued for integration or explicitly abandoned.

### 3.4 Concurrency model

Four available execution slots are used as:

```text
1 integration governor + 3 implementation or audit lanes
```

Lanes rotate at integration boundaries. Database migrations, lockfile updates, authenticated-shell changes, and workflow changes are serialized even when their consuming features were developed concurrently.

## 4. Control-plane design

### 4.1 Canonical state

`loop-build/backlog.json` is reconciled and upgraded into the single machine-readable queue. The upgraded schema records:

- stable ticket ID and parent program;
- title, scope, acceptance criteria, and evidence source;
- status: `todo`, `ready`, `in-progress`, `blocked`, `review`, `integrated`, or `released`;
- dependency IDs;
- owned paths and collision keys;
- lane, branch, worktree, base commit, and current head;
- attempt count and latest ledger path;
- local and CI verification evidence;
- PR and superseded-PR references;
- external approval requirements.

`state.md` and the Obsidian mirror become generated views of this JSON. Neither is independently editable state.

### 4.2 Loop Context integration

Each lane uses a separate ledger:

```text
loop-build/.loop-context/<lane>/run.json
```

The controller appends one attempt exactly once after an action completes. It records a sanitized action summary, outcome, short error signature, verification evidence, and token count when available.

Before a retry, the controller runs `loop-context --check`. A tripped circuit breaker blocks another automated attempt and creates a human handoff. `--inject` is used only for resuming an interrupted or failed lane; the full ticket acceptance criteria and current Git diff are always included separately.

The initial integration does not use shared daily-budget files because version 1.3.0 can double-count unchanged ledgers and does not provide safe concurrent writes. Per-lane limits are explicit, and the governor computes program totals.

### 4.3 Safe resume rules

The replacement controller must never force-remove a dirty worktree or delete an interrupted branch. At startup it:

1. fetches and records the current `origin/main` revision;
2. inventories all managed worktrees;
3. resumes a matching `in-progress` ticket when its worktree is intact;
4. stops and escalates if Git state differs from recorded state;
5. creates a new worktree only for a `ready` ticket with no active owner;
6. preserves untracked files unless they were created and registered by that lane.

### 4.4 Mechanical safety gate

The path gate is implemented with real glob matching rather than partial shell greps. It covers environment files, secrets, service-role code, authentication, seeded-bug manifests, curriculum content, migrations, workflows, and deployment files.

Human-gated paths may still be changed in this program, but only by the governor after a written plan, focused review, and relevant security tests. “Human-gated” means controlled, not permanently skipped.

## 5. Program waves and work lanes

### Wave 0 — Preserve and reconcile

This wave is serial and blocks implementation lanes.

1. Snapshot every existing worktree, dirty path, branch, PR, and verification result.
2. Preserve the shared feature checkout and `wt-p1-governance` unchanged.
3. Correct the BS-016 test expectation before adopting the unfinished governance work.
4. Reconcile all 41 historical tickets against current code and live PR state.
5. Add every repository- and UX-audit requirement as a stable ticket.
6. Mark P2-1 as interrupted rather than implemented and recover or restart it deliberately.
7. Install the new state, lock, ledger, and safe-resume mechanisms.
8. Disable the old `run-session.sh` entry point until its safety tests pass.
9. Recover Claude's completed video-caption fetch or rerun it, reconcile all 439 recorded items, and update `Video-Audit-Action-Items.md` so the report no longer claims work is pending when usable evidence exists.

### Wave 1 — Release and repository foundations

The governor integrates these in dependency order:

1. PostCSS and current production dependency-audit fix.
2. CI sharding with current action versions, merged reports, deterministic required statuses, and a final aggregate status.
3. Deployment gating that requires both aggregate CI and aggregate security success for the exact commit.
4. Immutable GitHub Action SHAs, container digests, and explicit CLI versions.
5. Node/runtime/type alignment and framework/linter alignment.
6. Auth destination preservation.
7. Convention gates, truthful workspace scripts, `pnpm verify`, repository-wide Prettier or Biome formatting, dependency-cycle enforcement, and release-type correction.
8. Direct unit coverage for BuggyShop and BuggyAPI protocol, validation, defect-flag, and secure-control logic where browser tests are needlessly indirect.
9. Split the oversized learning server-action module into server-only domain services, keep exported actions thin, and change `lessonRelease()` to return the strict release union without an `any` escape.
10. Verify caching, aggregate XP/progress calculations, authentication/session handling, and service-role mutations against the historical backlog before adopting old fixes.
11. Documentation correction and consolidation, including generated consistency checks for app count, migration count, Node policy, and public commands.
12. Contributor license, contribution guide, code of conduct, issue templates, PR template, and technical-debt tracking conventions.
13. Branch-protection configuration prepared for required CI, RLS, E2E, dependency-audit, and secret-scan statuses.

Production deployment remains blocked until this wave is verified.

### Wave 2 — Client foundations

Three lanes run concurrently after Wave 1 stabilizes.

#### Lane A: Shell and design system

- Governed functional color palette.
- Spacing, radius, elevation, and motion tokens.
- Light, Dark, and System theme choices.
- Shared icon family replacing emoji in primary controls and navigation.
- Accessible form controls, fields, tabs, segmented controls, breadcrumbs, navigation rail, bottom navigation, dialogs, sheets, popovers, tooltips, toasts, progress, responsive data display, and feedback states.
- Component-gallery or style-guide route.
- Authenticated index, detail, editor, and dashboard page templates.
- Desktop navigation rail, mobile bottom navigation, active section state, and breadcrumbs.
- Command-palette navigation, recent destinations, and destination history after the core information architecture is stable.
- A shared celebration service with semantic motion tokens, reduced-motion handling, intensity control, repetition limits, and user preference support.

#### Lane B: Trust and accessibility

- Integrate route focus and reduced-motion work.
- Replace or complete the dropdown menu interaction model.
- Make glossary terms work with keyboard, focus, click, and touch.
- Add skip navigation and consistent landmarks.
- Add shared Error, Not Found, Offline, Permission, and retry states.
- Standardize EmptyState usage.
- Enforce touch-target and focus-state requirements.
- Require meaningful media descriptions or explicit decorative classification.
- Add responsive image metadata and loading behavior.
- Add keyboard-only E2E flows, zoom/reflow/high-contrast checks, and a manual VoiceOver/NVDA checklist.
- Add Testing Library and `jsdom` interaction coverage for keyboard behavior, focus management, event handling, state transitions, forms, and client hydration while retaining static-render tests where they are the correct unit.

#### Lane C: Immediate learning tools

- Integrate honest note-save status and local draft recovery.
- Rename the curriculum surface from Notes Wiki to Knowledge Base while retaining stable route compatibility.
- Integrate the mobile simulator fallback.
- Add simulator reset, copy, download, clear output, fullscreen, runtime/version display, and Cmd/Ctrl+Enter.
- Improve raw output into explicit success, compile error, runtime error, timeout, and infrastructure-error states.
- Replace the portfolio’s mobile horizontal table with responsive cards.
- Add direct regression coverage for simulator source normalization, runtime selection, output parsing, shortcut behavior, local recovery, and intentionally secure control paths.

### Wave 3 — Creation, personalization, and community

These are separate subsystems with separate specifications and migrations. Up to three run concurrently once their shared UI foundations are released.

#### Personal notes

- Private notes attached to Knowledge Base topics.
- Markdown-oriented editor, autosave, local fallback, tags, favorites, search, lesson backlink, and Markdown/JSON export.
- Later increments: attachments, templates, Mermaid diagrams, history, read-only sharing, and PDF export.
- Rich handwriting/OCR/drawing begins only after tablet demand is measured.

#### Coding workspaces

- Named private snippets, autosave, recent work, reset/fork, shareable links, snapshots, standard input, custom tests, output tabs, parsed diagnostics, and lesson/skill association.
- Later increments: multi-file projects, dependencies, GitHub export, collaboration, secure isolated containers, debugger, and portfolio publishing.

#### Community and notifications

- Real notification list, unread history, deep links, pagination, and mark-one/mark-all semantics.
- Notification-category preferences, quiet hours, thread following, and mute controls.
- Bookmarks, saved posts, recommended tags/members/groups, edit history, moderation outcomes, accepted/helpful-answer reputation, duplicate-question suggestions, and simulator embeds.
- Media descriptions, responsive variants, moderation, and malware scanning.
- Quality signals use expertise, accepted answers, reports, and helpfulness rather than raw posting volume.

#### Onboarding, profile, and mastery

- Outcome, baseline, preferred path/language, weekly commitment, reminder, target-date, and optional diagnostic onboarding.
- Progressive profile completion, avatar upload/crop, privacy, discoverability, contact, portfolio visibility, accessibility, notification, timezone, session, export, and deletion settings.
- Skill taxonomy and states: Not assessed, Emerging, Developing, Proficient, Verified, and Needs refresh.
- Evidence recency, confidence, strongest/weakest/improving skills, next activity, and role-readiness panels.
- Peer comparison is opt-in, cohort-safe, range-based, and methodologically explained.

### Wave 4 — Intelligence, mobile, security, and scale

- Adaptive lesson, review, practice-type, difficulty, and weak-area recommendations.
- Durable cross-device synchronization with conflict detection for notes, snippets, progress, tasks, and drafts.
- PWA installability, service-worker tiers, web push, Android TWA, and device-matrix validation.
- Native/Capacitor functionality only when a requirement cannot be met by the PWA/TWA path.
- Optional sound and haptic behavior only in supported installed experiences, disabled by default and governed by user preferences; ordinary navigation remains silent.
- Trusted credentials with measured skills, assessment version, evidence, date, refresh/expiration, and verification URL.
- CodeQL, dependency review, staging ZAP baseline, k6 smoke/load/spike/soak suites, SBOM, release provenance, and optional Scorecard.
- Central typed environment validation and generated/documented environment inventory.
- Coverage baselines and ratcheting thresholds for security-critical and domain logic.
- Content Security Policy hardening, threat modelling, rate-limit review, secret-boundary tests, upload quarantine, and security observability for authentication, service-role, moderation, and execution flows.
- Production observability with structured logs, privacy-safe error monitoring, release correlation, service-level indicators, alert ownership, and tested incident runbooks.
- Staging promotion, post-deployment health checks, rollback verification, and evidence retention.
- Privacy policy, consent, data export, account deletion, retention policy, and store data-safety declarations.
- Repository-size audit and evidence-based cleanup without casual history rewriting.

## 6. Data and security boundaries

Every new table receives:

- a unique serialized migration number;
- RLS enabled in the creation migration;
- explicit policies following read-own/write-own or service-role-only invariants;
- grants reviewed independently from RLS;
- live RLS tests;
- inclusion in the RLS-coverage guard;
- retention, export, and deletion classification;
- audit events for sensitive service-role mutations.

Likely domains include learner preferences/goals, personal notes and versions, code workspaces and snapshots, notification preferences, community bookmarks/subscriptions/reputation, and skill evidence/mastery. Exact schemas belong to their subsystem specifications; this program design does not pre-commit unsafe column or policy details.

BuggyShop and BuggyAPI remain deliberately vulnerable teaching applications. DAST runs against the production learning platform staging environment. Practice apps require explicit expected-finding baselines so intentional vulnerabilities do not become meaningless permanent failures.

## 7. Integration protocol

1. A lane starts only from a recorded integration checkpoint.
2. The lane writes a failing test before behavior changes.
3. The lane runs its focused red/green cycle and package-level verification.
4. The lane commits only owned paths and creates a handoff record.
5. The governor reviews the diff, current base, ledger, and fresh test output.
6. The governor integrates one lane at a time.
7. Dependency declarations are reconciled and the lockfile is regenerated once per integration batch.
8. Migrations are renumbered, reviewed, reset locally, and RLS-tested serially.
9. Aggregate verification runs on the combined revision.
10. A PR is opened or updated only after local aggregate verification succeeds.
11. Superseded stacked PRs are closed with links to the clean replacement changes.

No lane force-pushes another lane, merges to `main`, changes branch protection, modifies hosting configuration, or deploys production.

## 8. Verification and definition of done

### Per-lane minimum

- Relevant failing regression test observed before implementation.
- Focused unit/component/integration tests pass afterward.
- Package lint and typecheck pass.
- No unexpected diff outside the lane allowlist.
- Ledger and handoff evidence are current.

### Integration minimum

- Frozen dependency installation.
- Repository formatting check.
- `pnpm lint` across every workspace.
- `pnpm typecheck` across every workspace.
- `pnpm test` including DB test participation semantics.
- Curriculum validation and synchronization dry run.
- RLS table-coverage guard and live local-Supabase regression suite.
- Production builds for all three Next.js apps and the WebSocket service.
- Client-bundle manifest and secret leak checks.
- Chromium and WebKit core E2E shards.
- BuggyAPI contract suite.
- Accessibility and keyboard journeys.
- Visual regression in the pinned environment.
- First-paint/performance smoke checks.
- Production dependency audit, secret scan, CodeQL, and dependency review when available.
- Merged Playwright/JUnit evidence with unambiguous aggregate statuses.

### Product acceptance

Each subsystem also has task-based acceptance criteria, failure recovery, responsive behavior, accessibility checks, security boundaries, analytics/observability needs, and rollback instructions. Passing generic repository tests does not prove product acceptance.

## 9. Release flow

```text
integration checks
  → staging application and database deployment
  → migration verification
  → smoke, contract, accessibility, performance, and DAST checks
  → human review of evidence
  → promote the verified artifact
  → production health verification
  → rollback automatically or manually when health criteria fail
```

Production must deploy the exact revision or artifact tested in staging. Rebuilding unrelated artifacts for production is not promotion.

Branch-protection changes, PR merges that trigger production, environment approvals, secret creation, database project configuration, Vercel/Fly identity changes, store submissions, and destructive history cleanup are explicit external human gates.

## 10. Failure and escalation behavior

The controller stops a lane when:

- the same error repeats three times;
- five consecutive attempts make no progress;
- the per-lane attempt or token budget is exhausted;
- the owned path overlaps another active lane;
- Git state does not match the recorded checkpoint;
- a migration, auth, service-role, secret, deployment, or production boundary lacks review;
- verification produces a failure outside the lane’s authorized scope.

Escalation preserves the worktree and branch and emits:

- goal and acceptance criteria;
- base and head commits;
- owned paths and current diff;
- actions already attempted;
- sanitized failure signatures and latest short error;
- tests run and their exact results;
- the smallest decision required from a human.

## 11. Requirements traceability

| Source area | Covered by |
|---|---|
| Architecture, code quality, dependencies, CI/CD, deployment, docs, configuration, governance | Waves 0, 1, and 4 |
| Coverage, component tests, performance, SAST, DAST, load, SBOM | Waves 1 and 4 |
| Design identity, tokens, themes, palette, templates, component gallery | Wave 2 Lane A |
| Navigation and information architecture | Wave 2 Lane A |
| Empty/loading/error/offline/save states | Wave 2 Lanes B and C |
| Accessibility, dropdown, glossary, touch, media, keyboard, screen readers | Wave 2 Lane B |
| Icon and media systems | Wave 2 Lanes A and B; Wave 3 Community |
| Knowledge Base and personal notes | Wave 2 Lane C; Wave 3 Personal notes |
| Simulator utilities, persistence, diagnostics, strategic IDE | Wave 2 Lane C; Wave 3 Coding workspaces |
| Community discovery, notifications, moderation, quality, reputation | Wave 3 Community |
| Profiles, personalization, onboarding, skill mastery, peer comparison | Wave 3 Onboarding/profile/mastery |
| Motion vocabulary and celebration governance | Wave 2 Lane A |
| Responsive/adaptive layouts and platform conventions | Wave 2 Lanes A and B; Wave 4 mobile |
| Adaptive learning, offline sync, credentials, ethical benchmarking, rich notes, native/PWA | Wave 4 |
| Existing Loop backlog, interrupted Claude changes, and context management | Waves 0 and 1 |

## 12. Program completion

The program is complete only when:

- every reconciled ticket is `released`, explicitly rejected with rationale, or evidence-gated with a recorded decision and trigger;
- no superseded PR or dirty managed worktree remains ambiguous;
- required branch checks reflect the full release gate;
- staging-to-production promotion and rollback are proven;
- documentation describes the delivered system rather than historical architecture;
- every new data domain is covered by RLS, export, deletion, and retention rules;
- manual accessibility and product-journey evidence exists for critical flows;
- the user receives a final requirement-by-requirement completion matrix with verification evidence and any remaining external action.
