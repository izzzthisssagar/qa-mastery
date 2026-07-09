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
  // ── Track A · Computer & Digital Foundations — Module 1 (curriculum v4.1).
  // First module of the from-zero learning path; the full 48-module taxonomy
  // lands module by module as content is written (topic 1 is the approved
  // mentor-format reference note).
  {
    slug: "how-a-computer-works",
    title: "How a computer works",
    summary: "Absolute zero — the physical parts of a computer, what each one does, and how software comes alive on them.",
    chapters: [
      {
        slug: "the-parts-of-a-computer",
        title: "The parts of a computer",
        topics: [
          { slug: "tower-and-laptop-anatomy", title: "Tower & laptop anatomy" },
          { slug: "monitor-keyboard-mouse", title: "Monitor, keyboard, mouse" },
          { slug: "ports-and-cables", title: "Ports & cables" },
          { slug: "turning-it-on-safely", title: "Turning it on safely" },
        ],
      },
      {
        slug: "cpu-memory-and-storage",
        title: "CPU, memory & storage",
        topics: [
          { slug: "what-the-cpu-does", title: "What the CPU does", planned: true },
          { slug: "ram-vs-storage", title: "RAM vs storage", planned: true },
          { slug: "ghz-gb-tb", title: "GHz, GB, TB", planned: true },
          { slug: "why-computers-slow-down", title: "Why computers slow down", planned: true },
        ],
      },
      {
        slug: "input-and-output-devices",
        title: "Input & output devices",
        topics: [
          { slug: "input-devices", title: "Input devices", planned: true },
          { slug: "output-devices", title: "Output devices", planned: true },
          { slug: "peripherals", title: "Peripherals", planned: true },
          { slug: "connecting-a-device", title: "Connecting a device", planned: true },
        ],
      },
      {
        slug: "how-software-runs",
        title: "How software runs",
        topics: [
          { slug: "hardware-vs-software", title: "Hardware vs software", planned: true },
          { slug: "programs-and-processes", title: "Programs & processes", planned: true },
          { slug: "booting-up", title: "Booting up", planned: true },
          { slug: "apps-vs-the-os", title: "Apps vs the OS", planned: true },
        ],
      },
      {
        slug: "types-of-computers",
        title: "Types of computers",
        topics: [
          { slug: "desktops-and-laptops", title: "Desktops & laptops", planned: true },
          { slug: "phones-and-tablets", title: "Phones & tablets", planned: true },
          { slug: "servers", title: "Servers", planned: true },
          { slug: "smart-devices", title: "Smart devices", planned: true },
        ],
      },
    ],
  },
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
          { slug: "verification-vs-validation", title: "Verification vs validation" },
          { slug: "sdlc-and-stlc", title: "SDLC & STLC" },
        ],
      },
      {
        slug: "test-design",
        title: "Test design techniques",
        topics: [
          { slug: "equivalence-partitioning", title: "Equivalence partitioning" },
          { slug: "boundary-value-analysis", title: "Boundary value analysis" },
          { slug: "decision-tables", title: "Decision tables" },
          { slug: "state-transition", title: "State transition testing" },
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
          { slug: "test-plans", title: "Test plans & strategy" },
        ],
      },
      {
        slug: "exploratory",
        title: "Exploratory testing",
        topics: [
          { slug: "session-based", title: "Session-based test management" },
          { slug: "heuristics", title: "Testing heuristics & tours" },
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
          { slug: "locators", title: "Locators & selectors" },
          { slug: "page-object-model", title: "The Page Object Model" },
          { slug: "waits-and-sync", title: "Waits & synchronization" },
        ],
      },
      {
        slug: "frameworks",
        title: "Frameworks & tooling",
        topics: [
          { slug: "selenium-java", title: "Selenium with Java" },
          { slug: "playwright", title: "Playwright" },
          { slug: "testng-junit", title: "TestNG & JUnit" },
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
          { slug: "status-codes", title: "Status codes that matter" },
          { slug: "rest-principles", title: "REST principles" },
        ],
      },
      {
        slug: "practice",
        title: "Testing APIs in practice",
        topics: [
          { slug: "auth-schemes", title: "Auth schemes (key, Basic, Bearer, OAuth2)" },
          { slug: "contract-testing", title: "Contract testing" },
          { slug: "postman-and-curl", title: "Postman & curl" },
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
          { slug: "load-vs-stress", title: "Load vs stress vs soak" },
          { slug: "key-metrics", title: "Latency, throughput & percentiles" },
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
          { slug: "owasp-top-10", title: "The OWASP Top 10" },
          { slug: "injection", title: "Injection & XSS" },
          { slug: "auth-failures", title: "Broken authentication" },
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
          { slug: "select-basics", title: "SELECT, JOIN & aggregate basics" },
          { slug: "data-integrity", title: "Data-integrity checks" },
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
          { slug: "ci-basics", title: "CI basics & quality gates" },
          { slug: "test-in-pipeline", title: "Running tests in the pipeline" },
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
          { slug: "device-matrix", title: "The device & OS matrix" },
          { slug: "mobile-specifics", title: "Gestures, interrupts & networks" },
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
