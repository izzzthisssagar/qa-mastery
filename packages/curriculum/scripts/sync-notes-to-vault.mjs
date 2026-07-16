#!/usr/bin/env node
// Mirrors every packages/curriculum/content/notes/**/*.mdx into the sibling
// Obsidian vault ("../../.." from this package = "My Qa Projecct") as plain
// Markdown, so the whole notes corpus shows up — and connects — in Obsidian's
// native graph view. Frontmatter `related:` triples become real [[wikilinks]];
// `tags:` carry straight into Obsidian's tag frontmatter for a second, looser
// layer of graph connectivity. Each note's HotspotImage is copied alongside it
// and embedded. Run from the package root: node scripts/sync-notes-to-vault.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkgRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const repoRoot = path.resolve(pkgRoot, "..", "..");
const vaultRoot = path.resolve(repoRoot, "..");
const notesRoot = path.join(pkgRoot, "content", "notes");
const publicRoot = path.join(repoRoot, "apps", "platform", "public");
const outRoot = path.join(vaultRoot, "Notes");

const matter = (await import(require.resolve("gray-matter", { paths: [pkgRoot] }))).default;

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".mdx")) out.push(full);
  }
  return out;
}

/** Non-greedy string-array `[ "a", "b", ... ]` -> ["a", "b", ...] */
function extractStringArray(src) {
  const items = [];
  const re = /"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(src))) items.push(unescape(m[1]));
  return items;
}

/** Non-greedy `{ key1: "...", key2: "..." }` object array -> [{key1,key2}] for a fixed 2-key shape. */
function extractObjectArray(src, keys) {
  const out = [];
  const objRe = /\{([^{}]*)\}/g;
  let m;
  while ((m = objRe.exec(src))) {
    const body = m[1];
    const rec = {};
    let ok = true;
    for (const k of keys) {
      const km = new RegExp(`${k}:\\s*(?:"((?:[^"\\\\]|\\\\.)*)"|(null)|([0-9]+))`).exec(body);
      if (!km) {
        ok = false;
        break;
      }
      rec[k] = km[1] !== undefined ? unescape(km[1]) : km[2] !== undefined ? null : km[3];
    }
    if (ok) out.push(rec);
  }
  return out;
}

