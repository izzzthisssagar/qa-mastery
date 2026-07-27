# 04 — Invariants

These seven rules come from `CLAUDE.md` and are **non-negotiable**. Each is a
security or correctness guarantee the product depends on. Read this before
changing data access, content, or BuggyShop. For each: _what it is_, _why it
matters_, _how it's enforced_.

---

## 1. Manifest secrecy

**What.** The seeded-bug manifests (`buggyshop.bs_bug_manifest` and
`buggyapi.ba_bug_manifest`, with `title_internal` / `repro_steps_internal`)
never reach a client bundle.

**Why.** If the answer key shipped to the browser, learners could read the bugs
instead of finding them — the entire product is finding them.

**How enforced.** Grading reads both manifests server-side only (BuggyAPI
reports its grade in `dashboard/actions.ts` `submitApiBugReport`). CI greps
the built `.next/static` output across platform + buggyshop + buggyapi for
`title_internal` / `repro_steps_internal` and fails on any hit. The
`buggyshop`/`buggyapi` schemas are deny-all (invariant 4), so a client can't
query either even if it tried.

---

## 2. Learners never write their own scores

**What.** Score/feedback writes to `quiz_attempts`, `lab_submissions`,
`bug_reports`, and `xp_events` go through the **service role** inside server
actions. Learners get read-own RLS only.

**Why.** A learner who can write their own score can forge a pass. XP and
completion must be earned through the grader.

**How enforced.** The score tables have read-own RLS and **no insert/update
policy** ([03](./03-data-model.md)). Only the service role (which bypasses RLS)
writes them, inside `submitQuiz` (`apps/platform/src/app/(app)/learn/actions.ts`).
The learner's JWT physically cannot insert a row.

---

## 3. Practice-app auth is fake

**What.** BuggyShop's signup/login and BuggyAPI's users/API keys/OAuth clients
are _curriculum subjects_ (seeded bugs live there) writing sandbox rows
(`bs_users`/`bs_sessions`, `ba_users`/`ba_api_keys`/…). Real identity arrives
only via the handoff token (`packages/shared`) in the `/enter#t=…` URL fragment
→ `localStorage`. **No cookies in that path.**

**Why.** Both practice apps must be safely, deliberately broken without
endangering the real account. A URL fragment is never sent to a server and
shares nothing with platform cookies, so a practice-app bug can't escalate
into the learner's identity.

**How enforced.** The token is minted/verified in `packages/shared`
(`sandbox-token`, unit-tested). Each practice app reads it from the fragment
into `localStorage`; neither sets an auth cookie. Platform, BuggyShop, and
BuggyAPI each run on their own port/origin.

---

## 4. Every `bs_*`/`ba_*` row is scoped by `sandbox_id`

**What.** All BuggyShop and BuggyAPI data is per-sandbox. Access is
service-role via route handlers; the `buggyshop` and `buggyapi` schemas both
have deny-all RLS. Both share one `public.sandboxes` table (one row per
learner).

**Why.** Learners share one deployment of each practice app; their data must
never bleed across sandboxes.

**How enforced.** Deny-all RLS + no role grants on the `buggyshop`/`buggyapi`
schemas. Every query is service-role and filtered by `sandbox_id`.
`provision_sandbox` / `reset_sandbox` have `execute` revoked from everyone but
the service role.

---

## 5. Lesson slugs are immutable once published

**What.** The registry sync upserts on `slug`; a removed lesson is **archived,
never deleted**.

**Why.** `progress`, `quiz_attempts`, and `review_queue` reference lessons by id.
Re-slugging or deleting a published lesson would orphan a learner's history.

**How enforced.** `packages/curriculum/scripts/sync.ts` upserts by slug and, in
`--apply` mode, archives DB lessons whose slug is no longer in the repo rather
than deleting them.

---

## 6. Widgets are registry-validated

**What.** A lesson's frontmatter `widgets:` entries must name real widgets in
`packages/widgets/src/names.ts`.

**Why.** A typo'd widget name should fail the build, not render a broken lesson
for a learner.

**How enforced.** `names.ts` is React-free so the sync script can import it under
plain Node. `sync.ts` validates every `widgets:` entry with `isWidgetName(...)`
and fails (CI gate) on an unknown name.

---

## 7. Seeded bugs go behind a flag

**What.** Seeded-bug logic is wrapped in `bugFlag(id, release)` (BuggyShop) or
`apiBugFlag(id, mode)` (BuggyAPI) — never inlined.

**Why.** Bugs must be toggleable per release/mode (BuggyShop ships v1.0 → v2.0
with different active bugs; BuggyAPI's mode comes from the handoff token) and
auditable in one place.

**How enforced.** `bugFlag(id, release)` lives in `packages/shared`
(`bug-flag.ts`): a registry of seeded bugs keyed by id with an introduced/fixed
release window, plus a pure `isBugActive` predicate, unit-tested. BuggyShop's
BS-008 price-filter bug is wired through it (active in v1.0, fixed in v1.1).
`apiBugFlag(id, mode)` (`apps/buggyapi/src/api/bugs.ts`) reads BuggyAPI's mode
from `ba_sandbox_state`, set from the handoff token's `mode` claim — clean
mode is a perfect reference API. The remaining seeded bugs adopt the same
wrapper pattern as they land.

---

Next: [05 — Curriculum & content](./05-curriculum-and-content.md).
