# 02 — Architecture

## Monorepo layout

Canonical in [`../ARCHITECTURE.md`](../ARCHITECTURE.md) — system context,
package DAG, and the app/service surface live there so this doc doesn't carry
a second copy that can drift out of sync (three apps, one Fly.io service,
under `apps/` and `services/`; internal packages under `packages/`;
`supabase/migrations/` for the data model; `e2e/` for the cross-app Playwright
suite). What follows here is operational detail specific to this repo's
Next.js/Supabase/Tailwind setup that ARCHITECTURE.md doesn't need.

Build orchestration is **Turborepo** (`turbo.json`) over **pnpm workspaces**
(`pnpm-workspace.yaml`). Internal packages ship **TypeScript source** (no build
step) and each app lists them in `transpilePackages` so Next transpiles them
in place.

## Tech stack & why

| Choice                                                      | Why                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js 16.2.11** (App Router, Turbopack, React Compiler) | Server Components let curriculum content + answer keys stay server-side; server actions handle grading without a separate API. ⚠️ Middleware is `src/proxy.ts` (not `middleware.ts`) — this Next differs from older docs; check `apps/*/node_modules/next/dist/docs/` before using unfamiliar APIs. |
| **Supabase** (Postgres + Auth + RLS)                        | Row-Level Security _is_ the authorization model. The platform's security guarantees (learners can't write scores, can't read other learners) are enforced in the database, not just the app.                                                                                                        |
| **`@supabase/ssr`**                                         | Cookie-based auth across Server Components / actions. Convention: always `getAll`/`setAll` cookie methods; always `auth.getUser()` (never `getSession()`) in server code; one client per request.                                                                                                   |
| **Tailwind v4**                                             | Styling. Workspace package sources need an `@source` line in each app's `globals.css` so their classes are scanned (see the widgets `@source` in `apps/platform/src/app/globals.css`).                                                                                                              |
| **TS-source packages + `transpilePackages`**                | No per-package build/watch; edit-and-refresh DX, single type-check graph.                                                                                                                                                                                                                           |
| **Turborepo + pnpm**                                        | Cached `build`/`lint`/`typecheck`/`test`; the `e2e` script chains `turbo build` first (cached → cheap).                                                                                                                                                                                             |

## Package dependency graph

The full, code-derived DAG (all three apps + the WebSocket service) is in
[`../ARCHITECTURE.md`](../ARCHITECTURE.md#package-dependency-graph). One
detail specific to this doc: `curriculum` **does** import `grading` (for RAG
embedding and content-side validation) — an earlier version of this diagram
showed a "structural mirror, no import" relationship that no longer holds;
don't trust an old copy of this graph over `scripts/check-dep-cycles.mjs`'s
own read of each `package.json`.

## The three-layer auth boundary

Authentication is checked in three places, by design — the outer layers are
optimistic (fast UX), the inner layers are the real gate:

```mermaid
sequenceDiagram
  participant U as Browser
  participant P as proxy.ts (middleware)
  participant L as (app)/layout.tsx (RSC)
  participant A as server action

  U->>P: GET /learn/boundary-value-analysis
  P-->>U: optimistic redirect to /login if no session cookie
  U->>L: (authenticated) render (app) shell
  L->>L: supabase.auth.getUser() — REAL boundary; redirect if null
  U->>A: submitQuiz(slug, answers)
  A->>A: getAuthedUserId() re-checks — throws if not authed
  A-->>U: graded result
```

- **`src/proxy.ts`** — optimistic redirects only. Never the security boundary.
- **`(app)/layout.tsx`** — server-side `getUser()`; the true page-level gate.
- **Every mutating server action** — re-checks via `getAuthedUserId()`
  (`apps/platform/src/lib/auth.ts`). Defence in depth: a server action is
  reachable without rendering the layout, so it cannot trust the layout's check.

## One real identity, two fake ones

The platform owns the real learner identity (Supabase Auth cookies). BuggyShop
and BuggyAPI each have their **own fake auth** (a curriculum subject in its own
right — BuggyShop's login bugs and BuggyAPI's four auth schemes are part of
what learners practice against) and never share cookies with the platform.
Real identity crosses into either practice app only via a signed **handoff
token** (`packages/shared`) delivered in a URL fragment (`/enter#t=…`) and
stored in `localStorage` — never a cookie. See
[04 — Invariants](./04-invariants.md) #3 and [08 — Decisions](./08-decisions.md).

Next: [03 — Data model](./03-data-model.md).
