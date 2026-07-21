/**
 * Lab verification harness — proves every code_run lab is actually solvable and
 * actually rejects a non-answer.
 *
 * Run it after adding or editing labs:
 *   pnpm --filter @qa-mastery/curriculum verify-labs
 *
 * NOT a unit test, on purpose: it executes real code on Wandbox over the
 * network, so it can't sit in the CI unit suite (which must stay offline and
 * deterministic). The pure grading logic is covered by
 * packages/grading/test/lab-checks.test.ts; this covers the thing that file
 * cannot — that the starter, the checks and a real solution agree.
 *
 * For each code_run lab it asserts BOTH directions:
 *   - the untouched starter must NOT pass (otherwise the lab grades nothing)
 *   - the reference solution below MUST pass (otherwise the lab is unsolvable)
 *
 * Every new code_run lab needs a reference solution added to SOLUTIONS, or the
 * run reports it as missing.
 */

import { NOTE_LABS } from "../src/notes/labs";
import { gradeLabRun } from "@qa-mastery/grading";
import { WandboxRunner } from "@qa-mastery/grading/runners";

const runner = new WandboxRunner();

/** Reference solutions, keyed by chapter slug. One per code_run lab. */
const SOLUTIONS: Record<string, string> = {
  "programming-basics/variables-and-data-types": `
total = int("40")
passed = int("37")
duration = float("12.5")
print(f"{total} tests, {passed} passed, {duration}s")
`,
  "programming-basics/operators-and-expressions": `
total = 40
passed = 37
print(round(passed / total * 100, 1))
`,
  "programming-basics/input-and-output": `
rows = [("login", "pass", 0.8), ("checkout", "fail", 2.4)]
for name, status, secs in rows:
    print(f"{name} | {status} | {secs}s")
`,
  "logic-and-control-flow/conditions": `
blocks_release = True
has_workaround = False
if blocks_release and not has_workaround:
    print("critical")
elif blocks_release:
    print("major")
else:
    print("minor")
`,
  "logic-and-control-flow/loops": `
results = [
    ("login_valid", "pass"),
    ("login_empty_password", "fail"),
    ("logout", "pass"),
    ("cart_total_rounding", "fail"),
]
for name, status in results:
    if status == "fail":
        print(name)
`,
  "logic-and-control-flow/functions": `
def severity(blocks_release, has_workaround):
    if blocks_release and not has_workaround:
        return "critical"
    if blocks_release:
        return "major"
    return "minor"

bugs = [(True, False), (True, True), (False, True)]
for blocks, workaround in bugs:
    print(severity(blocks, workaround))
`,
  "logic-and-control-flow/first-bugs-and-debugging": `
durations = [1.0, 2.0, 6.0]
total = 0
for d in durations:
    total = total + d
print(total / len(durations))
`,
  "working-with-data/strings-and-text": `
raw = "  Login With Valid User  "
print(raw.strip().lower().replace(" ", "_"))
`,
  "working-with-data/lists-and-arrays": `
durations = [("login", 0.8), ("checkout", 2.4), ("search", 1.9), ("logout", 0.3)]
ordered = sorted(durations, key=lambda row: row[1], reverse=True)
for name, secs in ordered[:2]:
    print(name)
`,
  "working-with-data/key-value-data": `
results = [
    {"name": "login", "status": "pass"},
    {"name": "checkout", "status": "fail"},
    {"name": "search", "status": "pass"},
    {"name": "logout", "status": "skip"},
]
counts = {}
for row in results:
    counts[row["status"]] = counts.get(row["status"], 0) + 1
for status in sorted(counts):
    print(f"{status}: {counts[status]}")
`,
  "working-with-data/simple-algorithms": `
statuses = ["pass", "pass", "fail", "pass", "fail"]
for position, status in enumerate(statuses):
    if status == "fail":
        print(position)
        break
`,
  "a-first-language-deeper/syntax-essentials": `
public class Main {
    public static void main(String[] args) {
        int total = 40;
        int passed = 37;
        System.out.println(passed + "/" + total + " tests passed");
    }
}
`,
  "a-first-language-deeper/object-oriented-basics": `
public class Main {
    static class TestCase {
        String name;
        String status;
        TestCase(String name, String status) { this.name = name; this.status = status; }
        String summary() { return name + ": " + status; }
    }

    public static void main(String[] args) {
        System.out.println(new TestCase("login", "pass").summary());
        System.out.println(new TestCase("checkout", "fail").summary());
    }
}
`,
  "a-first-language-deeper/collections-and-exceptions": `
import java.util.LinkedHashMap;
import java.util.Map;

public class Main {
    public static void main(String[] args) {
        Map<String, String> results = new LinkedHashMap<>();
        results.put("login", "pass");
        results.put("checkout", "fail");
        results.put("search", "pass");
        results.put("payment", "fail");

        for (Map.Entry<String, String> entry : results.entrySet()) {
            if (entry.getValue().equals("fail")) {
                System.out.println(entry.getKey());
            }
        }
    }
}
`,
};

async function grade(lab: (typeof NOTE_LABS)[number], code: string) {
  const run = await runner.executeSync({
    lessonSlug: lab.chapterSlug,
    userId: "verify",
    payload: { code, language: lab.language },
  });
  return {
    grade: gradeLabRun(lab.checks ?? [], {
      console: run.console,
      source: code,
      ranCleanly: run.passed,
    }),
    run,
  };
}

async function main() {
  const codeLabs = NOTE_LABS.filter((l) => l.kind === "code_run");
  let bad = 0;

  for (const lab of codeLabs) {
    const solution = SOLUTIONS[lab.chapterSlug];
    if (!solution) {
      console.log(`\n!! NO REFERENCE SOLUTION: ${lab.chapterSlug}`);
      bad++;
      continue;
    }

    const starter = await grade(lab, lab.starter ?? "");
    const solved = await grade(lab, solution.trim());

    const starterOk = !starter.grade.passed; // starter must NOT pass
    const solutionOk = solved.grade.passed; // solution MUST pass
    const verdict = starterOk && solutionOk ? "OK  " : "FAIL";
    if (!starterOk || !solutionOk) bad++;

    console.log(
      `${verdict} ${lab.chapterSlug}  [starter ${starter.grade.score}% ${starterOk ? "rejected" : "PASSED-BAD"}] [solution ${solved.grade.score}% ${solutionOk ? "passed" : "REJECTED-BAD"}]`,
    );
    if (!solutionOk) {
      console.log(`      output: ${JSON.stringify(solved.run.console.slice(0, 200))}`);
      for (const c of solved.grade.checks.filter((c) => !c.passed)) {
        console.log(`      MISS: ${c.label} :: ${c.detail ?? ""}`);
      }
    }
  }

  console.log(`\n${codeLabs.length} code labs checked, ${bad} problem(s).`);
  if (bad > 0) process.exitCode = 1;
}

main();
