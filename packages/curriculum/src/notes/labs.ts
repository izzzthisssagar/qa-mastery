/**
 * Graded labs on the notes spine — the single source of truth for which
 * CHAPTER closes out with an assessed exercise.
 *
 * Why a registry in code rather than note frontmatter: a lab belongs to a
 * chapter, but MDX frontmatter can only describe the topic file it sits in, and
 * the taxonomy (`taxonomy.ts`) has no lab field. Declaring labs here keeps the
 * blast radius at one file instead of 876, and mirrors how `tracks.ts` already
 * layers curation on top of the raw tree.
 *
 * Not every chapter earns a lab. A chapter is a lab candidate only when DOING
 * beats reading — writing a loop, a locator, a query, a bug report. Conceptual
 * chapters stay note-and-XP only, and `note-labs.test.ts` asserts only that
 * every declared lab points at a real chapter, never that coverage is total.
 */

import type { LabCheck } from "@qa-mastery/grading";
import { NOTES_TAXONOMY } from "./taxonomy";

/**
 * How a lab is assessed.
 *   code_run    — learner writes code, we run it and assert on the output.
 *   bug_report  — learner hunts a seeded bug in a practice app and files it.
 *   test_design — learner authors test cases; graded on count + coverage.
 */
export type NoteLabKind = "code_run" | "bug_report" | "test_design";

export interface NoteLab {
  /**
   * "module/chapter" from the taxonomy — the lab's stable id and the value
   * written to `code_runs.note_slug` / `bug_reports.note_slug`. Immutable once
   * shipped, same rule as note slugs.
   */
  chapterSlug: string;
  title: string;
  /** One or two sentences: what to build, and what "done" looks like. */
  brief: string;
  kind: NoteLabKind;
  /** XP awarded on the first pass. Labs are worth more than a note read. */
  xp: number;

  // ── code_run only ────────────────────────────────────────────────────────
  /** Language id from SIMULATOR_LANGUAGES. */
  language?: string;
  /** Pre-filled editor content — a skeleton with the work left undone. */
  starter?: string;
  /** Assertions over the run. Empty means "clean exit is enough" (avoid). */
  checks?: readonly LabCheck[];

  // ── bug_report / test_design only ────────────────────────────────────────
  /** Which practice app hosts the hunt. */
  target?: "buggyshop" | "buggyapi";
  /** How many valid bug reports / test cases are required to pass. */
  minValidBugs?: number;
  minTestCases?: number;
}

/**
 * The lab set, ordered by track then by position in the spine.
 *
 * Every task is framed as testing work, never a generic programming exercise —
 * the learner is here to become a QA engineer, so the loop iterates test
 * results and the map counts statuses. Checks pair OUTPUT assertions with
 * SOURCE assertions: output alone is satisfied by printing the expected answer
 * as a literal, which is exactly the shortcut a beginner reaches for.
 */
