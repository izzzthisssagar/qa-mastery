/**
 * QA-native taxonomy — the shared vocabulary both sides filter on. These are
 * allow-lists (not free text): the migration's text[] columns are validated
 * against these in the Server Actions before insert, so the directory filters
 * stay precise. Keep in sync with the check constraints in
 * supabase/migrations/20260621000017_talent.sql.
 */

export const DISCIPLINES = ["manual", "automation", "both"] as const;
export type Discipline = (typeof DISCIPLINES)[number];

export const AVAILABILITY = ["open", "busy", "not_looking"] as const;
export type Availability = (typeof AVAILABILITY)[number];

export const SPECIALTIES = [
  "functional",
  "regression",
  "exploratory",
  "api",
  "performance",
  "security",
  "accessibility",
  "usability",
  "localization",
  "mobile",
  "web",
  "game",
  "embedded",
] as const;
export type Specialty = (typeof SPECIALTIES)[number];

export const STACK = [
  "selenium",
  "playwright",
  "cypress",
  "appium",
  "testng",
  "junit",
  "postman",
  "rest-assured",
  "k6",
  "jmeter",
  "java",
  "javascript",
  "typescript",
  "python",
] as const;
export type Stack = (typeof STACK)[number];

export const PROJECT_TYPES = [
  "web",
  "mobile",
  "api",
  "game",
  "desktop",
  "embedded",
  "other",
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const ENGAGEMENTS = ["one_off", "ongoing", "full_time"] as const;
export type Engagement = (typeof ENGAGEMENTS)[number];

export const PORTFOLIO_TYPES = [
  "bug_report",
  "test_case",
  "automation",
  "coverage",
  "other",
] as const;
export type PortfolioType = (typeof PORTFOLIO_TYPES)[number];

export const DEVICE_KINDS = ["mobile", "desktop", "tablet"] as const;
export type DeviceKind = (typeof DEVICE_KINDS)[number];

/** Human labels for display (slugs are stored; labels are presentation-only). */
export const LABELS: Record<string, string> = {
  one_off: "One-off project",
  ongoing: "Ongoing",
  full_time: "Full-time",
  not_looking: "Not looking",
  api: "API",
  rest_assured: "REST Assured",
  testng: "TestNG",
  junit: "JUnit",
};

/** Title-case a slug for display when it isn't in LABELS. */
export function labelFor(slug: string): string {
  return LABELS[slug] ?? slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
