import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { lessonFrontmatterSchema, type LessonFrontmatter } from "./frontmatter";

export interface LessonSource {
  filePath: string;
  frontmatter: LessonFrontmatter;
  /** MDX body without frontmatter. */
  body: string;
}

/**
 * Resolve the content directory by walking up to the workspace root
 * (pnpm-workspace.yaml). Works from either app, the sync script, or tests.
 * Override with CURRICULUM_CONTENT_DIR (used by serverless deploys/tests).
 */
export function findContentRoot(startDir: string = process.cwd()): string {
  const override = process.env.CURRICULUM_CONTENT_DIR;
  if (override) return path.resolve(override);

  let dir = startDir;
  for (;;) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      return path.join(dir, "packages", "curriculum", "content");
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        `Could not locate workspace root (pnpm-workspace.yaml) walking up from ${startDir}`,
      );
    }
    dir = parent;
  }
}

export function listLessonFiles(contentRoot: string = findContentRoot()): string[] {
  if (!fs.existsSync(contentRoot)) return [];
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith(".mdx")) found.push(full);
    }
  };
  walk(contentRoot);
  return found.sort();
}

export function parseLessonFile(filePath: string): LessonSource {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = lessonFrontmatterSchema.parse(data);
  return { filePath, frontmatter, body: content };
}
