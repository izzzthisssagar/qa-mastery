# P2-4 — In-app real-time notifications (Supabase Realtime)

## Finding
The feature itself was already fully implemented on `main` before this
session: `notification-bell.tsx` subscribes to Supabase Realtime
`postgres_changes` INSERT events on `notifications` filtered to
`user_id=eq.${userId}`, the `notifications` table (RLS: recipient reads/marks
own, no insert policy — writes are service-role only via `notify()` in
`community/actions.ts`) is already added to the `supabase_realtime`
publication in `supabase/migrations/20260702000027_communities.sql`, and the
bell is wired into `(app)/layout.tsx` with a server-seeded `initialUnread`
count. No client write path exists anywhere in this flow. So no code changes
were needed — invariant 2 (learners never write scores/notifications) was
already upheld.

## What was missing and what I added
The ticket's acceptance criterion ("bell updates < 2s after a service-role
`notifications` insert") had no regression test. Added
`e2e/tests/notification-bell-realtime.spec.ts`: two browser contexts sign up
as separate learners, the author posts to `/community`, a second learner
likes it (triggering `toggleLike` → `notify()`, a real service-role insert),
and the test asserts the author's bell badge appears with count "1" — with no
page reload — within a 2s Playwright `expect` timeout, matching the
acceptance bar exactly. Modeled on the existing `talent-realtime.spec.ts`
two-context pattern.

## Verify
`pnpm --filter e2e exec playwright test notification-bell-realtime` against
the local Supabase stack (`pnpm db:start` first — needs Docker, unavailable
in this sandbox so the test wasn't run here, only typechecked clean via
`tsc --noEmit`).

## Diff
1 file added: `e2e/tests/notification-bell-realtime.spec.ts`. No denylisted
paths touched (test-only, `e2e/**` is in gate.yaml's `auto_pr_allowlist`).

## Deferred
None — ticket scope is fully covered. P2-5 (web push fan-out) depends on this
and is a separate ticket.
