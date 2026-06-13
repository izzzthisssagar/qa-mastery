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

Back to the [index](./README.md).
