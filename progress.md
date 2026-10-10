# Plan: docs/security/2026-10-10-dependency-hotfix-plan.md

Task SEC-01: complete — clean-main baseline c1ba7c5 and 3 critical / 10 high prod audit reproduced.
Task SEC-02: complete — Next.js and eslint-config-next 16.3.8 in all 3 apps; GraphQL Yoga 5.24.4 (same major) in BuggyAPI.
Task SEC-03: complete — patched transitive overrides constrained within their supported majors; single pnpm lockfile regenerated and frozen-installable; no suppressed advisories.
Task SEC-04: complete for production — production audit 0 critical and 0 high; whole development audit 1 unresolved high in braces@3.0.3 (no published patched 3.0.4 on npm), 0 critical; semantic security+runtime tests 10/10 pass and enforced by pnpm verify + GitHub checks.
Task SEC-05: complete for local scope — production HTTP smoke across patched BuggyAPI GraphQL/REST, QA platform auth/image optimizer and real Chrome BuggyShop cart at 390/768/1440; synthetic authenticated GraphQL CI-only E2E prepared, not yet executed.
Task SEC-06: complete for local scope — fresh pnpm verify exit 0 after reviewer-fix (runtime policy confirmed executing), frozen pnpm install, full pnpm build 3/3 production apps; audit and docs recorded in docs/security/2026-10-10-hotfix-acceptance.md. User's Mac kept >2.2 GiB free; no Docker/Supabase/hosted modifications.
Task SEC-07: in progress — focused read-only re-review, then security-only draft GitHub PR + CI run. Do not merge or deploy; separate Sprint 03 PR #163 still blocked by independent E2E failures, and its branch is untouched.
