# Finish Remaining Curriculum Modules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the 15 unfinished approved-map modules (220 new notes) with one fresh Codex implementer per module, isolated Git state, chapter commits, independent review, and the existing rich-note verification bar.

**Architecture:** Root first appends planned taxonomy blocks for M37–M48 on the shared branch, establishing one collision-free base. Three module worktrees run concurrently; each fresh implementer owns exactly one module and commits one chapter per Loop cycle. Root creates review packages, dispatches read-only reviewers, returns Critical/Important findings to the same implementer, records accepted module branches, and rolls the freed slot to the next queued module.

**Tech Stack:** MDX, TypeScript taxonomy, Python 3, Java 21+, pnpm, Vitest, Turborepo, Wikimedia Commons, YouTube oEmbed, official primary documentation, Git worktrees.

## Global Constraints

- Authoritative scope is `Curriculum/generator-master-map.py`: 48 modules, 33 complete, 15 unfinished.
- M24 has 12 notes remaining, M25 has 8, M26 has 12, and M37–M48 have 188; total new notes is exactly 220.
- One fresh Codex implementer owns one module. Claude1 and Claude2 are unavailable and have no retained write ownership.
- Maximum concurrency is three module workers plus root. A slot rolls only after module review has no open Critical or Important finding.
- Root alone records claims, creates worktrees, controls the rolling queue, reviews taxonomy scope, updates durable state, and decides whether to request integration approval.
- Module implementers may edit only their exact module content root, media root, their module taxonomy block, and their `.superpowers/sdd/` report.
- Each chapter is one Loop cycle and one local commit. Implementers may continue through all chapters of their one module, but may not claim another module.
- Every new note uses valid frontmatter, three resolvable related links, Hook, distinct analogy, `<Term define=...>`, explanation, tip, mistake, one inspected/licensed HotspotImage, one FlowAnimation, exactly one Python and one Java CodePlayground, FirstTime/StepChecklist, WhenItBreaks, WhereToCheck, WorkedExample, Quiz, Flashcards, Challenge, AskCommunity, Resources, exact-title embeddable Video, Takeaways, and `<Complete xp={10} />`.
- Playground code uses standard libraries only, contains failure-sensitive assertions and predicate-derived result labels, executes from final MDX, and has Python/Java semantic output parity. Each note needs at least one mutation that the oracle rejects.
- Technical claims use current primary sources. Security work is limited to explicitly authorized local/test/training targets, synthetic data, minimal proof, and written authorization boundaries.
- Legal, accessibility, privacy, AI, employment, salary, certification, and career claims are contextual guidance, not guarantees or professional advice, and require current authoritative or clearly dated sources.
- Every image is viewed after download; every hotspot hits a visible object; every credit contains creator, license, and exact source URL. Every video is live, embeddable, exact-title, exact-channel, and duration-checked.
- Agents never share a worktree or Git index. Broad `git add`, push, merge, publish, deploy, and destructive cleanup are forbidden.
- Existing unrelated `demo.txt`, `implementation_plan.md`, `task.md`, Python cache, legacy modules, generated vault output, and other worktrees remain untouched.
- Completed branches remain local and unmerged until Sajan explicitly approves integration.

## Common Chapter Verification

Every module task uses this exact cycle for each chapter:

1. Claim the exact chapter in `Claude Coordination.md` through root; agent does not edit coordination.
2. Research current primary sources, one distinct licensed image and one distinct embeddable video per topic before prose.
3. Author all four topic MDX files and matching JPG files, then flip only those four taxonomy leaves.
4. Extract both final playground literals per topic, execute Python with `python3`, compile/run Java with `javac` and `java`, compare semantic output, and run a defect-accepting mutation that must exit nonzero.
5. Run:

```bash
node packages/curriculum/scripts/check-note-links.mjs
node packages/curriculum/scripts/check-note-mdx-compile.mjs
(cd packages/curriculum && python3 scripts/check-note-components.py)
(cd packages/curriculum && python3 scripts/check-note-images.py)
pnpm --filter @qa-mastery/curriculum test
git diff --check
```

