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
  "sql-and-databases-for-testers/reading-data": `
import sqlite3

conn = sqlite3.connect(":memory:")
c = conn.cursor()
c.execute("CREATE TABLE users (id INTEGER, name TEXT)")
c.execute("CREATE TABLE orders (id INTEGER, user_id INTEGER, amount INTEGER)")
c.executemany("INSERT INTO users VALUES (?,?)", [(1, "amy"), (2, "ben"), (3, "cleo")])
c.executemany(
    "INSERT INTO orders VALUES (?,?,?)",
    [(1, 1, 50), (2, 1, 30), (3, 2, 20), (4, 3, 10), (5, 3, 15), (6, 3, 5)],
)

c.execute("""
    SELECT u.name, SUM(o.amount) as total
    FROM users u JOIN orders o ON u.id = o.user_id
    GROUP BY u.name
    HAVING COUNT(o.id) > 1
    ORDER BY total DESC
""")
for name, total in c.fetchall():
    print(f"{name}: {total}")
`,
  "sql-and-databases-for-testers/verifying-the-app-against-the-db": `
ui_totals = {"order_1": 100, "order_2": 50, "order_3": 75}
db_totals = {"order_1": 100, "order_2": 55, "order_3": 75}
for k in sorted(ui_totals):
    if ui_totals[k] != db_totals[k]:
        print(f"{k}: ui={ui_totals[k]} db={db_totals[k]}")
`,
  "relational-databases-engineer-level/sql-mastery": `
import sqlite3

conn = sqlite3.connect(":memory:")
c = conn.cursor()
c.execute("CREATE TABLE sales (id INTEGER, name TEXT, category TEXT, amount INTEGER)")
c.executemany(
    "INSERT INTO sales VALUES (?,?,?,?)",
    [
        (1, "widget-a", "tools", 100),
        (2, "widget-b", "tools", 150),
        (3, "widget-c", "tools", 90),
        (4, "gadget-x", "electronics", 200),
        (5, "gadget-y", "electronics", 180),
    ],
)
c.execute("""
    WITH ranked AS (
      SELECT category, name, amount,
             ROW_NUMBER() OVER (PARTITION BY category ORDER BY amount DESC) as rn
      FROM sales
    )
    SELECT category, name, amount FROM ranked WHERE rn = 1 ORDER BY category
""")
for category, name, amount in c.fetchall():
    print(f"{category}: {name} ({amount})")
`,
  "relational-databases-engineer-level/schema-design": `
rows = [
    {"customer_id": 1, "email": "amy@x.com"},
    {"customer_id": 1, "email": "amy@x.com"},
    {"customer_id": 2, "email": "ben@x.com"},
    {"customer_id": 2, "email": "ben.new@x.com"},
    {"customer_id": 3, "email": "cleo@x.com"},
]
emails_by_id = {}
for row in rows:
    emails_by_id.setdefault(row["customer_id"], set()).add(row["email"])
for cid in sorted(cid for cid, emails in emails_by_id.items() if len(emails) > 1):
    print(cid)
`,
  "relational-databases-engineer-level/indexes-and-performance": `
plan_lines = [
    "SEARCH orders USING INDEX idx_user_id (user_id=?)",
    "SCAN products",
    "SEARCH users USING INTEGER PRIMARY KEY (rowid=?)",
    "SCAN order_items",
]
for line in plan_lines:
    if line.startswith("SCAN"):
        print(line.split(" ", 1)[1])
`,
  "relational-databases-engineer-level/transactions-and-concurrency": `
balance = 100
a_read = balance
b_read = balance
a_write = a_read - 30
b_write = b_read - 20
naive_result = b_write
correct_result = balance - 30 - 20
print(f"naive result: {naive_result}")
print(f"correct result: {correct_result}")
`,
  "nosql-and-modern-data/redis-and-caching-bugs": `
cache = [
    {"key": "user:1", "cached_at": 0, "ttl": 60},
    {"key": "user:2", "cached_at": 0, "ttl": 30},
    {"key": "user:3", "cached_at": 50, "ttl": 60},
]
now = 90
for key in sorted(e["key"] for e in cache if now - e["cached_at"] >= e["ttl"]):
    print(key)
`,
  "automation-foundations/the-automation-pyramid": `
tests = [
    ("t1", "unit"), ("t2", "unit"), ("t3", "unit"),
    ("t4", "integration"),
    ("t5", "e2e"), ("t6", "e2e"), ("t7", "e2e"), ("t8", "e2e"),
]
counts = {"unit": 0, "integration": 0, "e2e": 0}
for _, level in tests:
    counts[level] += 1
print(f"unit: {counts['unit']}")
print(f"integration: {counts['integration']}")
print(f"e2e: {counts['e2e']}")
print(f"ice-cream-cone: {counts['e2e'] > counts['unit']}")
`,
  "automation-foundations/pitfalls": `
history = {
    "test_login": ["pass", "pass", "pass"],
    "test_checkout": ["pass", "fail", "pass"],
    "test_search": ["fail", "fail", "fail"],
    "test_cart": ["pass", "fail", "fail", "pass"],
}
for name in sorted(name for name, runs in history.items() if set(runs) == {"pass", "fail"}):
    print(name)
`,
  "test-frameworks/data-driven-testing": `
rows = [
    ("amy", "longenough1"),
    ("ben", "short"),
    ("cleo", ""),
    ("drew", "alsolongpw12"),
]
for name, pw in rows:
    verdict = "PASS" if len(pw) >= 8 else "FAIL"
    print(f"{name}: {verdict}")
`,
  "framework-design/config-and-data": `
configs = {
    "dev": {"base_url": "https://dev.example.com"},
    "staging": {"base_url": "https://staging.example.com"},
}
default_url = "https://prod.example.com"
envs_to_check = ["staging", "prod"]
for env in envs_to_check:
    url = configs.get(env, {}).get("base_url", default_url)
    print(f"{env}: {url}")
`,
  "automation-in-cicd/github-actions": `
matrix = {"os": ["ubuntu", "windows"], "browser": ["chrome", "firefox", "webkit"]}
combos = [f"{o}/{b}" for o in matrix["os"] for b in matrix["browser"]]
print(f"{len(combos)} jobs")
for combo in combos:
    print(combo)
`,
  "automation-in-cicd/gitlab-ci-and-quality-gates": `
files = [
    ("auth.py", 120, 100),
    ("checkout.py", 80, 40),
    ("utils.py", 50, 45),
]
total = sum(t for _, t, _ in files)
covered = sum(cv for _, _, cv in files)
pct = round(covered / total * 100, 1)
verdict = "PASS" if pct >= 80 else "FAIL"
print(f"{pct}% {verdict}")
`,
  "api-testing-fundamentals/status-codes-and-rest": `
codes = [200, 201, 301, 404, 401, 500, 503, 204]
from collections import Counter
fam = Counter(f"{c // 100}xx" for c in codes)
for k in ["2xx", "3xx", "4xx", "5xx"]:
    print(f"{k}: {fam.get(k, 0)}")
`,
  "api-test-automation/contract-and-schema-testing": `
responses = [
    {"id": 1, "name": "amy", "email": "amy@x.com"},
    {"id": 2, "name": "ben"},
    {"id": 3, "name": "cleo", "email": "cleo@x.com"},
    {"id": 4, "email": "drew@x.com"},
]
required = {"id", "name", "email"}
for r in responses:
    if not required.issubset(r.keys()):
        print(r["id"])
`,
  "docker-and-containers-for-testers/dockerfiles-and-compose": `
dockerfile_lines = [
    "FROM python:3.12",
    "COPY requirements.txt .",
    "RUN pip install -r requirements.txt",
    "COPY . .",
    'CMD ["python", "app.py"]',
]
changed_index = 3
for line in dockerfile_lines[changed_index:]:
    print(line)
`,
  "kubernetes-and-test-infrastructure/test-workloads-on-k8s": `
attempts = ["fail", "fail", "pass", "fail"]
backoff_limit = 1
max_attempts = backoff_limit + 1
window = attempts[:max_attempts]
if "pass" in window:
    print(f"Job SUCCEEDED after {window.index('pass') + 1} attempts")
else:
    print(f"Job FAILED after {max_attempts} attempts")
`,
  "system-design-for-testers/scaling-building-blocks": `
servers = ["web-1", "web-2", "web-3"]
num_requests = 7
for n in range(1, num_requests + 1):
    server = servers[(n - 1) % len(servers)]
    print(f"request {n} -> {server}")
`,
  "agile-and-devops-for-testers/tester-in-a-sprint": `
dod_criteria = ["code reviewed", "unit tests passing", "docs updated", "QA signed off"]
story_criteria_met = {
    "code reviewed": True,
    "unit tests passing": True,
    "docs updated": False,
    "QA signed off": True,
}
missing = [c for c in dod_criteria if not story_criteria_met.get(c, False)]
if missing:
    print("NOT DONE")
    for m in missing:
        print(m)
else:
    print("DONE")
`,
  "non-functional-testing-intro/compatibility": `
required_matrix = [
    ("chrome", "windows"),
    ("chrome", "mac"),
    ("safari", "mac"),
    ("firefox", "linux"),
]
tested_matrix = {("chrome", "windows"), ("safari", "mac")}
for combo in required_matrix:
    if combo not in tested_matrix:
        print(f"{combo[0]}/{combo[1]}")
`,
  "performance-testing/metrics": `
import math

response_times = [220, 195, 310, 180, 240, 205, 260, 190, 275, 230,
                   215, 250, 265, 200, 235, 210, 290, 1800, 225, 245]
srt = sorted(response_times)
rank = math.ceil(0.95 * len(srt))
print(srt[rank - 1])
`,
  "accessibility-testing/automated-a11y-audits": `
images = [
    {"src": "logo.png", "alt": "Company logo"},
    {"src": "banner.jpg", "alt": ""},
    {"src": "icon1.png", "alt": "icon1.png"},
    {"src": "hero.jpg", "alt": "Team celebrating product launch"},
]
for img in sorted(images, key=lambda i: i["src"]):
    if not img["alt"] or img["alt"] == img["src"]:
        print(img["src"])
`,
  "mobile-testing/device-and-os-matrix": `
breakpoints = [
    (0, 599, "mobile"),
    (600, 1023, "tablet"),
    (1024, 10000, "desktop"),
]
widths_to_check = [375, 768, 1440, 600, 1023]
for w in widths_to_check:
    for lo, hi, name in breakpoints:
        if lo <= w <= hi:
            print(f"{w}: {name}")
            break
`,
  "test-management-and-reporting/metrics-and-reporting": `
runs = [
    {"run": 1, "passed": 80, "total": 100},
    {"run": 2, "passed": 78, "total": 100},
    {"run": 3, "passed": 92, "total": 100},
]
prev_rate = None
for r in runs:
    rate = r["passed"] / r["total"] * 100
    if prev_rate is not None and rate < prev_rate:
        print(f"run {r['run']}: {prev_rate}% -> {rate}% (regression)")
    prev_rate = rate
`,
  "ai-and-the-modern-tester/ai-powered-test-automation": `
existing_tests = {
    "test_login_valid_password",
    "test_login_empty_username",
    "test_checkout_flow",
}
ai_suggestions = [
    "test_login_valid_password",
    "Test Login Valid Password",
    "test_search_results",
    "test_checkout_flow",
]

def normalize(s):
    return s.lower().replace(" ", "_")

redundant = [s for s in ai_suggestions if normalize(s) in existing_tests]
new_ones = [s for s in ai_suggestions if normalize(s) not in existing_tests]
for s in redundant:
    print(s)
print(f"{len(new_ones)} new suggestion: {', '.join(new_ones)}")
`,
  "interviews/technical-rounds": `
log = ["run-1", "run-2", "run-3", "run-2", "run-4", "run-1"]
seen = set()
for entry in log:
    if entry in seen:
        print(entry)
        break
    seen.add(entry)
`,
  "a-portfolio-that-gets-interviews/the-3-repo-portfolio": `
required_sections = ["Overview", "Setup", "Test Strategy", "Results", "Lessons Learned"]
readme_headings = ["Overview", "Setup", "Results"]
for section in required_sections:
    if section not in readme_headings:
        print(section)
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
