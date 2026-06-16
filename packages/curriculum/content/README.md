# Curriculum content

One `.mdx` file per lesson, organized as `track-a/<module>/<slug>.mdx`.
Frontmatter contract lives in `../src/frontmatter.ts`; quiz answer keys are
co-located `<slug>.quiz.json` files (server-only — never imported by client
code). 59 lessons span Track A (`track-a/`, modules A1–A6) and Track B
(`track-b/`, modules B0–B5); `boundary-value-analysis` is the reference lesson,
ported from `Product/Sample-Lessons/Lesson-1-BVA-Visual-Concept.md` in the notes
repo.