6. Stage only four MDX, four JPG, and the isolated four-leaf taxonomy hunk. Confirm exactly nine staged files, then commit `feat(curriculum): add <module> <chapter>`.
7. Append exact commands, outputs, media/source evidence, mutations, file list, commit, and self-review to the module report.

At module end run `pnpm test`, `pnpm typecheck`, `pnpm --filter @qa-mastery/curriculum sync`, full MDX/component/image gates, related-link scan, placeholder/conflict-marker scan, and `git diff --check`. Expected: all exit 0, zero planned leaves in that module, clean worktree.

---

### Task 1: Scaffold M37–M48 Taxonomy and Correct Inventory

**Files:**
- Modify: `packages/curriculum/src/notes/taxonomy.ts`
- Modify: `/Users/sajanathapa/Desktop/1/My Qa Projecct/Loop/STATE.md`

**Interfaces:**
- Consumes: M37–M48 definitions from `Curriculum/generator-master-map.py`.
- Produces: twelve append-only module blocks, 188 `planned: true` leaves, and a common base for all unstarted module worktrees.

- [ ] Append M37–M48 in approved-map order using exact module/chapter/topic slugs locked in Tasks 6–17.
- [ ] Confirm no canonical slug collides with legacy `performance`, `security`, `mobile`, or `cicd`; do not delete or rewrite legacy blocks.
- [ ] Run curriculum tests. Expected: 9/9 because every new leaf is planned and has no file.
- [ ] Run typecheck and `git diff --check`. Expected: 12/12 typechecks and no whitespace errors.
- [ ] Change durable inventory from stale `32/48` to evidence-backed `33/48`; do not change module completion claims.
- [ ] Stage only taxonomy and commit `feat(curriculum): scaffold remaining map modules`. Update STATE outside that repository commit.

### Task 2: Create Durable Ledger and First Three Isolated Worktrees

**Files:**
- Create: `.superpowers/sdd/progress.md` (git-ignored recovery ledger)
- Create: `.superpowers/sdd/module-24-report.md`
- Create: `.superpowers/sdd/module-25-report.md`
- Use existing: `.worktrees/selenium-webdriver-ch1`

**Interfaces:**
- Consumes: Task 1 scaffold commit and retained M26 commit `4d34d20`.
- Produces: three non-overlapping workspaces and exact active claims.

- [ ] Record all 15 tasks as queued and Task 1 complete in `.superpowers/sdd/progress.md`.
- [ ] Create `.worktrees/non-functional-testing-intro` on `codex/non-functional-testing-intro` from Task 1 HEAD.
- [ ] Create `.worktrees/automation-foundations` on `codex/automation-foundations` from Task 1 HEAD.
- [ ] Verify `.worktrees/selenium-webdriver-ch1` is on `codex/selenium-webdriver-ch1` at or after `4d34d20`.
- [ ] Run `pnpm install --frozen-lockfile` where dependencies are absent, then baseline `pnpm test` in each worktree. Expected: all tracked tests green.
- [ ] Append exact M24, M25 and M26 claims to coordination and STATE; no later module is claimed yet.

### Task 3: Finish M24 Non-functional Testing Intro

**Files:**
- Create under: `packages/curriculum/content/notes/non-functional-testing-intro/`
- Create under: `apps/platform/public/notes/non-functional-testing-intro/`
- Modify only M24 block: `packages/curriculum/src/notes/taxonomy.ts`
- Report: `.superpowers/sdd/module-24-report.md`

**Interfaces:** Produces 12 MDX/JPG pairs and M24 20/20.

- [ ] `usability-and-accessibility`: `usability-testing`, `ux-heuristics`, `accessibility-wcag`, `assistive-tech`.
- [ ] `compatibility`: `cross-browser`, `cross-device`, `os-and-versions`, `responsive-checks`.
- [ ] `localization-and-i18n`: `i18n-vs-l10n-in-plain-words`, `text-expansion-truncation-and-rtl`, `dates-currencies-and-formats`, `pseudo-localization-tricks`.
- [ ] Use W3C/WAI, WCAG 2.2, browser/platform vendor, Unicode CLDR, and W3C Internationalization primary sources; avoid legal guarantees.
- [ ] Complete each chapter with Common Chapter Verification, then full module gates and report `DONE` only with three chapter commits and clean review-ready state.

