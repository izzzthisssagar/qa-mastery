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
  "qa-foundations/the-seven-principles": `
counts = {"checkout": 12, "search": 5, "login": 2, "profile": 1}
total = sum(counts.values())
ranked = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)
running = 0
for name, count in ranked:
    running += count
    print(name)
    if running / total >= 0.8:
        break
`,
  "test-design-techniques/equivalence-partitioning": `
ages = [15, 18, 40, 65, 70, -5, 66]
valid = [a for a in ages if 18 <= a <= 65]
invalid = [a for a in ages if not (18 <= a <= 65)]
print("valid: " + ", ".join(str(a) for a in valid))
print("invalid: " + ", ".join(str(a) for a in invalid))
`,
  "test-design-techniques/boundary-value-analysis": `
min_val = 1
max_val = 10
values = [min_val - 1, min_val, min_val + 1, max_val - 1, max_val, max_val + 1]
print(", ".join(str(v) for v in values))
`,
  "test-design-techniques/decision-tables": `
rules = [
    (True, True, "20%"),
    (True, False, "10%"),
    (False, True, "10%"),
    (False, False, "0%"),
    (True, True, "20%"),
]
distinct = set(rules)
print(f"{len(distinct)} distinct rules")
`,
  "test-design-techniques/state-transition": `
valid_transitions = {
    "draft": ["submitted"],
    "submitted": ["approved", "rejected"],
    "approved": ["published"],
    "rejected": ["draft"],
    "published": [],
}
transitions_to_check = [
    ("draft", "submitted"),
    ("submitted", "published"),
    ("approved", "published"),
    ("published", "draft"),
]
for from_state, to_state in transitions_to_check:
    verdict = "VALID" if to_state in valid_transitions[from_state] else "INVALID"
    print(f"{from_state} -> {to_state}: {verdict}")
`,
  "test-artifacts/traceability": `
requirements = ["REQ-1", "REQ-2", "REQ-3", "REQ-4"]
case_requirement_links = ["REQ-1", "REQ-1", "REQ-3"]
for req in requirements:
    if req not in case_requirement_links:
        print(req)
`,
  "levels-and-types-of-testing/functional-and-regression": `
changed_files = {"checkout.py", "cart.py"}
test_coverage = {
    "test_login": {"login.py"},
    "test_checkout_flow": {"checkout.py", "payment.py"},
    "test_cart_totals": {"cart.py"},
    "test_search": {"search.py"},
}
impacted = sorted(name for name, files in test_coverage.items() if files & changed_files)
for name in impacted:
    print(name)
`,
  "levels-and-types-of-testing/smoke-and-sanity": `
tests = [
    {"name": "login", "tags": ["smoke", "auth"]},
    {"name": "checkout", "tags": ["regression"]},
    {"name": "search", "tags": ["smoke"]},
    {"name": "admin_panel", "tags": ["regression", "admin"]},
]
smoke = [t["name"] for t in tests if "smoke" in t["tags"]]
print(f"{len(smoke)} smoke tests")
for name in smoke:
    print(name)
`,
  "defect-management/severity-vs-priority": `
bugs = [(True, True), (True, False), (False, True)]
for blocks_release, affects_many in bugs:
    severity = "critical" if blocks_release else "minor"
    priority = "high" if affects_many else "low"
    print(f"{severity}/{priority}")
`,
  "defect-management/the-bug-life-cycle": `
bugs = [
    {"id": "BUG-1", "severity": "minor", "age_days": 10},
    {"id": "BUG-2", "severity": "critical", "age_days": 2},
    {"id": "BUG-3", "severity": "critical", "age_days": 8},
    {"id": "BUG-4", "severity": "major", "age_days": 5},
]
rank = {"critical": 0, "major": 1, "minor": 2}
ordered = sorted(bugs, key=lambda b: (rank[b["severity"]], -b["age_days"]))
for bug in ordered:
    print(bug["id"])
`,
  "ui-ux-design-qa/color-theory-for-testers": `
def srgb_to_linear(c):
    c = c / 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

def relative_luminance(hex_color):
    hex_color = hex_color.lstrip("#")
    r, g, b = (int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    return 0.2126 * srgb_to_linear(r) + 0.7152 * srgb_to_linear(g) + 0.0722 * srgb_to_linear(b)

def contrast_ratio(color_a, color_b):
    la, lb = relative_luminance(color_a), relative_luminance(color_b)
    lighter, darker = max(la, lb), min(la, lb)
    return (lighter + 0.05) / (darker + 0.05)

fg = "#595959"
bg = "#FFFFFF"
ratio = round(contrast_ratio(fg, bg), 2)
verdict = "PASS" if ratio >= 4.5 else "FAIL"
print(f"{ratio}:1 {verdict}")
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