function unescape(s) {
  return s.replace(/\\"/g, '"').replace(/\\n/g, "\n");
}

function attr(tag, name) {
  const m = new RegExp(`${name}=\\{?"((?:[^"\\\\]|\\\\.)*)"\\}?`).exec(tag);
  return m ? unescape(m[1]) : undefined;
}

function blockquote(text, label) {
  const body = text.trim();
  const prefixed = body
    .split("\n")
    .map((l) => `> ${l}`.trimEnd())
    .join("\n");
  return label ? `> **${label}**\n>\n${prefixed}` : prefixed;
}

const CALLOUT_LABEL = { tip: "Tip", warn: "Watch out", mistake: "Common mistake", analogy: "In real life" };

let imageCopiedThisNote = false;

/** Copies a public-root-relative src ("/notes/mod/ch/topic.jpg") next to the
 *  vault note and returns the local filename to embed, or null if missing. */
function copyImage(src, outDir) {
  if (!src) return null;
  const abs = path.join(publicRoot, src.replace(/^\//, ""));
  if (!fs.existsSync(abs)) return null;
  const base = path.basename(abs);
  fs.copyFileSync(abs, path.join(outDir, base));
  imageCopiedThisNote = true;
  return base;
}

function convertBody(body, outDir) {
  let s = body;

  // Drop image sourcing comments — the real image is embedded from HotspotImage below.
  s = s.replace(/\{\/\*\s*IMAGE:[\s\S]*?\*\/\}\s*/g, "");

  // HotspotImage -> embedded image + credit + pins as a bullet list.
  s = s.replace(/<HotspotImage\b([\s\S]*?)\/>/g, (_, inner) => {
    const src = attr(inner, "src");
    const alt = attr(inner, "alt") ?? "";
    const credit = attr(inner, "credit") ?? "";
    const creditHref = attr(inner, "creditHref");
    const pinsMatch = /pins=\{\[([\s\S]*?)\]\}/.exec(inner);
    const pins = pinsMatch ? extractObjectArray(pinsMatch[1], ["label", "desc"]) : [];
    const localName = copyImage(src, outDir);
    const img = localName ? `![${alt}](${localName})` : `*(image: ${src})*`;
    const creditLine = creditHref ? `*${credit}. [Source](${creditHref})*` : `*${credit}*`;
    const pinLines = pins.map((p) => `- **${p.label}** — ${p.desc}`).join("\n");
    return [img, "", creditLine, "", pinLines].filter(Boolean).join("\n") + "\n";
  });

  // Figure caption="..." wrapping a plain <img src="..." alt="..."/> — the
  // older, pre-HotspotImage image convention used in the earliest modules.
  s = s.replace(/<Figure(?:\s+caption="((?:[^"\\]|\\.)*)")?>([\s\S]*?)<\/Figure>/g, (_, caption, content) => {
    const imgMatch = /<img\s+([^>]*)\/?>/.exec(content);
    if (!imgMatch) return content.trim() + "\n";
    const src = attr(imgMatch[1], "src");
    const alt = attr(imgMatch[1], "alt") ?? "";
    const localName = copyImage(src, outDir);
    const img = localName ? `![${alt}](${localName})` : `*(image: ${src})*`;
    return caption ? `${img}\n\n*${unescape(caption)}*\n` : `${img}\n`;
  });

  // FlowAnimation -> numbered progression.
  s = s.replace(/<FlowAnimation\b([\s\S]*?)\/>/g, (_, inner) => {
    const title = attr(inner, "title");
    const nodesMatch = /nodes=\{\[([\s\S]*?)\]\}/.exec(inner);
    const nodes = nodesMatch ? extractObjectArray(nodesMatch[1], ["label", "desc"]) : [];
    const list = nodes.map((n, i) => `${i + 1}. **${n.label}** — ${n.desc}`).join("\n");
    return `${title ? `**${title}**\n\n` : ""}${list}\n`;
  });

  // CodePlayground -> fenced code block.
  s = s.replace(/<CodePlayground\b([\s\S]*?)\/>/g, (_, inner) => {
    const language = attr(inner, "language") ?? "";
    const title = attr(inner, "title") ?? "";
    const codeMatch = /code=\{`([\s\S]*?)`\}\s*$/.exec(inner.trim());
    const code = codeMatch ? codeMatch[1] : "";
    return `${title ? `*${title}*\n\n` : ""}\`\`\`${language}\n${code}\n\`\`\`\n`;
  });

  // StepChecklist -> markdown task list.
  s = s.replace(/<StepChecklist\b([\s\S]*?)\/>/g, (_, inner) => {
    const stepsMatch = /steps=\{\[([\s\S]*?)\]\}/.exec(inner);
    const steps = stepsMatch ? extractObjectArray(stepsMatch[1], ["text", "detail"]) : [];
    return steps.map((st) => `- [ ] ${st.text}${st.detail ? ` — ${st.detail}` : ""}`).join("\n") + "\n";
  });

  // WhenItBreaks -> symptom/fix pairs.
  s = s.replace(/<WhenItBreaks\b([\s\S]*?)\/>/g, (_, inner) => {
    const itemsMatch = /items=\{\[([\s\S]*?)\]\}/.exec(inner);
    const items = itemsMatch ? extractObjectArray(itemsMatch[1], ["symptom", "fix"]) : [];
    return items.map((it) => `- **${it.symptom}**\n  ${it.fix}`).join("\n") + "\n";
  });

  // Quiz -> question, options, marked answer, explanation.
  s = s.replace(/<Quiz\b([\s\S]*?)\/>/g, (_, inner) => {
    const question = attr(inner, "question") ?? "";
    const optsMatch = /options=\{\[([\s\S]*?)\]\}/.exec(inner);
    const options = optsMatch ? extractStringArray(optsMatch[1]) : [];
    const answerMatch = /answer=\{(\d+)\}/.exec(inner);
    const answerIdx = answerMatch ? Number(answerMatch[1]) : -1;
    const explain = attr(inner, "explain") ?? "";
    const optLines = options.map((o, i) => `- [${i === answerIdx ? "x" : " "}] ${o}`).join("\n");
    return `**Quiz.** ${question}\n\n${optLines}\n\n*${explain}*\n`;
  });

  // Flashcards -> front/back pairs.
  s = s.replace(/<Flashcards\b([\s\S]*?)\/>/g, (_, inner) => {
    const cardsMatch = /cards=\{\[([\s\S]*?)\]\}/.exec(inner);
    const cards = cardsMatch ? extractObjectArray(cardsMatch[1], ["front", "back"]) : [];
    return cards.map((c) => `- **${c.front}** — ${c.back}`).join("\n") + "\n";
  });

  // Resources -> link list.
  s = s.replace(/<Resources\b([\s\S]*?)\/>/g, (_, inner) => {
    const linksMatch = /links=\{\[([\s\S]*?)\]\}/.exec(inner);
    const links = linksMatch ? extractObjectArray(linksMatch[1], ["href", "title", "kind"]) : [];
    return links.map((l) => `- [${l.title}](${l.href})`).join("\n") + "\n";
  });

  // Video -> a link line (dedupes against Resources' own watch link, harmless).
  s = s.replace(/<Video\b([^>]*?)\/>/g, (_, inner) => {
    const href = attr(inner, "href");
    const title = attr(inner, "title");
    const minutesMatch = /minutes=\{(\d+)\}/.exec(inner);
    const minutes = minutesMatch ? minutesMatch[1] : "?";
    return `🎬 [${title}](${href}) (${minutes} min)\n`;
  });

  // Takeaways -> bullet list.
  s = s.replace(/<Takeaways\b([\s\S]*?)\/>/g, (_, inner) => {
    const pointsMatch = /points=\{\[([\s\S]*?)\]\}/.exec(inner);
    const points = pointsMatch ? extractStringArray(pointsMatch[1]) : [];
    return points.map((p) => `- ${p}`).join("\n") + "\n";
  });

  // Term -> bold term + definition, keep the inner term text.
  s = s.replace(/<Term\s+define="((?:[^"\\]|\\.)*)">([\s\S]*?)<\/Term>/g, (_, def, term) => {
    return `**${term.trim()}**: ${unescape(def)}`;
  });

  // Callout type="..." -> labeled blockquote.
  s = s.replace(/<Callout(?:\s+type="(\w+)")?>([\s\S]*?)<\/Callout>/g, (_, type, content) => {
    return blockquote(content, CALLOUT_LABEL[type] ?? "Note") + "\n";
  });

  // Hook -> plain blockquote, no label (it's the opener).
  s = s.replace(/<Hook>([\s\S]*?)<\/Hook>/g, (_, content) => blockquote(content) + "\n");

  // FirstTime title="..." -> heading, keep inner content (StepChecklist already converted above).
  s = s.replace(/<FirstTime\s+title="((?:[^"\\]|\\.)*)">([\s\S]*?)<\/FirstTime>/g, (_, title, content) => {
    return `### Your first time: ${unescape(title)}\n\n${content.trim()}\n`;
  });

  // WorkedExample title="..." -> heading + content.
  s = s.replace(/<WorkedExample\s+title="((?:[^"\\]|\\.)*)">([\s\S]*?)<\/WorkedExample>/g, (_, title, content) => {
    return `### Worked example: ${unescape(title)}\n\n${content.trim()}\n`;
  });

  // WhereToCheck -> heading + content (already plain markdown bullets inside).
  s = s.replace(/<WhereToCheck>([\s\S]*?)<\/WhereToCheck>/g, (_, content) => {
    return `### Where to check\n\n${content.trim()}\n`;
  });

  // Challenge -> heading + content.
  s = s.replace(/<Challenge>([\s\S]*?)<\/Challenge>/g, (_, content) => {
    return `### Challenge\n\n${content.trim()}\n`;
  });

  // AskCommunity prompt="..." -> heading + prompt quote + content.
  s = s.replace(/<AskCommunity\s+prompt="((?:[^"\\]|\\.)*)">([\s\S]*?)<\/AskCommunity>/g, (_, prompt, content) => {
    return `### Ask the community\n\n> ${unescape(prompt)}\n\n${content.trim()}\n`;
  });

  // Complete -> drop (XP tracking has no meaning outside the app).
  s = s.replace(/<Complete\b[^>]*\/>\s*/g, "");

  // Any remaining unrecognized self-closing/paired tag: strip the tag, keep its
  // text — but ONLY outside fenced code blocks. Java/TS generics (`List<String>`,
  // `Map<String, List<String>>`) inside the ```code``` fences already produced
  // above look exactly like an unclosed JSX tag to a blanket regex; splitting on
  // the fences first keeps this pass from mangling real code.
  const segments = s.split(/(```[\s\S]*?```)/);
  s = segments
    .map((seg, i) => (i % 2 === 0 ? seg.replace(/<\/?[A-Z]\w*[^>]*>/g, "") : seg))
    .join("");

  return s.replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function tripleToWikilink(triple, allLeaves) {
  const [m, c, t] = triple.split("/");
  const leaf = allLeaves.find((l) => l.moduleSlug === m && l.chapterSlug === c && l.topicSlug === t);
  const display = leaf ? leaf.title : t;
  return `[[Notes/${m}/${c}/${t}|${display}]]`;
}

