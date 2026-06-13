import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { lessonFrontmatterSchema, type LessonFrontmatter } from "./frontmatter";

export interface LessonSource {
  filePath: string;
  frontmatter: LessonFrontmatter;
  /** MDX body without frontmatter. */
  body: string;
  /** Stable hash of frontmatter + body; lets the sync skip unchanged lessons. */
  contentHash: string;
}

/** One quiz question. Mirrors @qa-mastery/grading's QuizQuestion structurally
 *  (kept local so curriculum doesn't depend on grading). `correct` is the
 *  answer key — server-only, never sent to the client. */
export interface QuizQuestionFile {
  id: string;
  type: "single" | "multi";
  prompt: string;
  options: string[];
  correct: number[];
  points?: number;
  explanation?: string;
}

export interface QuizFile {
  questions: QuizQuestionFile[];
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
  const contentHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(frontmatter) + "\n" + content)
    .digest("hex");
  return { filePath, frontmatter, body: content, contentHash };
}

export function loadAllLessons(contentRoot?: string): LessonSource[] {
  return listLessonFiles(contentRoot).map(parseLessonFile);
}

export function findLessonBySlug(
  slug: string,
  contentRoot?: string,
): LessonSource | null {
  for (const file of listLessonFiles(contentRoot)) {
    const lesson = parseLessonFile(file);
    if (lesson.frontmatter.slug === slug) return lesson;
  }
  return null;
}

/** Read a lesson's MDX body (no frontmatter) by slug. */
export function loadLessonBody(slug: string, contentRoot?: string): string {
  const lesson = findLessonBySlug(slug, contentRoot);
  if (!lesson) throw new Error(`No lesson with slug "${slug}"`);
  return lesson.body;
}

/** Load a lesson's quiz answer key (server-only). Throws if the file is
 *  missing — a lesson whose frontmatter promises a quiz must ship one. */
export function loadQuiz(slug: string, contentRoot?: string): QuizFile {
  const lesson = findLessonBySlug(slug, contentRoot);
  if (!lesson) throw new Error(`No lesson with slug "${slug}"`);
  const quizPath = lesson.filePath.replace(/\.mdx$/, ".quiz.json");
  if (!fs.existsSync(quizPath)) {
    throw new Error(`No quiz file for lesson "${slug}" (expected ${quizPath})`);
  }
  const parsed = JSON.parse(fs.readFileSync(quizPath, "utf8")) as QuizFile;
  if (!parsed.questions?.length) {
    throw new Error(`Quiz for "${slug}" has no questions`);
  }
  return parsed;
}