### Task 4: Finish M25 Automation Foundations

**Files:** content/media roots `automation-foundations/`; only M25 taxonomy block; report `.superpowers/sdd/module-25-report.md`.

**Interfaces:** Produces 8 MDX/JPG pairs and M25 16/16.

- [ ] `the-tool-landscape`: `selenium`, `playwright-tool`, `cypress`, `choosing-a-tool`.
- [ ] `pitfalls`: `flaky-tests`, `maintenance-cost`, `over-automation`, `false-confidence`.
- [ ] Use official Selenium, Playwright, and Cypress documentation plus current vendor support matrices; comparisons must be dated and workload-specific.
- [ ] Complete each chapter with Common Chapter Verification, then full module gates and report two chapter commits.

### Task 5: Finish M26 Selenium WebDriver

**Files:** content/media roots `selenium-webdriver/`; only M26 taxonomy block; report `.superpowers/sdd/module-26-report.md`.

**Interfaces:** Consumes chapter-1 commit `4d34d20`; produces 12 MDX/JPG pairs and M26 16/16.

- [ ] `locators`: `id-name-css-xpath`, `locator-strategy`, `relative-locators`, `robust-selectors`.
- [ ] `waits-and-sync`: `implicit-vs-explicit`, `fluent-waits`, `avoiding-sleeps`, `handling-async`.
- [ ] `actions-and-navigation`: `clicks-and-input`, `dropdowns-and-alerts`, `frames-and-windows`, `actions-api`.
- [ ] Use current Selenium WebDriver docs and Java/Python API docs. Real Selenium snippets stay fenced; runnable playgrounds remain dependency-free deterministic models.
- [ ] Complete each chapter with Common Chapter Verification, then full module gates and report three new chapter commits after `4d34d20`.

### Task 6: Build M37 Performance Testing

**Files:** roots `performance-testing/`; only `performance-testing` taxonomy block; report `.superpowers/sdd/module-37-report.md`.

**Interfaces:** Produces 12 MDX/JPG pairs and M37 12/12.

- [ ] `load-vs-stress-vs-soak`: `types-of-perf-testing`, `goals`, `recovery`, `scalability`.
- [ ] `metrics`: `latency-and-throughput`, `percentiles-vs-averages`, `error-rate`, `resource-use`.
- [ ] `tools-intro`: `jmeter`, `k6`, `designing-a-test`, `reading-results`.
- [ ] Use Apache JMeter, Grafana k6, OpenTelemetry, and web.dev primary sources; distinguish measurement from causal diagnosis.
- [ ] Run three chapter cycles, full module gates, and report three commits.

### Task 7: Build M38 Security Testing — Web

**Files:** roots `security-testing-web/`; only `security-testing-web` taxonomy block; report `.superpowers/sdd/module-38-report.md`.

**Interfaces:** Produces 20 MDX/JPG pairs and M38 20/20.

- [ ] `owasp-top-10-properly`: `the-2021-list-and-how-to-use-it`, `broken-access-control`, `cryptographic-and-config-failures`, `mapping-findings-to-the-list`.
- [ ] `injection-and-client-side`: `sql-injection-by-hand`, `xss-reflected-stored-dom`, `command-and-template-injection`, `csrf-and-clickjacking`.
- [ ] `authentication-testing`: `auth-vs-authorization-distinct-skills`, `session-and-cookie-attacks`, `password-and-reset-flows`, `mfa-bypass-patterns`.
- [ ] `authorization-and-access`: `idor-bola-by-hand`, `privilege-escalation`, `forced-browsing`, `function-level-checks-bfla`.
- [ ] `tools-and-reporting`: `burp-suite-basics`, `owasp-zap`, `writing-a-security-finding-devs-act-on`, `responsible-disclosure`.
- [ ] Use OWASP, PortSwigger Web Security Academy, CWE, NIST, and MDN. Every active probe is authorization-bounded and uses training/local targets.
- [ ] Run five chapter cycles, full module gates, and report five commits.