// Build a slug->title lookup straight from taxonomy.ts source (avoids needing
// a TS loader just for this script) — same trick check-note-mdx-compile.mjs
// avoids by not needing it at all; here we do a light regex scan instead.
function loadTaxonomyTitles() {
  const src = fs.readFileSync(path.join(pkgRoot, "src", "notes", "taxonomy.ts"), "utf8");
  const leaves = [];
  let curModule = null;
  let curChapter = null;
  for (const line of src.split("\n")) {
    let m;
    if ((m = /^\s*slug:\s*"([a-z0-9-]+)"/.exec(line)) && /title:/.test(src)) {
      // handled contextually below via separate module/chapter/topic passes
    }
  }
  // Simpler and robust: three-pass regex over the whole source respecting nesting depth
  // via a small manual scanner (the taxonomy is a plain nested array literal).
  const moduleRe = /\{\s*slug:\s*"([a-z0-9-]+)",\s*title:\s*"([^"]*)"[\s\S]*?chapters:\s*\[([\s\S]*?)\n\s{4}\],\s*\n\s{2}\},/g;
  let mm;
  while ((mm = moduleRe.exec(src))) {
    const moduleSlug = mm[1];
    const chaptersSrc = mm[3];
    const chapterRe = /\{\s*slug:\s*"([a-z0-9-]+)",\s*title:\s*"([^"]*)",\s*topics:\s*\[([\s\S]*?)\],\s*\n\s*\},/g;
    let cm;
    while ((cm = chapterRe.exec(chaptersSrc))) {
      const chapterSlug = cm[1];
      const topicsSrc = cm[3];
      const topicRe = /\{\s*slug:\s*"([a-z0-9-]+)",\s*title:\s*"([^"]*)"(,\s*planned:\s*true)?\s*\}/g;
      let tm;
      while ((tm = topicRe.exec(topicsSrc))) {
        leaves.push({ moduleSlug, chapterSlug, topicSlug: tm[1], title: tm[2], planned: !!tm[3] });
      }
    }
  }
  return leaves;
}

