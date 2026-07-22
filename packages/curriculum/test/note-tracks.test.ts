import { describe, expect, it } from "vitest";
import { NOTES_TAXONOMY } from "../src/notes/taxonomy";
import { NOTE_TRACKS, trackForModule } from "../src/notes/tracks";

/**
 * The track grouping is the primary learning surface + the certificate unit, so
 * it must stay in lockstep with the taxonomy: every module belongs to exactly
 * one track, and no track references a module that doesn't exist. Without this,
 * a newly-added module silently vanishes from the dashboard and no certificate
 * ever covers it.
 */
describe("note tracks cover the taxonomy exactly", () => {
  const taxonomyModules = NOTES_TAXONOMY.map((m) => m.slug);
  const trackModules = NOTE_TRACKS.flatMap((t) => t.moduleSlugs);

  it("every track module slug exists in the taxonomy", () => {
    const unknown = trackModules.filter((s) => !taxonomyModules.includes(s));
    expect(unknown, `track modules missing from taxonomy:\n${unknown.join("\n")}`).toEqual([]);
  });

  it("every taxonomy module belongs to exactly one track", () => {
    const ungrouped = taxonomyModules.filter((s) => !trackForModule(s));
    expect(ungrouped, `modules not in any track:\n${ungrouped.join("\n")}`).toEqual([]);
  });

  it("no module is listed in more than one track", () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const s of trackModules) {
      if (seen.has(s)) dupes.push(s);
      seen.add(s);
    }
    expect(dupes, `modules in multiple tracks:\n${dupes.join("\n")}`).toEqual([]);
  });

  it("track slugs are unique and kebab-case", () => {
    const slugs = NOTE_TRACKS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z][a-z0-9-]*$/);
  });
});