### Task 8: Build M39 API and Modern Security

**Files:** roots `api-and-modern-security/`; only its taxonomy block; report `.superpowers/sdd/module-39-report.md`.

**Interfaces:** Produces 20 MDX/JPG pairs and M39 20/20.

- [ ] `owasp-api-security-top-10-2023`: `bola-and-bfla`, `broken-auth-for-apis`, `unrestricted-resource-consumption`, `the-full-api-list`.
- [ ] `rest-api-attacks`: `mass-assignment`, `ssrf`, `rate-limit-and-abuse-testing`, `excessive-data-exposure`.
- [ ] `jwt-and-token-attacks`: `alg-none-and-weak-secrets`, `expiry-and-replay`, `scope-and-audience-abuse`, `key-confusion`.
- [ ] `graphql-security`: `introspection-leakage`, `query-depth-and-complexity-dos`, `batching-and-alias-abuse`, `field-level-auth-and-mutation-mass-assignment`.
- [ ] `auditing-buggyapi`: `threat-modeling-an-api`, `a-repeatable-audit-checklist`, `chaining-findings`, `the-write-up-like-a-real-report`.
- [ ] Use OWASP API Top 10 2023, IETF RFCs, GraphQL specification, CWE, and NIST; use only authorized BuggyAPI/local models.
- [ ] Run five chapter cycles, full module gates, and report five commits.

### Task 9: Build M40 Accessibility Testing

**Files:** roots `accessibility-testing/`; only its taxonomy block; report `.superpowers/sdd/module-40-report.md`.

**Interfaces:** Produces 16 MDX/JPG pairs and M40 16/16.

- [ ] `why-accessibility-matters`: `disabilities-and-assistive-tech`, `the-business-and-legal-case-ada-eaa`, `wcag-2-2-a-aa-aaa`, `pour-principles`.
- [ ] `manual-a11y-testing`: `keyboard-only-navigation`, `screen-readers-nvda-voiceover`, `focus-order-and-visible-focus`, `contrast-and-zoom-reflow`.
- [ ] `automated-a11y-audits`: `axe-devtools-and-lighthouse`, `wave`, `what-automation-catches-vs-misses`, `ci-a11y-checks`.
- [ ] `reporting-and-fixing`: `writing-a11y-findings-devs-act-on`, `aria-help-and-harm`, `semantic-html-first`, `re-testing-a-fix`.
- [ ] Use W3C/WAI WCAG 2.2 and ARIA, ADA.gov, EUR-Lex EAA, NV Access, Apple, Deque and WebAIM primary documentation; legal content is scoped guidance.
- [ ] Run four chapter cycles, full module gates, and report four commits.

### Task 10: Build M41 Mobile Testing

**Files:** roots `mobile-testing/`; only its taxonomy block; report `.superpowers/sdd/module-41-report.md`.

**Interfaces:** Produces 16 MDX/JPG pairs and M41 16/16.

- [ ] `device-and-os-matrix`: `fragmentation`, `building-a-matrix`, `real-vs-emulated`, `device-farms`.
- [ ] `gestures-interrupts-networks`: `touch-gestures`, `interrupts`, `network-conditions`, `orientation`.
- [ ] `appium-intro`: `what-appium-is`, `setup`, `first-mobile-test`, `mobile-locators`.
- [ ] `mobile-specifics`: `permissions`, `battery-and-performance`, `app-lifecycle`, `store-testing`.
- [ ] Use Appium, Android Developers, Apple Developer, Google Play, and Apple App Store Review primary sources; date device-farm and store-policy claims.
- [ ] Run four chapter cycles, full module gates, and report four commits.

### Task 11: Build M42 Agile and DevOps for Testers

**Files:** roots `agile-and-devops-for-testers/`; only its taxonomy block; report `.superpowers/sdd/module-42-report.md`.

**Interfaces:** Produces 12 MDX/JPG pairs and M42 12/12.

