## Summary

<!-- What does this PR do, and why? -->

## Scope

- [ ] This PR is scoped to one concern (split it if it's doing two unrelated things)
- Affected app(s)/package(s):

## Risk

<!-- What's the blast radius if this is wrong? Migration, RLS policy, auth, payment,
     or CI/deploy-workflow changes are high risk — call that out explicitly. -->

## Intentional bug registry checked

- [ ] **Intentional bug registry checked** — this PR does not silently fix a
      seeded BuggyShop/BuggyAPI bug (`BS-###` / `BA-###`). If it _does_ touch
      the manifest or a flagged bug's implementation, list the IDs and why
      below:

<!-- BS-###/BA-### affected, and why: -->

## Tests

- [ ] `pnpm verify` passes locally
- [ ] `pnpm test:rls` passes locally (if this touches migrations, RLS policies, or a server action writing scored/sandboxed data)
- [ ] `pnpm e2e` passes locally, or CI's e2e shards are green (if this touches a learner-facing flow)
- New/updated automated tests: <!-- describe, or explain why none were needed -->

## Accessibility impact

<!-- Any UI change: keyboard nav, focus order, color contrast (see the text-tone
     token rules in CLAUDE.md), reduced-motion behavior, screen-reader labels.
     Write "N/A — no UI change" if that's the case. -->

## Migration / deployment impact

- [ ] This PR adds or changes a `supabase/migrations/**` file
- [ ] This PR changes a `.github/workflows/**` file
- If either is checked, describe the rollout/rollback plan:

## Evidence

<!-- Screenshots, terminal output, or a short recording for anything not
     covered by an automated test. -->
