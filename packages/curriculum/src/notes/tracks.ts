/**
 * Curated learning tracks — an ordered, zero-to-job-ready spine that groups the
 * notes-wiki modules into phases. The notes taxonomy (`taxonomy.ts`) has no
 * track field, so THIS is the single source of truth for how modules present as
 * the primary learning surface (the dashboard) and what earns a track
 * certificate. Every non-planned module must belong to exactly one track — the
 * `note-tracks` test enforces full, disjoint coverage so a newly-added module
 * can never be silently ungrouped.
 */

export interface NoteTrack {
  /** Stable id — used in the URL and as the certificate id. */
  slug: string;
  title: string;
  blurb: string;
  /** Module slugs (from `NOTES_TAXONOMY`), in learning order. */
  moduleSlugs: readonly string[];
}

export const NOTE_TRACKS: readonly NoteTrack[] = [
  {
    slug: "foundations",
    title: "Foundations",
    blurb: "From absolute zero — computers, the web, and just enough programming to test.",
    moduleSlugs: [
      "how-a-computer-works",
      "operating-systems-and-files",
      "the-internet-and-the-web",
      "the-web-platform-for-testers",
      "digital-literacy-and-safety",
      "programming-basics",
      "logic-and-control-flow",
      "working-with-data",
      "a-first-language-deeper",
      "version-control-with-git",
      "linux-for-testers",
      "browser-devtools-mastery",
    ],
  },
  {
    slug: "manual-qa",
    title: "Manual QA",
    blurb: "How professional testing thinks — design, artifacts, defects, and exploration.",
    moduleSlugs: [
      "qa-foundations",
      "test-design-techniques",
      "test-artifacts",
      "levels-and-types-of-testing",
      "exploratory-testing",
      "defect-management",
      "testers-toolbox",
      "ui-ux-design-qa",
    ],
  },
  {
    slug: "automation",
    title: "Automation",
    blurb: "Turn manual skill into suites that run themselves — Selenium, frameworks, Playwright.",
    moduleSlugs: [
      "automation-foundations",
      "selenium-webdriver",
      "test-frameworks",
      "framework-design",
      "bdd-with-cucumber",
      "playwright",
      "automation-in-cicd",
    ],
  },
  {
    slug: "api-and-services",
    title: "API & Services",
    blurb: "Test the layer under the UI — HTTP by hand, automated API suites, API security.",
    moduleSlugs: ["api-testing-fundamentals", "api-test-automation", "api-and-modern-security"],
  },
  {
    slug: "data",
    title: "Data",
    blurb: "Verify what the app stores — SQL, relational depth, and modern NoSQL stores.",
    moduleSlugs: [
      "sql-and-databases-for-testers",
      "relational-databases-engineer-level",
      "nosql-and-modern-data",
    ],
  },
  {
    slug: "infrastructure-and-devops",
    title: "Infrastructure & DevOps",
    blurb: "The systems your tests run on — containers, Kubernetes, system design, Agile/DevOps.",
    moduleSlugs: [
      "docker-and-containers-for-testers",
      "kubernetes-and-test-infrastructure",
      "system-design-for-testers",
      "agile-and-devops-for-testers",
    ],
  },
  {
    slug: "specialized-testing",
    title: "Specialized Testing",
    blurb: "The senior disciplines — performance, security, accessibility, mobile, non-functional.",
    moduleSlugs: [
      "non-functional-testing-intro",
      "performance-testing",
      "security-testing-web",
      "accessibility-testing",
      "mobile-testing",
    ],
  },
  {
    slug: "reporting-and-ai",
    title: "Reporting & AI",
    blurb:
      "Communicate the work and use AI critically — metrics, reporting, and the modern tester.",
    moduleSlugs: ["test-management-and-reporting", "ai-and-the-modern-tester"],
  },
  {
    slug: "career",
    title: "Career",
    blurb: "Land the job — a proof portfolio, applications, interviews, and your first 90 days.",
    moduleSlugs: [
      "a-portfolio-that-gets-interviews",
      "resume-and-applications",
      "interviews",
      "your-first-90-days",
    ],
  },
];

/** The track a module belongs to, or undefined if it is not grouped. */
export function trackForModule(moduleSlug: string): NoteTrack | undefined {
  return NOTE_TRACKS.find((t) => t.moduleSlugs.includes(moduleSlug));
}

/** A track by its slug. */
export function findNoteTrack(slug: string): NoteTrack | undefined {
  return NOTE_TRACKS.find((t) => t.slug === slug);
}
