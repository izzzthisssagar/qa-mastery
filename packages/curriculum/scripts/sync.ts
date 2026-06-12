/**
 * Curriculum sync — content/*.mdx frontmatter → DB lesson registry.
 *
 * M0 scope: VALIDATION ONLY (runs in CI on every PR).
 *   - frontmatter schema (zod)
 *   - duplicate slug detection
 *   - widget names exist in @qa-mastery/widgets
 * M1 adds: --apply (service-role upsert of tracks/modules/lessons, archive
 * missing slugs, content_hash diffing) and BuggyShop manifest sync + stripped
 * taxonomy generation. See the architecture plan §Content↔DB registry sync.
 */
import { isWidgetName } from "@qa-mastery/widgets/names";
import { listLessonFiles, parseLessonFile, type LessonSource } from "../src/load";

interface Problem {
  file: string;
  message: string;
}

const apply = process.argv.includes("--apply");

const files = listLessonFiles();
const problems: Problem[] = [];
const bySlug = new Map<string, string>();
const lessons: LessonSource[] = [];

for (const file of files) {
  try {
    const lesson = parseLessonFile(file);
    const existing = bySlug.get(lesson.frontmatter.slug);
    if (existing) {
      problems.push({
        file,
        message: `duplicate slug "${lesson.frontmatter.slug}" (also in ${existing})`,
      });
    } else {
      bySlug.set(lesson.frontmatter.slug, file);
    }
    for (const widget of lesson.frontmatter.widgets) {
      if (!isWidgetName(widget)) {
        problems.push({ file, message: `unknown widget "${widget}"` });
      }
    }
    lessons.push(lesson);
  } catch (error) {
    problems.push({
      file,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

console.log(`curriculum sync: ${files.length} lesson file(s) found`);
for (const lesson of lessons) {
  const fm = lesson.frontmatter;
  console.log(
    `  ✓ ${fm.slug} [${fm.track}/${fm.module} #${fm.order}] ${fm.status}${fm.free ? " (free)" : ""}`,
  );
}

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) {
    console.error(`  ✗ ${problem.file}\n    ${problem.message}`);
  }
  process.exit(1);
}

if (apply) {
  console.error("\n--apply is not implemented yet (lands in M1); validation passed.");
  process.exit(2);
}

console.log("\nvalidation passed.");
