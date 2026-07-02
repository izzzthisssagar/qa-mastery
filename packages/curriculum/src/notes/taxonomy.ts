/**
 * The Notes wiki taxonomy — a reference encyclopedia separate from the lesson
 * curriculum. This is the single source of truth for the module → chapter →
 * topic tree across every QA domain. A topic with `planned: true` is a stub the
 * tree shows but no MDX file backs yet; the notes test asserts every leaf is
 * either backed by a file OR marked planned, so content fills in incrementally
 * and CI never breaks on a gap.
 *
 * Slugs are kebab-case and stable — the URL is /notes/<module>/<chapter>/<topic>.
 */

export interface NoteTopic {
  slug: string;
  title: string;
  /** Stub with no MDX yet — rendered greyed-out, excluded from the search index. */
  planned?: boolean;
}

export interface NoteChapter {
  slug: string;
  title: string;
  topics: NoteTopic[];
}

export interface NoteModule {
  slug: string;
  title: string;
  summary: string;
  chapters: NoteChapter[];
}

export const NOTES_TAXONOMY: readonly NoteModule[] = [
  {
    slug: "foundations",
    title: "QA Foundations",
    summary: "The vocabulary and mental models every tester needs.",
    chapters: [
      {
        slug: "principles",
        title: "Testing principles",
        topics: [
          { slug: "what-is-qa", title: "What is QA?" },
          { slug: "seven-principles", title: "The seven testing principles" },
          { slug: "verification-vs-validation", title: "Verification vs validation", planned: true },
          { slug: "sdlc-and-stlc", title: "SDLC & STLC", planned: true },
        ],
      },
      {
        slug: "test-design",
        title: "Test design techniques",
        topics: [
          { slug: "equivalence-partitioning", title: "Equivalence partitioning" },
          { slug: "boundary-value-analysis", title: "Boundary value analysis", planned: true },
          { slug: "decision-tables", title: "Decision tables", planned: true },
          { slug: "state-transition", title: "State transition testing", planned: true },
        ],
      },
    ],
  },
  {
    slug: "manual",
    title: "Manual Testing",
    summary: "Exploratory testing, test cases, and defect reporting done well.",
    chapters: [
      {
        slug: "artifacts",
        title: "Test artifacts",
        topics: [
          { slug: "writing-test-cases", title: "Writing great test cases" },
          { slug: "bug-reports", title: "Anatomy of a bug report" },
          { slug: "test-plans", title: "Test plans & strategy", planned: true },
        ],
      },
      {
        slug: "exploratory",
        title: "Exploratory testing",
        topics: [
          { slug: "session-based", title: "Session-based test management", planned: true },
          { slug: "heuristics", title: "Testing heuristics & tours", planned: true },
        ],
      },
    ],
  },
  {
    slug: "automation",
    title: "Test Automation",
    summary: "Selenium, Playwright, frameworks, and the automation pyramid.",
    chapters: [
      {
        slug: "fundamentals",
        title: "Automation fundamentals",
        topics: [
          { slug: "automation-pyramid", title: "The test automation pyramid" },
          { slug: "locators", title: "Locators & selectors", planned: true },
          { slug: "page-object-model", title: "The Page Object Model", planned: true },
          { slug: "waits-and-sync", title: "Waits & synchronization", planned: true },
        ],
      },
      {
        slug: "frameworks",
        title: "Frameworks & tooling",
        topics: [
          { slug: "selenium-java", title: "Selenium with Java", planned: true },
          { slug: "playwright", title: "Playwright", planned: true },
          { slug: "testng-junit", title: "TestNG & JUnit", planned: true },
        ],
      },
    ],
  },
  {
    slug: "api",
    title: "API Testing",
    summary: "HTTP, REST, contracts, auth, and the tools that exercise them.",
    chapters: [
      {
        slug: "http",
        title: "HTTP & REST",
        topics: [
          { slug: "http-fundamentals", title: "HTTP fundamentals" },
          { slug: "status-codes", title: "Status codes that matter", planned: true },
          { slug: "rest-principles", title: "REST principles", planned: true },
        ],
      },
      {
        slug: "practice",
        title: "Testing APIs in practice",
        topics: [
          { slug: "auth-schemes", title: "Auth schemes (key, Basic, Bearer, OAuth2)", planned: true },
          { slug: "contract-testing", title: "Contract testing", planned: true },
          { slug: "postman-and-curl", title: "Postman & curl", planned: true },
        ],
      },
    ],
  },
  {
    slug: "performance",
    title: "Performance Testing",
    summary: "Load, stress, and the metrics that reveal how systems behave under pressure.",
    chapters: [
      {
        slug: "concepts",
        title: "Concepts",
        topics: [
          { slug: "load-vs-stress", title: "Load vs stress vs soak", planned: true },
          { slug: "key-metrics", title: "Latency, throughput & percentiles", planned: true },
        ],
      },
    ],
  },
  {
    slug: "security",
    title: "Security Testing",
    summary: "The OWASP Top 10 and a tester's role in shipping secure software.",
    chapters: [
      {
        slug: "owasp",
        title: "OWASP essentials",
        topics: [
          { slug: "owasp-top-10", title: "The OWASP Top 10", planned: true },
          { slug: "injection", title: "Injection & XSS", planned: true },
          { slug: "auth-failures", title: "Broken authentication", planned: true },
        ],
      },
    ],
  },
  {
    slug: "database",
    title: "Database Testing",
    summary: "SQL for testers, data integrity, and validating the layer under the app.",
    chapters: [
      {
        slug: "sql",
        title: "SQL for testers",
        topics: [
          { slug: "select-basics", title: "SELECT, JOIN & aggregate basics", planned: true },
          { slug: "data-integrity", title: "Data-integrity checks", planned: true },
        ],
      },
    ],
  },
  {
    slug: "cicd",
    title: "CI/CD & DevOps",
    summary: "Where tests run in the pipeline and how quality gates are enforced.",
    chapters: [
      {
        slug: "pipelines",
        title: "Pipelines",
        topics: [
          { slug: "ci-basics", title: "CI basics & quality gates", planned: true },
          { slug: "test-in-pipeline", title: "Running tests in the pipeline", planned: true },
        ],
      },
    ],
  },
  {
    slug: "mobile",
    title: "Mobile Testing",
    summary: "The extra dimensions — devices, gestures, networks — mobile adds.",
    chapters: [
      {
        slug: "concepts",
        title: "Concepts",
        topics: [
          { slug: "device-matrix", title: "The device & OS matrix", planned: true },
          { slug: "mobile-specifics", title: "Gestures, interrupts & networks", planned: true },
        ],
      },
    ],
  },
] as const;

/** Flat list of every (module, chapter, topic) leaf with its URL parts. */
export interface NoteLeaf {
  moduleSlug: string;
  chapterSlug: string;
  topicSlug: string;
  title: string;
  planned: boolean;
}

export function allNoteLeaves(): NoteLeaf[] {
  const out: NoteLeaf[] = [];
  for (const m of NOTES_TAXONOMY) {
    for (const c of m.chapters) {
      for (const t of c.topics) {
        out.push({
          moduleSlug: m.slug,
          chapterSlug: c.slug,
          topicSlug: t.slug,
          title: t.title,
          planned: t.planned ?? false,
        });
      }
    }
  }
  return out;
}

export function findNoteModule(slug: string): NoteModule | undefined {
  return NOTES_TAXONOMY.find((m) => m.slug === slug);
}

export function findNoteLeaf(
  moduleSlug: string,
  chapterSlug: string,
  topicSlug: string,
): NoteLeaf | undefined {
  return allNoteLeaves().find(
    (l) => l.moduleSlug === moduleSlug && l.chapterSlug === chapterSlug && l.topicSlug === topicSlug,
  );
}