export const NOTE_LABS: readonly NoteLab[] = [
  // ── Foundations · programming-basics ─────────────────────────────────────
  {
    chapterSlug: "programming-basics/variables-and-data-types",
    title: "Fix the types coming out of a CSV",
    brief:
      "A test report was exported to CSV, so every value arrived as text. Convert each one to the right type and print the summary line exactly: 40 tests, 37 passed, 12.5s",
    kind: "code_run",
    xp: 40,
    language: "python",
    starter: [
      "# Everything from a CSV arrives as text, even the numbers.",
      'total = "40"',
      'passed = "37"',
      'duration = "12.5"',
      "",
      "# Convert each to the right type, then print exactly:",
      "#   40 tests, 37 passed, 12.5s",
    ].join("\n"),
    checks: [
      { label: "Prints the summary line exactly", equals: "40 tests, 37 passed, 12.5s" },
      { label: "Converts the counts to whole numbers", sourceContains: "int(" },
      { label: "Converts the duration to a decimal number", sourceContains: "float(" },
    ],
  },
  {
    chapterSlug: "programming-basics/operators-and-expressions",
    title: "Calculate the pass rate",
    brief:
      "37 of 40 tests passed. Print the pass rate as a percentage rounded to one decimal place. Work it out with arithmetic — typing the answer will not pass.",
    kind: "code_run",
    xp: 40,
    language: "python",
    starter: [
      "total = 40",
      "passed = 37",
      "",
      "# Print the pass rate as a percentage, rounded to one decimal place.",
      "# For these numbers that is 92.5",
    ].join("\n"),
    checks: [
      { label: "Prints the correct pass rate", contains: "92.5" },
      // The whole point of the chapter is the expression, so ban the literal.
      { label: "Calculates it instead of typing the answer", sourceAbsent: "92.5" },
      { label: "Uses the totals given", sourceContains: "passed" },
    ],
  },
  {
    chapterSlug: "programming-basics/input-and-output",
    title: "Format a readable test report",
    brief:
      "Print one line per test in the form `name | status | 0.8s`. A report a human can scan is worth more than a dump of raw data.",
    kind: "code_run",
    xp: 40,
    language: "python",
    starter: [
      "rows = [",
      '    ("login", "pass", 0.8),',
      '    ("checkout", "fail", 2.4),',
      "]",
      "",
      "# Print one line per test, exactly like:",
      "#   login | pass | 0.8s",
    ].join("\n"),
    checks: [
      { label: "Formats the first row correctly", contains: "login | pass | 0.8s" },
      { label: "Formats the second row correctly", contains: "checkout | fail | 2.4s" },
      { label: "Builds the lines from the data", sourceContains: "for" },
    ],
  },

  // ── Foundations · logic-and-control-flow ─────────────────────────────────
  {
    chapterSlug: "logic-and-control-flow/conditions",
    title: "Decide a bug's severity",
    brief:
      "A bug that blocks the release with no workaround is critical; blocking with a workaround is major; anything else is minor. Print the verdict for the bug below, deciding it from the two flags rather than reading it off the comment.",
    kind: "code_run",
    xp: 40,
    language: "python",
    starter: [
      "blocks_release = True",
      "has_workaround = False",
      "",
      "# Print exactly one of: critical, major, minor",
      "#   critical = blocks the release AND has no workaround",
      "#   major    = blocks the release BUT has a workaround",
      "#   minor    = does not block the release",
    ].join("\n"),
    checks: [
      { label: "Reaches the right verdict", equals: "critical" },
      { label: "Decides with a condition", sourceContains: "if" },
      { label: "Actually reads the flags", sourceContains: "blocks_release" },
    ],
  },
  {
    chapterSlug: "logic-and-control-flow/loops",
    title: "Loop the failing test names",
    brief:
      "You have a list of test results. Print only the names of the tests that failed, one per line, in the order they appear. Use a loop — hardcoding the two names will not pass.",
    kind: "code_run",
    xp: 40,
    language: "python",
    starter: [
      "results = [",
      '    ("login_valid", "pass"),',
      '    ("login_empty_password", "fail"),',
      '    ("logout", "pass"),',
      '    ("cart_total_rounding", "fail"),',
      "]",
      "",
      "# Print the name of every test whose status is 'fail'.",
      "# One name per line, nothing else.",
    ].join("\n"),
    checks: [
      {
        label: "Prints both failing test names",
        contains: "login_empty_password",
      },
      {
        label: "Prints the second failure too",
        contains: "cart_total_rounding",
      },
      {
        label: "Does not print the passing tests",
        absent: "logout",
      },
      {
        label: "Uses a loop rather than hardcoding",
        sourceContains: "for",
      },
    ],
  },
  {
    chapterSlug: "logic-and-control-flow/functions",
    title: "Make the severity rule reusable",
    brief:
      "Wrap the severity rule in a function so it can be applied to any bug, then print the verdict for all three below — critical, major, minor, one per line.",
    kind: "code_run",
    xp: 45,
    language: "python",
    starter: [
      "bugs = [",
      "    (True, False),   # blocks the release, no workaround",
      "    (True, True),    # blocks the release, has a workaround",
      "    (False, True),   # does not block the release",
      "]",
      "",
      "# Write a function that takes the two flags and RETURNS the severity,",
      "# then print the verdict for each bug above, one per line.",
    ].join("\n"),
    checks: [
      { label: "Prints all three verdicts in order", equals: "critical\nmajor\nminor" },
      { label: "Defines a function", sourceContains: "def " },
      // A function that prints instead of returning misses the chapter's point.
      { label: "Returns the severity rather than printing inside", sourceContains: "return" },
    ],
  },
  {
    chapterSlug: "logic-and-control-flow/first-bugs-and-debugging",
    title: "Find the bug in the average",
    brief:
      "This is meant to print the average test duration and prints something else. One line is wrong — find it and fix it. Don't rewrite the program, and don't print the answer directly.",
    kind: "code_run",
    xp: 45,
    language: "python",
    starter: [
      "durations = [1.0, 2.0, 6.0]",
      "",
      "total = 0",
      "for d in durations:",
      "    total = d",
      "",
      "print(total / len(durations))",
    ].join("\n"),
    checks: [
      { label: "Prints the correct average", contains: "3.0" },
      { label: "Computes it rather than printing the answer", sourceAbsent: "print(3.0)" },
      { label: "Still adds the durations up in a loop", sourceContains: "for" },
    ],
  },

  // ── Foundations · working-with-data ──────────────────────────────────────
  {
    chapterSlug: "working-with-data/strings-and-text",
    title: "Normalise a messy test name",
    brief:
      "Test names arrive inconsistently typed. Turn the name below into a clean slug: trimmed, lowercased, spaces replaced with underscores — login_with_valid_user.",
    kind: "code_run",
    xp: 40,
    language: "python",
    starter: [
      'raw = "  Login With Valid User  "',
      "",
      "# Print the cleaned-up name:",
      "#   login_with_valid_user",
    ].join("\n"),
    checks: [
      { label: "Prints the cleaned name", equals: "login_with_valid_user" },
      { label: "Trims the surrounding whitespace", sourceContains: "strip" },
      { label: "Lowercases the text", sourceContains: "lower" },
      { label: "Replaces the spaces", sourceContains: "replace" },
    ],
  },
  {
    chapterSlug: "working-with-data/lists-and-arrays",
    title: "Name the two slowest tests",
    brief:
      "A slow suite is a suite nobody runs. Print the names of the two slowest tests, slowest first, one per line.",
    kind: "code_run",
    xp: 45,
    language: "python",
    starter: [
      "durations = [",
      '    ("login", 0.8),',
      '    ("checkout", 2.4),',
      '    ("search", 1.9),',
      '    ("logout", 0.3),',
      "]",
      "",
      "# Print the two slowest test names, slowest first, one per line.",
    ].join("\n"),
    checks: [
      { label: "Prints the two slowest, slowest first", equals: "checkout\nsearch" },
      { label: "Orders the data instead of eyeballing it", sourceContains: "sort" },
    ],
  },
  {
    chapterSlug: "working-with-data/key-value-data",
    title: "Count the run by status",
    brief:
      "Summarise the run: print how many tests ended in each status, sorted by status name — fail, pass, skip, each as `status: count`.",
    kind: "code_run",
    xp: 45,
    language: "python",
    starter: [
      "results = [",
      '    {"name": "login", "status": "pass"},',
      '    {"name": "checkout", "status": "fail"},',
      '    {"name": "search", "status": "pass"},',
      '    {"name": "logout", "status": "skip"},',
      "]",
      "",
      "# Print a count per status, sorted by status name:",
      "#   fail: 1",
      "#   pass: 2",
      "#   skip: 1",
    ].join("\n"),
    checks: [
      { label: "Counts every status correctly", equals: "fail: 1\npass: 2\nskip: 1" },
      { label: "Counts the data rather than listing it", sourceContains: "for" },
    ],
  },
  {
    chapterSlug: "working-with-data/simple-algorithms",
    title: "Find the first failure yourself",
    brief:
      "Print the position of the first failing test — 0 for the first test, 1 for the second, and so on. Search the list yourself; `.index()` is off limits for this one.",
    kind: "code_run",
    xp: 50,
    language: "python",
    starter: [
      'statuses = ["pass", "pass", "fail", "pass", "fail"]',
      "",
      "# Print the position of the FIRST failure. Counting starts at 0,",
      "# so the answer here is 2. Find it with a search — no .index().",
    ].join("\n"),
    checks: [
      { label: "Finds the first failure", equals: "2" },
      { label: "Searches instead of calling .index()", sourceAbsent: ".index(" },
      { label: "Walks the list", sourceContains: "for" },
    ],
  },

  // ── Foundations · a-first-language-deeper (Java — the Selenium stack) ─────
  {
    chapterSlug: "a-first-language-deeper/syntax-essentials",
    title: "Print a Java test summary",
    brief:
      "Your automation stack is Java, so start writing it. Print `37/40 tests passed`, building the line from the two variables rather than typing it out.",
    kind: "code_run",
    xp: 45,
    language: "java",
    starter: [
      "public class Main {",
      "    public static void main(String[] args) {",
      "        int total = 40;",
      "        int passed = 37;",
      "",
      "        // Print exactly: 37/40 tests passed",
      "    }",
      "}",
    ].join("\n"),
    checks: [
      { label: "Prints the summary line", equals: "37/40 tests passed" },
      { label: "Builds the line from the variables", sourceContains: "passed" },
      { label: "Does not hardcode the whole line", sourceAbsent: '"37/40 tests passed"' },
    ],
  },
  {
    chapterSlug: "a-first-language-deeper/object-oriented-basics",
    title: "Model a test case as a class",
    brief:
      "Page objects are just classes, so get comfortable now. Write a TestCase class holding a name and a status, give it a method returning `name: status`, and print it for the two cases below.",
    kind: "code_run",
    xp: 50,
    language: "java",
    starter: [
      "public class Main {",
      "    // Write a TestCase class with a name, a status, and a",
      "    // summary() method that returns \"name: status\".",
      "",
      "    public static void main(String[] args) {",
      "        // Create login/pass and checkout/fail, then print each summary:",
      "        //   login: pass",
      "        //   checkout: fail",
      "    }",
      "}",
    ].join("\n"),
    checks: [
      { label: "Prints both summaries", equals: "login: pass\ncheckout: fail" },
      { label: "Defines a TestCase class", sourceContains: "class TestCase" },
      { label: "Exposes a summary method", sourceContains: "summary" },
    ],
  },
  {
    chapterSlug: "a-first-language-deeper/collections-and-exceptions",
    title: "Report the failures from a map",
    brief:
      "Test results usually arrive keyed by name. Print the names of the failing tests, in the order they were added, one per line.",
    kind: "code_run",
    xp: 50,
    language: "java",
    starter: [
      "import java.util.LinkedHashMap;",
      "import java.util.Map;",
      "",
      "public class Main {",
      "    public static void main(String[] args) {",
      "        Map<String, String> results = new LinkedHashMap<>();",
      '        results.put("login", "pass");',
      '        results.put("checkout", "fail");',
      '        results.put("search", "pass");',
      '        results.put("payment", "fail");',
      "",
      "        // Print the name of every test whose status is \"fail\",",
      "        // one per line, in insertion order.",
      "    }",
      "}",
    ].join("\n"),
    checks: [
      { label: "Prints both failing tests in order", equals: "checkout\npayment" },
      { label: "Does not print the passing tests", absent: "login" },
      { label: "Walks the map", sourceContains: "for" },
    ],
  },

  {
    chapterSlug: "defect-management/writing-bug-reports",
    title: "File a real bug report",
    brief:
      "You've just read how to write a report a developer trusts. Now do it for real: launch your BuggyShop sandbox, find a seeded bug, and file it — page, feature, category and severity all have to be right to match.",
    kind: "bug_report",
    xp: 60,
    target: "buggyshop",
    minValidBugs: 1,
  },
];

