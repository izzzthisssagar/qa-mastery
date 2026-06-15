/**
 * Curriculum sync — content/*.mdx frontmatter → DB lesson registry.
 *
 * Default mode: VALIDATE ONLY (CI runs this on every PR).
 *   - frontmatter schema (zod)
 *   - duplicate slug detection
 *   - widget names exist in @qa-mastery/widgets
 *   - module codes exist in the taxonomy
 *
 * `--apply`: upsert tracks/modules/lessons via the service role, then archive
 *   any DB lesson whose slug is no longer in the repo (never delete — progress
 *   FKs must survive). Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 *
 * See the architecture plan §Content↔DB registry sync.
 */
import { createServiceClient } from "@qa-mastery/db";
import { isWidgetName } from "@qa-mastery/shared/widget-names";
import { listLessonFiles, parseLessonFile, type LessonSource } from "../src/load";
import { MODULES, TRACKS, moduleSlug } from "../src/taxonomy";

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
    const fm = lesson.frontmatter;

    const existing = bySlug.get(fm.slug);
    if (existing) {
      problems.push({ file, message: `duplicate slug "${fm.slug}" (also in ${existing})` });
    } else {
      bySlug.set(fm.slug, file);
    }

    for (const widget of fm.widgets) {
      if (!isWidgetName(widget)) {
        problems.push({ file, message: `unknown widget "${widget}"` });
      }
    }

    if (!MODULES[fm.module]) {
      problems.push({ file, message: `unknown module code "${fm.module}" (add it to taxonomy.ts)` });
    } else if (MODULES[fm.module].track !== fm.track) {
      problems.push({
        file,
        message: `module ${fm.module} belongs to ${MODULES[fm.module].track}, but frontmatter says ${fm.track}`,
      });
    }

    lessons.push(lesson);
  } catch (error) {
    problems.push({ file, message: error instanceof Error ? error.message : String(error) });
  }
}

console.log(`curriculum sync: ${files.length} lesson file(s) found`);
for (const lesson of lessons) {
  const fm = lesson.frontmatter;
  console.log(
    `  • ${fm.slug} [${fm.track}/${fm.module} #${fm.order}] ${fm.status}${fm.free ? " (free)" : ""}`,
  );
}

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) {
    console.error(`  ✗ ${problem.file}\n    ${problem.message}`);
  }
  process.exit(1);
}

if (!apply) {
  console.log("\nvalidation passed (run with --apply to write the registry).");
  process.exit(0);
}

// ── apply: upsert the registry ─────────────────────────────────────────────

const supabase = createServiceClient();

const usedTracks = new Set(lessons.map((l) => l.frontmatter.track));
const usedModules = new Set(lessons.map((l) => l.frontmatter.module));

// tracks
const trackIdBySlug = new Map<string, string>();
for (const slug of usedTracks) {
  const meta = TRACKS[slug];
  if (!meta) throw new Error(`unknown track "${slug}" (add it to taxonomy.ts)`);
  const { data, error } = await supabase
    .from("tracks")
    .upsert(
      { slug, title: meta.title, order_index: meta.order, status: "published" },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (error) throw new Error(`track ${slug}: ${error.message}`);
  trackIdBySlug.set(slug, data.id);
}

// modules
const moduleIdByCode = new Map<string, string>();
for (const code of usedModules) {
  const meta = MODULES[code];
  const trackId = trackIdBySlug.get(meta.track);
  const { data, error } = await supabase
    .from("modules")
    .upsert(
      {
        track_id: trackId,
        slug: moduleSlug(code),
        title: meta.title,
        order_index: meta.order,
        status: "published",
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (error) throw new Error(`module ${code}: ${error.message}`);
  moduleIdByCode.set(code, data.id);
}

// lessons
for (const lesson of lessons) {
  const fm = lesson.frontmatter;
  const { error } = await supabase.from("lessons").upsert(
    {
      module_id: moduleIdByCode.get(fm.module),
      slug: fm.slug,
      title: fm.title,
      order_index: fm.order,
      free: fm.free,
      duration_min: fm.duration_min,
      lab_type: fm.lab_type,
      requires_release: fm.requires_release ?? null,
      content_hash: lesson.contentHash,
      status: fm.status,
    },
    { onConflict: "slug" },
  );
  if (error) throw new Error(`lesson ${fm.slug}: ${error.message}`);
}

// archive lessons that disappeared from the repo (never delete)
const repoSlugs = new Set(lessons.map((l) => l.frontmatter.slug));
const { data: dbLessons, error: listError } = await supabase
  .from("lessons")
  .select("slug, status");
if (listError) throw new Error(`listing lessons: ${listError.message}`);

let archived = 0;
for (const row of dbLessons ?? []) {
  if (!repoSlugs.has(row.slug) && row.status !== "archived") {
    const { error } = await supabase
      .from("lessons")
      .update({ status: "archived" })
      .eq("slug", row.slug);
    if (error) throw new Error(`archiving ${row.slug}: ${error.message}`);
    archived++;
  }
}

console.log(
  `\napplied: ${usedTracks.size} track(s), ${usedModules.size} module(s), ${lessons.length} lesson(s)` +
    (archived ? `, ${archived} archived` : ""),
);
