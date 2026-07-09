"use client";

/**
 * The interactive note component library — the "addictive" building blocks every
 * notes topic is authored from. All client components (canvas, quizzes, flip
 * cards, XP), passed into MDXRemote's component map so `.mdx` can use them as
 * plain tags: <Hook>, <Callout>, <Figure>, <Video>, <Quiz>, <Flashcards>,
 * <Term>, <Takeaways>, <Complete>. Self-contained and reduced-motion aware.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

/* ── Hook: the curiosity opener ─────────────────────────────────────────────*/
export function Hook({ children }: { children: ReactNode }) {
  return (
    <div className="my-6 rounded-r-xl border-l-[3px] border-accent bg-gradient-to-r from-accent/10 to-transparent px-5 py-4 text-[17px] text-foreground/90">
      {children}
    </div>
  );
}

/* ── Callout: tip / warn / mistake / analogy ────────────────────────────────*/
const CALLOUT_META = {
  tip: { icon: "💡", ring: "border-accent/40", label: "Tip" },
  warn: { icon: "⚠️", ring: "border-bug/50", label: "Watch out" },
  mistake: { icon: "🚫", ring: "border-rose-400/40", label: "Common mistake" },
  analogy: { icon: "🌍", ring: "border-violet-400/40", label: "In real life" },
} as const;

export function Callout({
  type = "tip",
  children,
}: {
  type?: keyof typeof CALLOUT_META;
  children: ReactNode;
}) {
  const m = CALLOUT_META[type];
  return (
    <div className={`my-5 flex gap-3 rounded-xl border ${m.ring} bg-surface px-4 py-3.5 text-[15px]`}>
      <span className="shrink-0 text-lg leading-6" aria-hidden>{m.icon}</span>
      <div>
        <span className="mr-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {m.label}
        </span>
        {children}
      </div>
    </div>
  );
}