/** Look up the lab that closes out a chapter, if there is one. */
export function labForChapter(chapterSlug: string): NoteLab | undefined {
  return NOTE_LABS.find((lab) => lab.chapterSlug === chapterSlug);
}

/** Every lab in a module, in taxonomy chapter order. */
export function labsForModule(moduleSlug: string): NoteLab[] {
  const mod = NOTES_TAXONOMY.find((m) => m.slug === moduleSlug);
  if (!mod) return [];
  return mod.chapters
    .map((chapter) => labForChapter(`${moduleSlug}/${chapter.slug}`))
    .filter((lab): lab is NoteLab => lab != null);
}

/**
 * Resolve a lab's chapter back to the taxonomy. Returns undefined when the
 * chapter does not exist — the guard the server action uses before letting a
 * submission through, so an unknown note_slug can never reach a runner.
 */
export function chapterForLab(chapterSlug: string):
  | { moduleSlug: string; chapterSlug: string; topicSlugs: string[] }
  | undefined {
  const [moduleSlug, chapter] = chapterSlug.split("/");
  if (!moduleSlug || !chapter) return undefined;

  const mod = NOTES_TAXONOMY.find((m) => m.slug === moduleSlug);
  const found = mod?.chapters.find((c) => c.slug === chapter);
  if (!mod || !found) return undefined;

  return {
    moduleSlug: mod.slug,
    chapterSlug: found.slug,
    // Only file-backed topics gate the lab; planned stubs would deadlock it.
    topicSlugs: found.topics.filter((t) => !t.planned).map((t) => t.slug),
  };
}