- [ ] `scrum-and-kanban`: `scrum-roles-and-ceremonies`, `kanban`, `backlog-and-stories`, `estimation`.
- [ ] `tester-in-a-sprint`: `definition-of-done`, `in-sprint-testing`, `acceptance-criteria`, `collaboration`.
- [ ] `shift-left-and-cicd`: `shift-left`, `the-cicd-pipeline`, `quality-gates`, `continuous-testing`.
- [ ] Use Scrum Guide, Kanban Guide, Agile Manifesto, DORA, GitHub, GitLab and Jenkins primary sources; distinguish frameworks from team-specific practice.
- [ ] Run three chapter cycles, full module gates, and report three commits.

### Task 12: Build M43 Test Management and Reporting

**Files:** roots `test-management-and-reporting/`; only its taxonomy block; report `.superpowers/sdd/module-43-report.md`.

**Interfaces:** Produces 20 MDX/JPG pairs and M43 20/20.

- [ ] `test-management-tools`: `jira-and-boards-deeper`, `testrail-xray-zephyr`, `organizing-suites-and-runs`, `linking-bugs-to-cases`.
- [ ] `metrics-and-reporting`: `test-summary-reports`, `coverage-and-pass-rate-metrics`, `dashboards`, `reporting-to-stakeholders`.
- [ ] `docs-and-communication`: `confluence-and-wikis`, `writing-for-developers`, `status-updates`, `async-communication`.
- [ ] `environments-and-test-data`: `dev-qa-staging-prod`, `environment-parity-and-config`, `test-data-management-and-anonymization`, `gdpr-and-sensitive-data-in-tests`.
- [ ] `risk-and-estimation`: `risk-based-testing`, `prioritizing-what-to-test-first`, `test-estimation-techniques`, `saying-no-with-data`.
- [ ] Use current official Jira, TestRail, Xray, Zephyr, EU/EDPB and ISO-context sources; metrics remain contextual and GDPR content is not legal advice.
- [ ] Run five chapter cycles, full module gates, and report five commits.

### Task 13: Build M44 AI and the Modern Tester

**Files:** roots `ai-and-the-modern-tester/`; only its taxonomy block; report `.superpowers/sdd/module-44-report.md`.

**Interfaces:** Produces 16 MDX/JPG pairs and M44 16/16.

- [ ] `ai-as-your-testing-copilot`: `llms-for-test-ideas-and-cases`, `prompting-for-qa-work`, `generating-test-data-with-ai`, `reviewing-ai-output-critically`.
- [ ] `ai-powered-test-automation`: `self-healing-tests`, `ai-test-generation-tools`, `autonomous-testing-agents`, `when-ai-automation-lies`.
- [ ] `testing-ai-systems`: `why-ai-apps-break-differently`, `evaluating-llm-outputs`, `hallucinations-bias-and-safety`, `regression-for-prompts-and-models`.
- [ ] `staying-employable-in-the-ai-era`: `what-ai-wont-replace`, `the-testers-judgment-premium`, `learning-loop-for-new-tools`, `ai-on-your-resume-honestly`.
- [ ] Use official model/tool docs, model cards, NIST AI RMF, standards and primary evaluation-library docs. Date capabilities; label workforce forecasts as guidance, never fact.
- [ ] Run four chapter cycles, full module gates, and report four commits.

### Task 14: Build M45 Portfolio That Gets Interviews

**Files:** roots `a-portfolio-that-gets-interviews/`; only its taxonomy block; report `.superpowers/sdd/module-45-report.md`.

**Interfaces:** Produces 12 MDX/JPG pairs and M45 12/12.

- [ ] `the-3-repo-portfolio`: `repo-1-documented-manual-project`, `repo-2-ui-automation-suite`, `repo-3-api-suite-and-ci`, `readmes-that-sell`.
- [ ] `show-your-work`: `packaging-buggyshop-and-buggyapi-work`, `architecture-diagrams`, `demo-gifs-and-reports`, `what-recruiters-actually-open`.
- [ ] `profiles`: `github-profile-polish`, `linkedin-for-qa`, `personal-brand-basics`, `posting-your-progress`.
- [ ] Use current GitHub/LinkedIn documentation and dated hiring evidence. Present the three-repo structure as recommendation, never an interview guarantee.
- [ ] Run three chapter cycles, full module gates, and report three commits.

### Task 15: Build M46 Résumé and Applications

