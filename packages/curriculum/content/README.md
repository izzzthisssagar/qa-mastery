# Curriculum content

One `.mdx` file per lesson, organized as `track-a/<module>/<slug>.mdx`.
Frontmatter contract lives in `../src/frontmatter.ts`; quiz answer keys are
co-located `<slug>.quiz.json` files (server-only — never imported by client
code). The first real lesson (`boundary-value-analysis`) lands in M1, ported
from `Product/Sample-Lessons/Lesson-1-BVA-Visual-Concept.md` in the notes repo.
