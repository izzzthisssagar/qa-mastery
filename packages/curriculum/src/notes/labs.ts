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

  // ── Manual QA · qa-foundations ───────────────────────────────────────────
  {
    chapterSlug: "qa-foundations/the-seven-principles",
    title: "Find where 80% of the bugs live",
    brief:
      "Defect clustering says most bugs cluster in a few modules. Given this run's bug counts per module, print the fewest modules — ranked by bug count — whose combined total reaches at least 80% of all bugs.",
    kind: "code_run",
    xp: 45,
    language: "python",
    starter: [
      "counts = {",
      '    "checkout": 12,',
      '    "search": 5,',
      '    "login": 2,',
      '    "profile": 1,',
      "}",
      "",
      "# Rank modules by bug count (highest first), then print the fewest of",
      "# them — one per line — whose running total reaches at least 80% of",
      "# the sum of all counts.",
    ].join("\n"),
    checks: [
      { label: "Prints the modules that cross 80% of all bugs", equals: "checkout\nsearch" },
      { label: "Ranks modules by bug count rather than hardcoding the order", sourceContains: "sort" },
      { label: "Computes the 80% threshold instead of guessing how many modules", sourceContains: "0.8" },
      { label: "Does not just print the literal answer", sourceAbsent: "checkout\\nsearch" },
    ],
  },

  // ── Manual QA · test-design-techniques ───────────────────────────────────
  {
    chapterSlug: "test-design-techniques/equivalence-partitioning",
    title: "Split ages into valid and invalid classes",
    brief:
      "A signup form accepts ages 18 to 65 inclusive. Partition the ages below into the valid and invalid equivalence classes, printing each list comma-separated in original order.",
    kind: "code_run",
    xp: 40,
    language: "python",
    starter: [
      "ages = [15, 18, 40, 65, 70, -5, 66]",
      "",
      "# Print two lines:",
      "#   valid: 18, 40, 65",
      "#   invalid: 15, 70, -5, 66",
      "# Partition by the 18-65 rule, don't just copy the numbers across.",
    ].join("\n"),
    checks: [
      { label: "Prints the valid class correctly", contains: "valid: 18, 40, 65" },
      { label: "Prints the invalid class correctly", contains: "invalid: 15, 70, -5, 66" },
      { label: "Filters by the boundary rule", sourceContains: "<=" },
      { label: "Walks the list rather than hand-picking", sourceContains: "for" },
    ],
  },
  {
    chapterSlug: "test-design-techniques/boundary-value-analysis",
    title: "Generate the boundary values",
    brief:
      "A field accepts 1 to 10. Print the six boundary values — min-1, min, min+1, max-1, max, max+1 — comma-separated, computed from the two limits below.",
    kind: "code_run",
    xp: 40,
    language: "python",
    starter: [
      "min_val = 1",
      "max_val = 10",
      "",
      "# Print: 0, 1, 2, 9, 10, 11",
      "# Compute each value from min_val/max_val — don't type the numbers directly.",
    ].join("\n"),
    checks: [
      { label: "Prints the six boundary values in order", equals: "0, 1, 2, 9, 10, 11" },
      { label: "Derives them from the limits", sourceContains: "min_val" },
      { label: "Does not just type the answer", sourceAbsent: '"0, 1, 2, 9, 10, 11"' },
    ],
  },
  {
    chapterSlug: "test-design-techniques/decision-tables",
    title: "Collapse the duplicate rules",
    brief:
      "A discount decision table has a duplicate row from a copy-paste. Count how many distinct rules remain after collapsing exact duplicates.",
    kind: "code_run",
    xp: 45,
    language: "python",
    starter: [
      "rules = [",
      '    (True, True, "20%"),',
      '    (True, False, "10%"),',
      '    (False, True, "10%"),',
      '    (False, False, "0%"),',
      '    (True, True, "20%"),',
      "]",
      "",
      "# Print exactly: 4 distinct rules",
    ].join("\n"),
    checks: [
      { label: "Prints the collapsed rule count", equals: "4 distinct rules" },
      { label: "Deduplicates instead of counting the raw list", sourceContains: "set(" },
    ],
  },
  {
    chapterSlug: "test-design-techniques/state-transition",
    title: "Check the workflow transitions",
    brief:
      "A content workflow only allows certain moves between states. For each transition below, print whether it's VALID or INVALID according to the map.",
    kind: "code_run",
    xp: 45,
    language: "python",
    starter: [
      "valid_transitions = {",
      '    "draft": ["submitted"],',
      '    "submitted": ["approved", "rejected"],',
      '    "approved": ["published"],',
      '    "rejected": ["draft"],',
      '    "published": [],',
      "}",
      "transitions_to_check = [",
      '    ("draft", "submitted"),',
      '    ("submitted", "published"),',
      '    ("approved", "published"),',
      '    ("published", "draft"),',
      "]",
      "",
      "# For each (from_state, to_state) pair, print one line:",
      "#   from_state -> to_state: VALID",
      "# or",
      "#   from_state -> to_state: INVALID",
    ].join("\n"),
    checks: [
      {
        label: "Judges all four transitions correctly",
        equals:
          "draft -> submitted: VALID\nsubmitted -> published: INVALID\napproved -> published: VALID\npublished -> draft: INVALID",
      },
      { label: "Looks the transition up in the map", sourceContains: "valid_transitions" },
      { label: "Walks the list of transitions", sourceContains: "for" },
    ],
  },

  // ── Manual QA · test-artifacts ───────────────────────────────────────────
  {
    chapterSlug: "test-artifacts/traceability",
    title: "Find the requirements coverage gap",
    brief:
      "Every requirement should have at least one test case linked to it. Print the requirement IDs that have zero linked cases, in the order they appear in the requirements list.",
    kind: "code_run",
    xp: 40,
    language: "python",
    starter: [
      'requirements = ["REQ-1", "REQ-2", "REQ-3", "REQ-4"]',
      'case_requirement_links = ["REQ-1", "REQ-1", "REQ-3"]',
      "",
      "# Print the requirement IDs with no linked case, one per line:",
      "#   REQ-2",
      "#   REQ-4",
    ].join("\n"),
    checks: [
      { label: "Finds both uncovered requirements", equals: "REQ-2\nREQ-4" },
      { label: "Checks coverage instead of hardcoding the gaps", sourceContains: "case_requirement_links" },
      { label: "Walks the requirements list", sourceContains: "for" },
    ],
  },

  // ── Manual QA · levels-and-types-of-testing ──────────────────────────────
  {
    chapterSlug: "levels-and-types-of-testing/functional-and-regression",
    title: "Pick the regression subset from an impact analysis",
    brief:
      "Two files changed. Print the names of every test whose coverage overlaps those files — that's the regression subset, not the whole suite — sorted alphabetically.",
    kind: "code_run",
    xp: 45,
    language: "python",
    starter: [
      'changed_files = {"checkout.py", "cart.py"}',
      "test_coverage = {",
      '    "test_login": {"login.py"},',
      '    "test_checkout_flow": {"checkout.py", "payment.py"},',
      '    "test_cart_totals": {"cart.py"},',
      '    "test_search": {"search.py"},',
      "}",
      "",
      "# Print the impacted test names, one per line, sorted alphabetically:",
      "#   test_cart_totals",
      "#   test_checkout_flow",
    ].join("\n"),
    checks: [
      { label: "Finds exactly the impacted tests", equals: "test_cart_totals\ntest_checkout_flow" },
      { label: "Compares coverage against the changed files", sourceContains: "changed_files" },
      { label: "Sorts instead of trusting dict order", sourceContains: "sort" },
    ],
  },
  {
    chapterSlug: "levels-and-types-of-testing/smoke-and-sanity",
    title: "Pull the smoke subset",
    brief:
      "Before a full regression run, only smoke-tagged tests run. Print how many there are, then their names in order.",
    kind: "code_run",
    xp: 40,
    language: "python",
    starter: [
      "tests = [",
      '    {"name": "login", "tags": ["smoke", "auth"]},',
      '    {"name": "checkout", "tags": ["regression"]},',
      '    {"name": "search", "tags": ["smoke"]},',
      '    {"name": "admin_panel", "tags": ["regression", "admin"]},',
      "]",
      "",
      "# Print:",
      "#   2 smoke tests",
      "#   login",
      "#   search",
    ].join("\n"),
    checks: [
      { label: "Prints the correct count and names", equals: "2 smoke tests\nlogin\nsearch" },
      { label: "Filters by the smoke tag", sourceContains: '"smoke"' },
      { label: "Walks the test list", sourceContains: "for" },
    ],
  },

  // ── Manual QA · defect-management ────────────────────────────────────────
  {
    chapterSlug: "defect-management/severity-vs-priority",
    title: "Combine severity and priority",
    brief:
      "Severity comes from whether a bug blocks the release; priority comes from how many users it affects. Print severity/priority for each bug below.",
    kind: "code_run",
    xp: 45,
    language: "python",
    starter: [
      "bugs = [",
      "    (True, True),    # blocks release, affects many users",
      "    (True, False),   # blocks release, affects few users",
      "    (False, True),   # doesn't block release, affects many users",
      "]",
      "",
      '# Rule: severity is "critical" if it blocks the release, else "minor".',
      '#       priority is "high" if it affects many users, else "low".',
      '# Print one "severity/priority" line per bug:',
      "#   critical/high",
      "#   critical/low",
      "#   minor/high",
    ].join("\n"),
    checks: [
      { label: "Combines all three correctly", equals: "critical/high\ncritical/low\nminor/high" },
      { label: "Derives severity from the release flag", sourceContains: "critical" },
      { label: "Derives priority from the reach flag", sourceContains: "high" },
      { label: "Builds the combo instead of typing it", sourceAbsent: '"critical/high"' },
    ],
  },
  {
    chapterSlug: "defect-management/the-bug-life-cycle",
    title: "Order the triage queue",
    brief:
      "Triage works critical bugs before major before minor, and within the same severity, the oldest bug first. Print the bug IDs in triage order.",
    kind: "code_run",
    xp: 45,
    language: "python",
    starter: [
      "bugs = [",
      '    {"id": "BUG-1", "severity": "minor", "age_days": 10},',
      '    {"id": "BUG-2", "severity": "critical", "age_days": 2},',
      '    {"id": "BUG-3", "severity": "critical", "age_days": 8},',
      '    {"id": "BUG-4", "severity": "major", "age_days": 5},',
      "]",
      "",
      "# Print the bug IDs in triage order, one per line:",
      "#   BUG-3",
      "#   BUG-2",
      "#   BUG-4",
      "#   BUG-1",
    ].join("\n"),
    checks: [
      { label: "Orders the queue correctly", equals: "BUG-3\nBUG-2\nBUG-4\nBUG-1" },
      { label: "Sorts by the rule instead of eyeballing it", sourceContains: "sort" },
      { label: "Uses severity in the ordering", sourceContains: "severity" },
    ],
  },

  // ── Manual QA · ui-ux-design-qa ──────────────────────────────────────────
  {
    chapterSlug: "ui-ux-design-qa/color-theory-for-testers",
    title: "Check a contrast ratio against WCAG AA",
    brief:
      "Run the real relative-luminance formula below on this gray-on-white pair, then print the contrast ratio and whether it clears the WCAG AA threshold for normal text (4.5:1).",
    kind: "code_run",
    xp: 50,
    language: "python",
    starter: [
      "def srgb_to_linear(c):",
      "    c = c / 255",
      "    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4",
      "",
      "def relative_luminance(hex_color):",
      '    hex_color = hex_color.lstrip("#")',
      "    r, g, b = (int(hex_color[i:i+2], 16) for i in (0, 2, 4))",
      "    return 0.2126 * srgb_to_linear(r) + 0.7152 * srgb_to_linear(g) + 0.0722 * srgb_to_linear(b)",
      "",
      "def contrast_ratio(color_a, color_b):",
      "    la, lb = relative_luminance(color_a), relative_luminance(color_b)",
      "    lighter, darker = max(la, lb), min(la, lb)",
      "    return (lighter + 0.05) / (darker + 0.05)",
      "",
      'fg = "#595959"',
      'bg = "#FFFFFF"',
      "",
      "# Print the ratio rounded to 2 decimal places, then PASS or FAIL against",
      "# WCAG AA for normal text (ratio >= 4.5), on one line like:",
      "#   7.0:1 PASS",
    ].join("\n"),
    checks: [
      { label: "Prints the ratio and verdict correctly", equals: "7.0:1 PASS" },
      { label: "Rounds to two decimal places", sourceContains: "round(" },
      { label: "Checks against the real AA threshold", sourceContains: "4.5" },
      { label: "Does not just print the literal answer", sourceAbsent: '"7.0:1 PASS"' },
    ],
  },

  // ── Manual QA · exploratory-testing (bug hunts) ──────────────────────────
  {
    chapterSlug: "exploratory-testing/heuristics-and-tours",
    title: "Run an SFDPOT tour on BuggyShop",
    brief:
      "Pick one SFDPOT lens (Structure, Function, Data, Platform, Operations, or Time) and tour a section of BuggyShop with it. File one real bug your tour turns up — page, feature, category and severity all have to be right to match.",
    kind: "bug_report",
    xp: 60,
    target: "buggyshop",
    minValidBugs: 1,
  },
  {
    chapterSlug: "exploratory-testing/reporting-exploratory-work",
    title: "File a bug from a timeboxed session",
    brief:
      "Run a real timeboxed exploratory session against BuggyShop — pick a charter, work it, and file one bug your session actually found.",
    kind: "bug_report",
    xp: 60,
    target: "buggyshop",
    minValidBugs: 1,
  },

  // ── Manual QA · ui-ux-design-qa (bug hunt) ───────────────────────────────
  {
    chapterSlug: "ui-ux-design-qa/design-qa-in-practice",
    title: "Flag a design bug devs will act on",
    brief:
      "Compare a BuggyShop page against expected spacing, states and breakpoints and file one design bug specific enough for a developer to fix without asking you to repeat yourself.",
    kind: "bug_report",
    xp: 55,
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