**Files:** roots `resume-and-applications/`; only its taxonomy block; report `.superpowers/sdd/module-46-report.md`.

**Interfaces:** Produces 12 MDX/JPG pairs and M46 12/12.

- [ ] `the-qa-resume`: `structure-that-works`, `skills-and-keywords-ats`, `numbers-and-impact`, `common-mistakes`.
- [ ] `applying-smart`: `reading-job-posts`, `tailoring-per-role`, `cover-letters-short`, `tracking-applications`.
- [ ] `certifications-honestly`: `istqb-worth-it-or-not`, `when-certs-matter`, `free-alternatives`, `learning-in-public`.
- [ ] Use current platform/vendor and ISTQB sources plus dated labor evidence. ATS and certification value vary by employer and geography; promise no outcomes.
- [ ] Run three chapter cycles, full module gates, and report three commits.

### Task 16: Build M47 Interviews

**Files:** roots `interviews/`; only its taxonomy block; report `.superpowers/sdd/module-47-report.md`.

**Interfaces:** Produces 16 MDX/JPG pairs and M47 16/16.

- [ ] `manual-qa-questions`: `classic-questions-and-answers`, `test-design-exercises`, `test-this-pen-scenarios`, `talking-through-bugs`.
- [ ] `technical-rounds`: `automation-and-coding-questions`, `sql-questions`, `api-questions`, `take-home-assignments`.
- [ ] `behavioral-and-scenarios`: `star-stories`, `conflict-and-priority-scenarios`, `questions-to-ask-them`, `salary-conversations`.
- [ ] `mock-practice`: `mock-interview-drills`, `recording-yourself`, `feedback-loops`, `handling-rejection`.
- [ ] Use dated hiring evidence and jurisdiction-safe recording/salary guidance. Model reasoning, not one universal answer or interview format.
- [ ] Run four chapter cycles, full module gates, and report four commits.

### Task 17: Build M48 Your First 90 Days

**Files:** roots `your-first-90-days/`; only its taxonomy block; report `.superpowers/sdd/module-48-report.md`.

**Interfaces:** Produces 16 MDX/JPG pairs and M48 16/16.

- [ ] `landing-well`: `onboarding-as-a-qa`, `learning-the-product-fast`, `your-first-bug-report-at-work`, `building-trust`.
- [ ] `working-solo-the-mentor-gap`: `being-the-only-qa`, `asking-good-questions`, `using-the-community`, `when-to-escalate`.
- [ ] `growing-from-here`: `junior-to-mid-roadmap`, `specializing`, `keeping-a-brag-doc`, `continued-learning`.
- [ ] `domains-and-specializations`: `payments-and-fintech-testing`, `erp-crm-and-enterprise`, `games-iot-and-embedded`, `picking-a-niche-deliberately`.
- [ ] Use current workplace/privacy and regulated-domain primary sources. Community guidance never overrides authorization, confidentiality or workplace escalation policy; career timing is not guaranteed.
- [ ] Run four chapter cycles, full module gates, and report four commits.

### Task 18: Review, Record, and Prepare Human-Gated Integration

**Files:**
- Update: `.superpowers/sdd/progress.md`
- Update: `/Users/sajanathapa/Desktop/1/My Qa Projecct/Loop/STATE.md`
- Append: `/Users/sajanathapa/Desktop/1/My Qa Projecct/Claude Coordination.md`

**Interfaces:** Consumes all 15 accepted module branch ranges; produces exact completion ledger and integration request without merging.

- [ ] For each module, generate a review package from its base to head and dispatch a fresh read-only spec/quality reviewer.
- [ ] Send all Critical/Important findings to the same module implementer; require focused verification and clean re-review before acceptance.
- [ ] Confirm every accepted branch is clean, has expected chapter commits, zero planned leaves for its module, expected MDX/JPG counts, and complete report evidence.
- [ ] Update progress ledger after each accepted module; update STATE and append coordination completion without claiming another module prematurely.
- [ ] After all 15 branches are accepted, report branch/commit inventory and request explicit Sajan approval before any merge, push, generated-vault sync, or final combined 48/48 verification.
