# 10 — Caching policy

This is the policy the caching work was asked to write *before*
implementation: a follow-up ticket wraps lesson-content reads in
`unstable_cache` tagged by slug, and another wires per-user
`revalidateTag` on scoring/notes writes. Until those land, every read below
is **uncached** (a request-time `fs.readFileSync` or Supabase query every
time) — this doc is both the target policy and, in the mapping table below,
an honest map of what runs today.

## The rule that matters most

**Never cache per-user data under a shared/global key.** Every data read in
this app is either server-role (bypasses RLS) or RLS-scoped to `auth.uid()`.
A cache key that doesn't include the user id turns a per-user read into a
cross-user leak the moment two learners hit the same cached entry — the same
class of bug invariant 1 (manifest secrecy) and invariant 4 (`sandbox_id`
scoping) exist to prevent. Per-user cache tags/keys are namespaced
`user:${userId}` (or `sandbox:${sandboxId}` for practice-app data); there is
no global variant of these tags.

## Policy table

| Data class | Volatility | Layer & mechanism | Invalidation |
|---|---|---|---|
| Lesson/curriculum content (MDX body, quiz JSON) | Immutable once published (invariant 5 — slugs never change, content only replaced via sync) | `unstable_cache`, tagged `lesson:${slug}`, long TTL (no time-based expiry needed — content only changes via sync) | `revalidateTag(`lesson:${slug}`)` from `curriculum sync --apply`, one call per changed slug |
| Notes wiki content (MDX under `content/notes/**`) | Same shape as lesson content — pure MDX, no registry, no per-user override | `unstable_cache`, tagged `note-content:${module}/${chapter}/${topic}`, long TTL | Re-deploy today (no sync step for notes yet); a future notes sync would `revalidateTag` per changed leaf |
| Per-user progress/score data (dashboard XP/streaks/talent role, notes progress, learning-home rollup, quiz attempts, lab/bug-hunt/capstone submissions) | Per-user, changes on every scoring or notes write | No shared cache — per-user tag `user:${userId}` if/when wrapped in `unstable_cache` | `revalidateTag(`user:${userId}`)` after any write to `xp_events`, `streaks`, `profiles`, `progress`, `quiz_attempts`, `bug_reports`, `code_runs`, or `capstone_submissions` for that user |
| Tutor RAG retrieval (`match_lesson_chunks` similarity search over `lesson_chunks`) | Stable — only changes when lesson content is re-embedded | Safe to cache per query-embedding (or skip: the RPC is already a single indexed pgvector query, not a hot path) | On `pnpm --filter @qa-mastery/curriculum embed` (re-index) |
| Tutor per-user context (profile, episodic memories, recent messages, in-lesson progress) | Per-message, must reflect the just-written turn | Never cache — always fresh, service-role read scoped to `userId` | — |
| Tutor generations (Gemini/Groq chat completions) | Per-message | Never cache | — |
| Seeded-bug manifests (`bs_bug_manifest`, `ba_bug_manifest`) | Rarely changes (per-release), but grading correctness depends on reading the *current* release's flags | Never cache — read fresh on every grading call; the cost is one indexed query per bug report, not worth risking a stale bug flag mid-release | — |
| Static assets (`public/`, built JS/CSS chunks) | Immutable (content-hashed filenames) | Vercel CDN, `Cache-Control: immutable`, long `max-age` | Content hash changes on rebuild — no explicit invalidation needed |
| In-memory static/derived data (BuggyShop product catalog, BuggyAPI OpenAPI doc generated from zod schemas) | Immutable per deploy — not a DB read at all | Already effectively free (built into the deployed bundle, regenerated on each request from constants/schemas in memory) | Re-deploy |

## Current reads mapped to the table above

Every data read that exists in the codebase today, and which row it belongs
to:

