import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Design-token guard. Motivated by the --accent-foreground incident
 * (2026-07-10): components used `text-accent-foreground` while the token was
 * never declared, so Tailwind never generated the class, text silently
 * inherited the page foreground, and every on-accent CTA shipped at 1.62:1
 * contrast. No build error, no lint, no test — this file is that missing
 * failure. Two directions:
 *   1. every @theme alias must be BACKED by a real CSS custom property
 *   2. every color-ish utility USED in src/ must resolve to something Tailwind
 *      can generate (builtin palette, custom class, or a registered token)
 */

const ROOT = join(__dirname, "..");
const css = readFileSync(join(ROOT, "src/app/globals.css"), "utf8");

const themeBlock = css.match(/@theme inline \{([\s\S]*?)\n\}/)?.[1] ?? "";
const cssOutsideTheme = css.replace(themeBlock, "");

/** --color-<name>: var(--<backing>) pairs registered in @theme. */
const aliases = [...themeBlock.matchAll(/--color-([a-z0-9-]+):\s*var\(--([a-z0-9-]+)\)/g)].map(
  (m) => ({ name: m[1], backing: m[2] }),
);

/** Token names Tailwind can generate color utilities for. */
const registered = new Set(aliases.map((a) => a.name));

describe("@theme aliases are backed", () => {
  it("found the @theme block and at least the known tokens", () => {
    expect(aliases.length).toBeGreaterThanOrEqual(8);
  });

  it("every --color-* alias points at a custom property that is actually defined", () => {
    const missing = aliases
      .filter((a) => !new RegExp(`--${a.backing}:\\s*[^;]`).test(cssOutsideTheme))
      .map((a) => `--color-${a.name} -> var(--${a.backing}) (undefined)`);
    expect(missing, missing.join("\n")).toEqual([]);
  });
});

/* ── direction 2: used-but-undeclared ─────────────────────────────────────── */

// Tailwind's builtin palette (emerald-400, zinc-950…) and non-token color words.
const BUILTIN = /^[a-z]+-(?:50|100|200|300|400|500|600|700|800|900|950)$/;
const NON_TOKEN_WORDS = new Set(["white", "black", "transparent", "current", "inherit"]);
// text-/bg-/border- utilities that are not colors at all.
const NON_COLOR = new Set([
  "left","center","right","justify","start","end",
  "xs","sm","base","lg","xl","2xl","3xl","4xl","5xl","6xl","7xl","8xl","9xl",
  "wrap","nowrap","balance","pretty","ellipsis","clip","clip-text","clip-padding","clip-border","clip-content",
  "b","t","l","r","x","y","s","e","none","solid","dashed","dotted","double","hidden",
  "collapse","separate","cover","contain","auto","fixed","local","scroll",
  "top","bottom","repeat","no-repeat","repeat-x","repeat-y","origin-border","origin-padding","origin-content",
  "blend-normal","blend-multiply","blend-overlay","blend-screen",
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(entry)) out.push(p);
  }
  return out;
}

describe("color utilities used in src/ resolve to something real", () => {
  it("no (text|bg|border)-<token> references an unregistered custom token", () => {
    const offenders: string[] = [];
    for (const file of walk(join(ROOT, "src"))) {
      const srcText = readFileSync(file, "utf8");
      for (const m of srcText.matchAll(/(?:^|[\s"'`:!])(text|bg|border)-([a-z][a-z0-9-]*?)(?:\/\d{1,3})?(?=[\s"'`}<)]|$)/gm)) {
        const [, prefix, rawName] = m;
        const name = rawName;
        if (BUILTIN.test(name)) continue;
        if (NON_TOKEN_WORDS.has(name)) continue;
        if (NON_COLOR.has(name)) continue;
        if (/^gradient-to-/.test(name)) continue;
        if (/^\d/.test(name)) continue;
        if (/^[btlrxyse](-\d+)?$/.test(name)) continue; // border side/width, e.g. border-l-2
        if (registered.has(name)) continue;
        // custom classes defined in globals.css (e.g. .bg-grid, .text-glow-accent)
        if (css.includes(`.${prefix}-${name}`)) continue;
        offenders.push(`${prefix}-${name}  (${file.replace(ROOT + "/", "")})`);
      }
    }
    const unique = [...new Set(offenders)];
    expect(
      unique,
      `utilities that Tailwind cannot generate a color for:\n${unique.join("\n")}`,
    ).toEqual([]);
  });
});
