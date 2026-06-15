/**
 * Track + module metadata. Lessons live in MDX (frontmatter names a track +
 * module code); this file supplies the human titles and ordering the registry
 * needs. Kept here — not in frontmatter — because many lessons share a module,
 * so the title belongs to the module, not to any one lesson.
 */

export interface TrackMeta {
  title: string;
  order: number;
}

export interface ModuleMeta {
  /** Track slug this module belongs to. */
  track: string;
  title: string;
  order: number;
}

export const TRACKS: Record<string, TrackMeta> = {
  "track-a": { title: "Track A — Manual Testing Foundation", order: 1 },
  "track-b": { title: "Track B — Automation Foundation", order: 2 },
};

// Module code (frontmatter `module`, e.g. "A3") → metadata.
export const MODULES: Record<string, ModuleMeta> = {
  A1: { track: "track-a", title: "How Software Is Built (and Breaks)", order: 1 },
  A2: { track: "track-a", title: "Testing Fundamentals", order: 2 },
  A3: { track: "track-a", title: "Test Design Techniques", order: 3 },
  A4: { track: "track-a", title: "Test Cases, Bug Reports & Tools", order: 4 },
  A5: { track: "track-a", title: "Real-World Manual QA", order: 5 },
  A6: { track: "track-a", title: "Advanced Test Design", order: 6 },
  B0: { track: "track-b", title: "Just Enough Java", order: 1 },
  B1: { track: "track-b", title: "How Automation Actually Works", order: 2 },
  B2: { track: "track-b", title: "Selenium WebDriver Core", order: 3 },
  B3: { track: "track-b", title: "TestNG + Framework Structure", order: 4 },
  B4: { track: "track-b", title: "Good Practices & Capstone", order: 5 },
  B5: { track: "track-b", title: "Git + GitHub for Testers", order: 6 },
};

/** Module slug used as the DB natural key — lowercased code, e.g. "a3". */
export function moduleSlug(code: string): string {
  return code.toLowerCase();
}