| Read | Location | Row |
|---|---|---|
| `findLessonBySlug` / `loadLessonBody` / `loadQuiz` (`fs.readFileSync` per call) | `packages/curriculum/src/load.ts:75-122`, called from lesson pages, quiz grading, and `context.ts` below | Lesson/curriculum content |
| `listNoteFiles` / note MDX read | `packages/curriculum/src/notes/load.ts` | Notes wiki content |
| `xp_events` sum, `streaks`, `profiles.talent_role` | `apps/platform/src/app/(app)/dashboard/page.tsx:31,35-38,42-45` | Per-user progress/score data |
| `getNotesCurriculumProgress`, `getLearningHome` (both read `note_progress`) | `apps/platform/src/app/(app)/notes/actions.ts:56-84,112-166`, called from `dashboard/page.tsx:23-24` | Per-user progress/score data |
| `getNoteCompletion`, `completeNote` (`note_progress`, `xp_events`, `audit_events`) | `apps/platform/src/app/(app)/notes/actions.ts:234-291` | Per-user progress/score data |
| Lab history (`bug_reports`, `code_runs`) | `apps/platform/src/app/(app)/notes/lab-actions.ts:69,78` | Per-user progress/score data |
| Capstone submissions | `apps/platform/src/app/(app)/notes/capstone-actions.ts:37,79` | Per-user progress/score data |
| Lesson grading (`lessons`, `progress`, `quiz_attempts`) | `apps/platform/src/app/(app)/learn/actions.ts:42,74,83,133,157,165` | Per-user progress/score data |
| BuggyAPI's own grading (`bug_reports`, `code_runs`, `capstone_submissions`) | `apps/buggyapi/src/api/index.ts:290,299,439,497,525,552,566` | Per-user progress/score data |
| `match_lesson_chunks` RPC | `apps/platform/src/lib/help-agent/context.ts:93-113` (`loadRetrievedChunks`) | Tutor RAG retrieval |
| `help_agent_profiles`, `help_agent_memories`, `help_agent_messages`, `progress` (in-lesson + progress summary), `lessons`/`quiz_attempts` lookups | `apps/platform/src/lib/help-agent/context.ts:115-271` | Tutor per-user context |
| `streamChat` (Gemini→Groq failover) | `apps/platform/src/app/api/help-agent/chat/route.ts:132`, `packages/agent/src/llm/*` | Tutor generations |
| `ba_bug_manifest` read for grading | `apps/platform/src/app/(app)/dashboard/actions.ts:113-118` (`submitApiBugReport`) | Seeded-bug manifests |
| `bs_bug_manifest` read for grading | `apps/platform/src/app/(app)/notes/bug-hunt-actions.ts:54,142` | Seeded-bug manifests |
| `ba_sandbox_state` mode read (`apiBugFlag`) | `apps/buggyapi/src/api/bugs.ts:26` | Seeded-bug manifests (same per-release volatility) |
| Next.js build output, `public/` assets (no explicit `Cache-Control` set — relies on Vercel's default static-asset serving) | Vercel build; `apps/platform/next.config.ts`, `apps/buggyshop/next.config.ts`, `apps/buggyapi/next.config.ts` | Static assets |
| BuggyShop product catalog (in-memory constant, no DB) | `apps/buggyshop/src/lib/catalog.ts` | In-memory static/derived data |
| BuggyAPI OpenAPI doc generation (`app.doc31`) | `apps/buggyapi/src/api/index.ts:619` | In-memory static/derived data |
| Auth reads (`auth.getUser()`) gating every action above | `apps/platform/src/lib/auth.ts:5-11`, `dashboard/page.tsx:18,26`, `settings/actions.ts:36-49`, `app/api/help-agent/chat/route.ts:25-28` | Not cached anywhere — Supabase SSR requires a fresh check per request (see `docs/02-architecture.md` three-layer auth boundary) |

## Why the split between "RAG retrieval" and "per-user context"

`buildAgentContext` (`context.ts`) fires both in the same `Promise.all` per
tutor turn, but they have opposite cacheability: the similarity search only
depends on lesson content (stable), while the profile/memories/messages reads
must reflect whatever the *previous* turn just wrote (a memory logged mid-
conversation must show up next turn). Collapsing them into one cache entry
would either serve stale personalization or defeat the point of caching the
retrieval. Keep them as two reads.

Back to the [index](./README.md).
