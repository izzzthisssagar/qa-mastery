# 05 — Curriculum & content

Lessons are **content, not code**. They live as MDX under
`packages/curriculum/content/` and are mirrored into the DB registry by a sync
script. This doc covers the content model and the pipeline.

## A lesson on disk

```
packages/curriculum/content/track-a/a3/
├── boundary-value-analysis.mdx        # prose + embedded widget + frontmatter
└── boundary-value-analysis.quiz.json  # the quiz, incl. the answer key
```

### Frontmatter (`packages/curriculum/src/frontmatter.ts`, zod-validated)

```yaml
slug: boundary-value-analysis      # kebab-case, IMMUTABLE once published
title: Boundary Value Analysis
track: track-a
module: A3                         # must exist in taxonomy.ts; track must match
order: 3
free: true                         # false ⇒ Pro (gated by entitlements)
duration_min: 25
widgets: [boundary-slider]         # must exist in widgets/src/names.ts
lab_type: bug_report
requires_release: "1.0"
status: published                  # draft | published | archived
flashcards:                        # seeded into the review queue on first pass
  - { front: "...", back: "..." }
```

### Body

Standard Markdown plus inline widget JSX. The BVA lesson embeds the Boundary
Hunter as `<BoundarySlider />` in its "See it" section. The page maps that tag
to the live widget at render time (see [06](./06-learn-feature.md)).

### Quiz (`*.quiz.json`) — the answer key is server-only

```json
{ "questions": [
  { "id": "bva-q1", "type": "single", "prompt": "…",
    "options": ["…","…"], "correct": [1], "explanation": "…" }
]}
```

`correct` and `explanation` are the **answer key**. They are read only on the
server (`loadQuiz`, which is in `packages/curriculum/src/load.ts` and reads the
file system). The learn page strips them before sending questions to the client;
they come back only *after* grading. See [06](./06-learn-feature.md) and
invariant 2.

## The content → DB sync

`packages/curriculum/scripts/sync.ts` has two modes:

| Mode | Command | What it does |
|---|---|---|
| **validate** (default) | `pnpm --filter @qa-mastery/curriculum sync` | Schema-checks every lesson: frontmatter (zod), duplicate slugs, widget names exist, module codes exist + track matches. **CI gate** — fails the PR on any problem. Writes nothing. |
| **apply** | `… sync --apply` | Everything validate does, then upserts `tracks`/`modules`/`lessons` via the service role and archives lessons whose slug left the repo. Needs `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. |

`--apply` upserts on `slug` (invariant 5: immutable, archive-never-delete), so a
learner's progress FKs always resolve.

> **Gotcha:** `sync --apply` writes to `public` tables, so it depends on the
> migration 0004 grants. Before those existed it failed with `permission denied
> for table tracks`. If you see that error, the public-schema grants are missing
> — reset the DB so all migrations apply.

## Taxonomy (`packages/curriculum/src/taxonomy.ts`)

Track and module titles/ordering live here, not in frontmatter — because many
lessons share a module, the title belongs to the module. `TRACKS` and `MODULES`
map slugs/codes (e.g. `A3`) to human titles and order; the sync upserts them.

## Flashcards & spaced repetition

A lesson's `flashcards` are seeded into `review_queue` (SM-2-lite) the first time
the learner passes its quiz — done inside `submitQuiz`, not at author time, so a
card only exists once earned.

## How content renders

`load.ts` is the read layer: `findLessonBySlug`, `loadLessonBody` (frontmatter
stripped), `loadQuiz` (answer key, server-only). The learn page composes these
with `next-mdx-remote/rsc`.

Next: [06 — The Learn feature](./06-learn-feature.md).