const allLeaves = loadTaxonomyTitles();
const files = walk(notesRoot).sort();
let written = 0;
let skippedNoImage = 0;
/** moduleSlug -> chapterSlug -> [{topicSlug, title}] , in the order files were walked (already sorted). */
const index = new Map();

for (const f of files) {
  const raw = fs.readFileSync(f, "utf8");
  const { data, content } = matter(raw);
  const rel = path.relative(notesRoot, f); // e.g. defect-management/severity-vs-priority/who-sets-what.mdx
  const [moduleSlug, chapterSlug, topicFile] = rel.split(path.sep);
  const topicSlug = topicFile.replace(/\.mdx$/, "");

  if (!index.has(moduleSlug)) index.set(moduleSlug, new Map());
  const chapters = index.get(moduleSlug);
  if (!chapters.has(chapterSlug)) chapters.set(chapterSlug, []);
  chapters.get(chapterSlug).push({ topicSlug, title: data.title ?? topicSlug });

  const outDir = path.join(outRoot, moduleSlug, chapterSlug);
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${topicSlug}.md`);

  const relatedLinks = (data.related ?? []).map((t) => tripleToWikilink(t, allLeaves));
  imageCopiedThisNote = false;
  const bodyMd = convertBody(content, outDir);
  if (!imageCopiedThisNote) skippedNoImage++;

  const fm = [
    "---",
    `title: "${(data.title ?? topicSlug).replace(/"/g, '\\"')}"`,
    `tags: [${(data.tags ?? []).map((t) => `"${t}"`).join(", ")}]`,
    data.updated ? `updated: "${data.updated}"` : null,
    "---",
  ]
    .filter(Boolean)
    .join("\n");

  const summary = data.summary ? `*${data.summary}*\n\n` : "";
  const relatedSection = relatedLinks.length
    ? `\n\n## Related notes\n\n${relatedLinks.map((l) => `- ${l}`).join("\n")}\n`
    : "";
  const source = `\n\n---\n_Source: \`packages/curriculum/content/notes/${rel}\`_\n`;

  const out = `${fm}\n\n# ${data.title ?? topicSlug}\n\n${summary}${bodyMd}${relatedSection}${source}`;
  fs.writeFileSync(outFile, out);
  written++;
}