/* ── Figure: caption wrapper for any diagram/image ──────────────────────────*/
export function Figure({ caption, children }: { caption?: string; children: ReactNode }) {
  return (
    <figure className="my-6 rounded-2xl border border-border bg-surface p-5">
      {children}
      {caption && <figcaption className="mt-3 text-center text-sm text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}

/* ── Video: links out (real embed lands when the note ships) ────────────────*/
export function Video({ href, title, minutes }: { href: string; title: string; minutes?: number }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="my-6 flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent/50"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent/15 text-lg text-accent">▶</span>
      <span>
        <span className="block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Watch{minutes ? ` · ${minutes} min` : ""}
        </span>
        <span className="mt-0.5 block font-semibold text-foreground">{title}</span>
      </span>
    </a>
  );
}

/* ── Term: glossary tooltip for jargon ──────────────────────────────────────*/
export function Term({ define, children }: { define: string; children: ReactNode }) {
  return (
    <span className="group relative cursor-help border-b border-dashed border-accent/60 text-foreground">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-56 -translate-x-1/2 rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs font-normal leading-snug text-muted-foreground shadow-lg group-hover:block">
        {define}
      </span>
    </span>
  );
}

/* ── Quiz: MCQ with instant feedback + XP ───────────────────────────────────*/
export function Quiz({
  question,
  options,
  answer,
  explain,
}: {
  question: string;
  options: string[];
  answer: number;
  explain?: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const done = picked !== null;
  const correct = picked === answer;

  return (
    <div className="my-7 rounded-2xl border border-border bg-gradient-to-b from-surface-raised to-surface p-5">
      <div className="flex items-center gap-2 text-[17px] font-semibold text-foreground">
        <span className="text-bug" aria-hidden>🧠</span> Quick check
      </div>
      <p className="mb-3 mt-3 text-[15px] font-medium text-foreground">{question}</p>
      <div className="flex flex-col gap-2">
        {options.map((opt, i) => {
          const state =
            !done ? "" : i === answer ? "correct" : i === picked ? "wrong" : "";
          const cls =
            state === "correct"
              ? "border-emerald-400 bg-emerald-400/10"
              : state === "wrong"
                ? "border-rose-400 bg-rose-400/10"
                : "border-border hover:border-accent/40";
          return (
            <button
              key={i}
              type="button"
              disabled={done}
              onClick={() => setPicked(i)}
              className={`flex items-center gap-2.5 rounded-xl border bg-background px-3.5 py-3 text-left text-[15px] text-foreground transition-colors ${cls} disabled:cursor-default`}
            >
              <span className="grid size-5 shrink-0 place-items-center rounded-full border text-xs">
                {done && i === answer ? "✓" : done && i === picked ? "✕" : ""}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
      {done && (
        <div
          className={`mt-3 rounded-xl border px-3.5 py-3 text-sm ${correct ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-bug/30 bg-bug/10 text-amber-200"}`}
        >
          <b>{correct ? "Correct! " : "Not quite. "}</b>
          {explain}
        </div>
      )}
    </div>
  );
}

/* ── Flashcards: flip cards for key terms ───────────────────────────────────*/
export function Flashcards({ cards }: { cards: { front: string; back: string }[] }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[i];
  const go = (d: number) => {
    setFlipped(false);
    setI((p) => (p + d + cards.length) % cards.length);
  };
  return (
    <div className="my-6 rounded-2xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span aria-hidden>🃏</span> Flashcards
        </span>
        <span className="text-xs text-muted-foreground">{i + 1} / {cards.length}</span>
      </div>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-28 w-full items-center justify-center rounded-xl border border-border bg-background px-5 py-6 text-center text-[15px] text-foreground transition-colors hover:border-accent/40"
      >
        {flipped ? <span className="text-muted-foreground">{card.back}</span> : <span className="font-semibold">{card.front}</span>}
      </button>
      <div className="mt-3 flex items-center justify-between text-sm">
        <button type="button" onClick={() => go(-1)} className="text-muted-foreground hover:text-foreground">← Prev</button>
        <span className="text-xs text-muted-foreground">{flipped ? "Showing answer" : "Tap card to flip"}</span>
        <button type="button" onClick={() => go(1)} className="text-muted-foreground hover:text-foreground">Next →</button>
      </div>
    </div>
  );
}

/* ── Takeaways: the summary checklist ───────────────────────────────────────*/
export function Takeaways({ points }: { points: string[] }) {
  return (
    <div className="my-8 rounded-2xl border border-border bg-surface p-5">
      <h3 className="mb-3 text-[15px] font-semibold text-foreground">Key takeaways</h3>
      <ul className="flex flex-col gap-2.5">
        {points.map((p, i) => (
          <li key={i} className="relative pl-6 text-[15px] text-foreground/90">
            <span className="absolute left-0 top-0 font-bold text-accent">✓</span>
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Complete: mark done + XP burst (client demo; wires to xp_events later) ──*/
export function Complete({ xp = 10 }: { xp?: number }) {
  const [done, setDone] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  function burst() {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const colors = ["#2dd4a7", "#f5b948", "#a78bfa", "#34d399"];
    for (let i = 0; i < 24; i++) {
      const s = document.createElement("span");
      s.textContent = "✦";
      s.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;pointer-events:none;z-index:99;color:${colors[i % 4]};transition:transform 1s ease-out,opacity 1s;`;
      document.body.appendChild(s);
      requestAnimationFrame(() => {
        const a = Math.random() * Math.PI * 2;
        const d = 60 + Math.random() * 80;
        s.style.transform = `translate(${Math.cos(a) * d}px,${Math.sin(a) * d + 40}px)`;
        s.style.opacity = "0";
      });
      setTimeout(() => s.remove(), 1050);
    }
  }

  return (
    <div className="my-10 text-center">
      <button
        ref={btnRef}
        type="button"
        disabled={done}
        onClick={() => {
          setDone(true);
          burst();
        }}
        className={`rounded-2xl px-8 py-3.5 text-base font-bold transition ${done ? "cursor-default border border-accent/40 bg-surface text-accent" : "bg-accent text-accent-foreground hover:brightness-105"}`}
      >
        {done ? `✓ Completed · +${xp} XP earned` : `Mark complete · +${xp} XP`}
      </button>
    </div>
  );
}

/* ── Mentor sections: the "senior QA in your pocket" anatomy ────────────────*/

/** 🔧 First time? Do this — exact steps, nothing assumed. */
export function FirstTime({ title = "First time? Do this", children }: { title?: string; children: ReactNode }) {
  return (
    <section className="my-7 rounded-2xl border border-accent/30 bg-surface p-5">
      <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-foreground">
        <span aria-hidden>🔧</span> {title}
      </h3>
      <div className="note-steps text-[15px] text-foreground/90">{children}</div>
    </section>
  );
}

/** ⚠️ When it breaks — one row per symptom, with the fix a senior would give. */
export function WhenItBreaks({ items }: { items: { symptom: string; fix: string }[] }) {
  return (
    <section className="my-7 rounded-2xl border border-bug/30 bg-surface p-5">
      <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-foreground">
        <span aria-hidden>⚠️</span> When it breaks
      </h3>
      <ul className="flex flex-col gap-3">
        {items.map((it, i) => (
          <li key={i} className="rounded-xl border border-border bg-background px-4 py-3 text-[15px]">
            <p className="font-medium text-foreground">“{it.symptom}”</p>
            <p className="mt-1 text-muted-foreground">{it.fix}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 🔎 Where & how to check — concrete verification spots. */
export function WhereToCheck({ children }: { children: ReactNode }) {
  return (
    <section className="my-7 rounded-2xl border border-border bg-surface p-5">
      <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-foreground">
        <span aria-hidden>🔎</span> Where &amp; how to check
      </h3>
      <div className="text-[15px] text-foreground/90">{children}</div>
    </section>
  );
}

/** 🙋 How & whom to ask — frames a good question, routes to the community. */
export function AskCommunity({ prompt, children }: { prompt?: string; children?: ReactNode }) {
  return (
    <section className="my-7 rounded-2xl border border-violet-400/30 bg-surface p-5">
      <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-foreground">
        <span aria-hidden>🙋</span> Stuck? How &amp; whom to ask
      </h3>
      {children && <div className="text-[15px] text-foreground/90">{children}</div>}
      <a
        href="/community/new"
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:brightness-105"
      >
        Ask the community →
      </a>
      {prompt && (
        <p className="mt-3 rounded-xl border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground">
          <b className="text-foreground">Copy-paste starter:</b> “{prompt}”
        </p>
      )}
    </section>
  );
}

/** 🏆 End-of-topic challenge. */
export function Challenge({ children }: { children: ReactNode }) {
  return (
    <section className="my-7 rounded-2xl border border-border bg-gradient-to-b from-surface-raised to-surface p-5">
      <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-foreground">
        <span aria-hidden>🏆</span> Your challenge
      </h3>
      <div className="text-[15px] text-foreground/90">{children}</div>
    </section>
  );
}

/** 🔗 Resources — 3-5 curated best free links per topic. */
export function Resources({ links }: { links: { href: string; title: string; kind?: string }[] }) {
  return (
    <section className="my-7">
      <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-foreground">
        <span aria-hidden>🔗</span> Best free resources
      </h3>
      <ul className="flex flex-col gap-2">
        {links.map((l, i) => (
          <li key={i}>
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-[15px] text-foreground transition-colors hover:border-accent/50"
            >
              <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {l.kind ?? "read"}
              </span>
              {l.title}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The map handed to MDXRemote so notes can use these as tags. */
export const noteInteractiveComponents = {
  Hook,
  Callout,
  Figure,
  Video,
  Term,
  Quiz,
  Flashcards,
  Takeaways,
  Complete,
  FirstTime,
  WhenItBreaks,
  WhereToCheck,
  AskCommunity,
  Challenge,
  Resources,
};