// A stable hub note — module -> chapter -> topic — so the mirror is
// browsable without relying on graph view alone, and so Home.md has a real
// note (not a bare folder, which Obsidian wikilinks can't target) to link to.
const moduleTitles = (() => {
  const src = fs.readFileSync(path.join(pkgRoot, "src", "notes", "taxonomy.ts"), "utf8");
  const map = new Map();
  const re = /\{\s*slug:\s*"([a-z0-9-]+)",\s*title:\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(src))) if (!map.has(m[1])) map.set(m[1], m[2]);
  return map;
})();

const indexLines = ["# Curriculum notes index", "", "Auto-generated by `sync-notes-to-vault.mjs` — do not hand-edit.", ""];
for (const [moduleSlug, chapters] of [...index.entries()].sort()) {
  indexLines.push(`## ${moduleTitles.get(moduleSlug) ?? moduleSlug}`, "");
  for (const [chapterSlug, topics] of chapters) {
    indexLines.push(`**${chapterSlug.replace(/-/g, " ")}**`);
    for (const t of topics) {
      indexLines.push(`- [[Notes/${moduleSlug}/${chapterSlug}/${t.topicSlug}|${t.title}]]`);
    }
    indexLines.push("");
  }
}
fs.writeFileSync(path.join(outRoot, "index.md"), indexLines.join("\n").replace(/\n{3,}/g, "\n\n"));

console.log(`wrote ${written} notes + index.md to ${path.relative(vaultRoot, outRoot)}/ (${skippedNoImage} had no image to copy)`);
