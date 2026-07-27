"use client";

/**
 * The interactive note component library — the "addictive" building blocks every
 * notes topic is authored from. All client components (canvas, quizzes, flip
 * cards, XP), passed into MDXRemote's component map so `.mdx` can use them as
 * plain tags: <Hook>, <Callout>, <Figure>, <Video>, <Quiz>, <Flashcards>,
 * <Term>, <Takeaways>, <Complete>. Self-contained and reduced-motion aware.
 */

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { Spinner } from "@qa-mastery/ui";
import { useHydrated } from "@/hooks/use-hydrated";
import { runSimulatorCode } from "@/app/(app)/simulator/actions";
import { createAutosave, type SaveStatus } from "./autosave";
import { deletePendingSave, getPendingSave, putPendingSave } from "./note-draft-db";
import { useNoteProgress } from "./note-progress-context";
import { SaveIndicator } from "./save-indicator";

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
    <div
      className={`my-5 flex gap-3 rounded-xl border ${m.ring} bg-surface px-4 py-3.5 text-[15px]`}
    >
      <span className="shrink-0 text-lg leading-6" aria-hidden>
        {m.icon}
      </span>
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
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/* ── Video: inline embedded player, click-to-play facade ────────────────────*/

/** Pull a provider + id out of a youtube.com/youtu.be/vimeo.com URL. Returns
 *  null for anything else, which falls back to a plain link-out — better
 *  than a broken embed for a URL shape nobody's seen yet. */
function parseVideoHref(href: string): { provider: "youtube" | "vimeo"; id: string } | null {
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = url.searchParams.get("v");
      if (v) return { provider: "youtube", id: v };
      const shorts = url.pathname.match(/^\/shorts\/([^/]+)/);
      if (shorts) return { provider: "youtube", id: shorts[1] };
      return null;
    }
    if (host === "youtu.be") {
      const id = url.pathname.slice(1);
      return id ? { provider: "youtube", id } : null;
    }
    if (host === "vimeo.com") {
      const id = url.pathname.slice(1);
      return /^\d+$/.test(id) ? { provider: "vimeo", id } : null;
    }
    return null;
  } catch {
    return null;
  }
}

function embedUrl(v: { provider: "youtube" | "vimeo"; id: string }): string {
  return v.provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1`
    : `https://player.vimeo.com/video/${v.id}?autoplay=1`;
}

export function Video({ href, title, minutes }: { href: string; title: string; minutes?: number }) {
  const [playing, setPlaying] = useState(false);
  const video = parseVideoHref(href);

  // Unrecognized URL shape: a working link-out beats a broken embed.
  if (!video) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="my-6 flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent/50"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-full border border-accent/40 bg-accent/15 text-lg text-accent">
          ▶
        </span>
        <span>
          <span className="block text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Watch{minutes ? ` · ${minutes} min` : ""}
          </span>
          <span className="mt-0.5 block font-semibold text-foreground">{title}</span>
        </span>
      </a>
    );
  }

  if (playing) {
    return (
      <div className="my-6 overflow-hidden rounded-2xl border border-border bg-black">
        <div className="relative aspect-video w-full">
          <iframe
            src={embedUrl(video)}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full"
          />
        </div>
      </div>
    );
  }

  // Click-to-play facade: a real <iframe> per video across 876 notes would
  // load hundreds of embeds nobody's watching. YouTube's thumbnail CDN needs
  // no API call; Vimeo has no equivalent no-auth endpoint, so it falls back
  // to a plain play button on a dark card instead of a thumbnail.
  const thumbnail =
    video.provider === "youtube" ? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg` : null;

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play video: ${title}`}
      className="group relative my-6 block aspect-video w-full overflow-hidden rounded-2xl border border-border bg-surface"
    >
      {thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element -- external thumbnail CDN, not an optimizable local asset
        <img
          src={thumbnail}
          alt=""
          className="absolute inset-0 size-full object-cover transition-opacity group-hover:opacity-80"
        />
      )}
      <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
        <span className="grid size-16 shrink-0 place-items-center rounded-full border border-white/40 bg-black/50 text-2xl text-white backdrop-blur transition-transform group-hover:scale-110">
          ▶
        </span>
      </span>
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-left">
        <span className="block text-[11px] font-medium uppercase tracking-widest text-white/70">
          Watch{minutes ? ` · ${minutes} min` : ""}
        </span>
        <span className="mt-0.5 block font-semibold text-white">{title}</span>
      </span>
    </button>
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
        <span className="text-bug" aria-hidden>
          🧠
        </span>
        <span>Quick check</span>
      </div>
      <p className="mb-3 mt-3 text-[15px] font-medium text-foreground">{question}</p>
      <div className="flex flex-col gap-2">
        {options.map((opt, i) => {
          const state = !done ? "" : i === answer ? "correct" : i === picked ? "wrong" : "";
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
          className={`mt-3 rounded-xl border px-3.5 py-3 text-sm ${correct ? "border-emerald-400/30 bg-emerald-400/10 text-success-text" : "border-bug/30 bg-bug/10 text-warning-text"}`}
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
          <span aria-hidden>🃏</span>
          <span>Flashcards</span>
        </span>
        <span className="text-xs text-muted-foreground">
          {i + 1} / {cards.length}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-28 w-full items-center justify-center rounded-xl border border-border bg-background px-5 py-6 text-center text-[15px] text-foreground transition-colors hover:border-accent/40"
      >
        {flipped ? (
          <span className="text-muted-foreground">{card.back}</span>
        ) : (
          <span className="font-semibold">{card.front}</span>
        )}
      </button>
      <div className="mt-3 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => go(-1)}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Prev
        </button>
        <span className="text-xs text-muted-foreground">
          {flipped ? "Showing answer" : "Tap card to flip"}
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          className="text-muted-foreground hover:text-foreground"
        >
          Next →
        </button>
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

/* ── Complete: mark done + XP burst — optimistic local save, honest indicator ─*/
export function Complete({ xp = 10 }: { xp?: number }) {
  const { slug, initialDone } = useNoteProgress();
  const hydrated = useHydrated();
  const [done, setDone] = useState(initialDone);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const btnRef = useRef<HTMLButtonElement>(null);
  const draftKey = `note-complete:${slug}`;
  const controllerRef = useRef<ReturnType<typeof createAutosave> | null>(null);

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

  // Built once on mount, never during render — its closures read `btnRef`
  // (via burst()) and refs may only be touched outside render.
  useEffect(() => {
    controllerRef.current = createAutosave({
      persistLocal: () => putPendingSave(draftKey, { slug }),
      // `keepalive` lets this request survive a hard nav/reload that follows
      // the optimistic click within milliseconds — a plain server-action
      // fetch would be aborted along with the unloading document.
      sync: async () => {
        const res = await fetch("/api/notes/complete", {
          method: "POST",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ noteSlug: slug }),
        });
        if (!res.ok) throw new Error("Failed to complete note");
        const data = (await res.json()) as { alreadyDone: boolean };
        if (!data.alreadyDone) burst();
        await deletePendingSave(draftKey);
      },
      onStatusChange: setStatus,
    });
    return () => controllerRef.current?.dispose();
  }, [draftKey, slug]);

  // A completion click whose sync() never landed (reload after a network
  // drop mid-request) leaves a pending marker in IndexedDB — resume it once
  // hydrated. completeNote is idempotent, so resuming an already-landed
  // completion is harmless.
  useEffect(() => {
    if (!hydrated || done) return;
    let cancelled = false;
    void (async () => {
      const pending = await getPendingSave<{ slug: string }>(draftKey);
      if (cancelled || !pending) return;
      setDone(true);
      controllerRef.current?.run();
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, done, draftKey]);

  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    function onOnline() {
      if (statusRef.current === "error") controllerRef.current?.retry();
    }
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  return (
    <div className="my-10 text-center">
      <button
        ref={btnRef}
        type="button"
        disabled={!hydrated || done}
        onClick={() => {
          if (!hydrated || done) return;
          // Optimistic: the click IS the edit — mark it done locally right
          // away, then let the controller persist + sync in the background.
          setDone(true);
          controllerRef.current?.run();
        }}
        className={`rounded-2xl px-8 py-3.5 text-base font-bold transition disabled:opacity-70 ${done ? "cursor-default border border-accent/40 bg-surface text-accent" : "bg-accent text-accent-foreground hover:brightness-105"}`}
      >
        {done ? `✓ Completed · +${xp} XP earned` : `Mark complete · +${xp} XP`}
      </button>
      {done && status !== "idle" && (
        <div className="mt-2">
          <SaveIndicator status={status} onRetry={() => controllerRef.current?.retry()} />
        </div>
      )}
    </div>
  );
}

/* ── Mentor sections: the "senior QA in your pocket" anatomy ────────────────*/

/** 🔧 First time? Do this — exact steps, nothing assumed. */
export function FirstTime({
  title = "First time? Do this",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="my-7 rounded-2xl border border-accent/30 bg-surface p-5">
      <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-foreground">
        <span aria-hidden>🔧</span>
        <span>{title}</span>
      </h3>
      <div className="note-steps text-[15px] text-foreground/90">{children}</div>
    </section>
  );
}

/** ⚠️ When it breaks — accordion: tap the symptom, reveal the senior-QA fix. */
export function WhenItBreaks({ items }: { items: { symptom: string; fix: string }[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  return (
    <section className="my-7 rounded-2xl border border-bug/30 bg-surface p-5">
      <h3 className="mb-1 flex items-center gap-2 text-[15px] font-semibold text-foreground">
        <span aria-hidden>⚠️</span>
        <span>When it breaks</span>
      </h3>
      <p className="mb-3 text-sm text-muted-foreground">
        Tap a problem — first guess the fix yourself, then reveal what a senior would check.
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((it, i) => (
          <li key={i} className="overflow-hidden rounded-xl border border-border bg-background">
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-expanded={open.has(i)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[15px] font-medium text-foreground transition-colors hover:bg-surface"
            >
              <span>“{it.symptom}”</span>
              <span
                aria-hidden
                className={`shrink-0 text-muted-foreground transition-transform ${open.has(i) ? "rotate-180" : ""}`}
              >
                ▾
              </span>
            </button>
            {open.has(i) && (
              <p className="border-t border-border px-4 py-3 text-[15px] text-muted-foreground">
                <b className="text-accent">Fix: </b>
                {it.fix}
              </p>
            )}
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
        <span aria-hidden>🔎</span>
        <span>Where &amp; how to check</span>
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
        <span aria-hidden>🙋</span>
        <span>Stuck? How &amp; whom to ask</span>
      </h3>
      {children && <div className="text-[15px] text-foreground/90">{children}</div>}
      <Link
        href="/community/new"
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:brightness-105"
      >
        Ask the community →
      </Link>
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
        <span aria-hidden>🏆</span>
        <span>Your challenge</span>
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
        <span aria-hidden>🔗</span>
        <span>Best free resources</span>
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

/* ── WorkedExample: a real case, walked through start to verdict ────────────*/
export function WorkedExample({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="my-7 rounded-2xl border border-sky-400/30 bg-surface p-5">
      <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-foreground">
        <span aria-hidden>📋</span>
        <span>Worked example: {title}</span>
      </h3>
      <div className="note-steps text-[15px] text-foreground/90">{children}</div>
    </section>
  );
}

/* ── FlowAnimation: a diagram you can PLAY — staged flow with pulse + controls */
export function FlowAnimation({
  title,
  nodes,
  intervalMs = 1600,
}: {
  title: string;
  nodes: { label: string; desc: string }[];
  intervalMs?: number;
}) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    // Reduced motion: never auto-advance — Play degrades to a manual step.
    if (!playing || reduced.current) return;
    const t = setInterval(() => setActive((a) => (a + 1) % nodes.length), intervalMs);
    return () => clearInterval(t);
  }, [playing, nodes.length, intervalMs]);

  return (
    <div className="my-7 rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
          <span aria-hidden>📊</span>
          <span>{title}</span>
        </h3>
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (reduced.current) {
                setActive((a) => (a + 1) % nodes.length);
                return;
              }
              setPlaying((p) => !p);
            }}
            className="rounded-lg bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground"
          >
            {playing ? "⏸ Pause" : "▶ Play"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setActive((a) => (a + 1) % nodes.length);
            }}
            className="rounded-lg border border-border px-3 py-1 text-xs font-semibold text-foreground"
          >
            Step →
          </button>
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-1 sm:flex-row sm:items-center">
        {nodes.map((n, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setActive(i);
              }}
              className={`w-full rounded-xl border px-3 py-2.5 text-center text-sm font-medium transition-all duration-300 ${
                i === active
                  ? "scale-[1.04] border-accent bg-accent/15 text-foreground shadow-[0_0_16px_-4px_var(--accent)]"
                  : "border-border bg-background text-muted-foreground hover:border-accent/40"
              }`}
            >
              {n.label}
            </button>
            {i < nodes.length - 1 && (
              <span
                aria-hidden
                className={`shrink-0 rotate-90 text-lg transition-colors duration-300 sm:rotate-0 ${
                  i === active ? "text-accent" : "text-muted-foreground/40"
                }`}
              >
                ➜
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 min-h-14 rounded-xl border border-accent/25 bg-background px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-text">
          Stage {active + 1} of {nodes.length}
        </p>
        <p className="mt-1 text-sm text-foreground/90">{nodes[active].desc}</p>
      </div>
    </div>
  );
}

/* ── CodePlayground: runnable code via the platform's Wandbox runner ────────*/
export function CodePlayground({
  language = "python",
  title = "Try it — edit and run",
  code: initialCode,
}: {
  language?: string;
  title?: string;
  code: string;
}) {
  const [code, setCode] = useState(initialCode.trim());
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="my-7 rounded-2xl border border-accent/30 bg-surface p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
          <span aria-hidden>🎛</span>
          <span>{title}</span>
        </h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {language}
        </span>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        rows={Math.min(14, Math.max(5, code.split("\n").length + 1))}
        className="w-full resize-y rounded-xl border border-border bg-background p-3 font-mono text-[13px] leading-relaxed text-foreground outline-none focus:border-accent"
        aria-label="Editable code"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            start(async () => {
              try {
                const r = await runSimulatorCode(language, code);
                setOutput(r.console || "(no output)");
              } catch (e) {
                setError(e instanceof Error ? e.message : "Run failed — try again.");
              }
            });
          }}
          aria-busy={pending || undefined}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
        >
          {pending && <Spinner className="size-3.5" />}
          <span>{pending ? "Running…" : "▶ Run code"}</span>
        </button>
        <span className="text-xs text-muted-foreground">
          Runs on the real code runner — edit anything and rerun.
        </span>
      </div>
      {error && (
        <p className="mt-3 rounded-xl border border-bug/40 bg-bug/10 px-3 py-2 text-sm text-foreground">
          {error}
        </p>
      )}
      {output !== null && !error && (
        <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-background p-3 font-mono text-[13px] text-foreground/90">
          {output}
        </pre>
      )}
    </div>
  );
}

/* ── Image credit line (CC attribution) ─────────────────────────────────────*/
function Credit({ credit, creditHref }: { credit?: string; creditHref?: string }) {
  if (!credit) return null;
  return (
    <p className="mt-2 text-right text-xs text-muted-foreground">
      {creditHref ? (
        <a
          href={creditHref}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          {credit}
        </a>
      ) : (
        credit
      )}
    </p>
  );
}

/* ── HotspotImage: a photo with tappable pins — the walk-around explorer ────*/
export function HotspotImage({
  src,
  alt,
  credit,
  creditHref,
  pins,
}: {
  src: string;
  alt: string;
  credit?: string;
  creditHref?: string;
  pins: { x: number; y: number; label: string; desc: string }[];
}) {
  const [active, setActive] = useState<number | null>(null);
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const open = (i: number) => {
    setActive((a) => (a === i ? null : i));
    setSeen((s) => new Set(s).add(i));
  };
  const done = seen.size === pins.length;

  return (
    <div className="my-7 rounded-2xl border border-border bg-surface p-4">
      <div className="relative overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element -- external thumbnail CDN, not an optimizable local asset */}
        <img src={src} alt={alt} loading="lazy" className="w-full" />
        {pins.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => open(i)}
            aria-label={`Explore: ${p.label}`}
            className={`absolute grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 text-xs font-bold shadow-md transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              seen.has(i)
                ? "border-accent bg-accent text-accent-foreground"
                : "hotspot-pulse border-white/90 bg-bug text-black"
            }`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            {seen.has(i) ? "✓" : i + 1}
          </button>
        ))}
      </div>
      {active !== null ? (
        <div className="mt-3 rounded-xl border border-accent/30 bg-background px-4 py-3">
          <p className="text-sm font-semibold text-foreground">{pins[active].label}</p>
          <p className="mt-1 text-sm text-muted-foreground">{pins[active].desc}</p>
        </div>
      ) : (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          👆 Tap each numbered dot to explore the parts
        </p>
      )}
      <p
        className={`mt-2 text-center text-xs font-medium ${done ? "text-accent-text" : "text-muted-foreground"}`}
      >
        {done ? "✓ All parts explored!" : `Explored ${seen.size} / ${pins.length}`}
      </p>
      <Credit credit={credit} creditHref={creditHref} />
    </div>
  );
}

/* ── PartsQuest: numbered diagram + click-the-legend part hunt ──────────────*/
export function PartsQuest({
  src,
  alt,
  credit,
  creditHref,
  parts,
}: {
  src: string;
  alt: string;
  credit?: string;
  creditHref?: string;
  parts: { name: string; desc: string }[];
}) {
  const [active, setActive] = useState<number | null>(null);
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const done = seen.size === parts.length;

  return (
    <div className="my-7 rounded-2xl border border-border bg-surface p-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- external thumbnail CDN, not an optimizable local asset */}
      <img src={src} alt={alt} loading="lazy" className="w-full rounded-xl bg-white p-2" />
      <p className="mt-3 text-center text-sm text-muted-foreground">
        {done
          ? "🏅 You met every part — nicely done!"
          : "👇 Tap a number to meet that part — can you collect all of them?"}
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {parts.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setActive((a) => (a === i ? null : i));
              setSeen((s) => new Set(s).add(i));
            }}
            className={`grid size-8 place-items-center rounded-full border text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              active === i
                ? "border-accent bg-accent text-accent-foreground"
                : seen.has(i)
                  ? "border-accent/50 bg-accent/15 text-accent"
                  : "border-border bg-background text-foreground hover:border-accent/50"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      {active !== null && (
        <div className="mt-3 rounded-xl border border-accent/30 bg-background px-4 py-3">
          <p className="text-sm font-semibold text-foreground">
            {active + 1}. {parts[active].name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{parts[active].desc}</p>
        </div>
      )}
      <p
        className={`mt-2 text-center text-xs font-medium ${done ? "text-accent-text" : "text-muted-foreground"}`}
      >
        {seen.size} / {parts.length} parts met
      </p>
      <Credit credit={credit} creditHref={creditHref} />
    </div>
  );
}

/* ── StepChecklist: interactive check-off steps with progress ───────────────*/
export function StepChecklist({ steps }: { steps: { text: string; detail?: string }[] }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setChecked((s) => {
      const n = new Set(s);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  const pct = Math.round((checked.size / steps.length) * 100);

  return (
    <div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="flex flex-col gap-2">
        {steps.map((s, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => toggle(i)}
              className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                checked.has(i)
                  ? "border-accent/40 bg-accent/10"
                  : "border-border bg-background hover:border-accent/40"
              }`}
            >
              <span
                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-xs font-bold ${
                  checked.has(i)
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {checked.has(i) ? "✓" : i + 1}
              </span>
              <span>
                <span
                  className={`block text-[15px] ${checked.has(i) ? "text-muted-foreground line-through" : "text-foreground"}`}
                >
                  {s.text}
                </span>
                {s.detail && (
                  <span className="mt-0.5 block text-sm text-muted-foreground">{s.detail}</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <p
        className={`mt-2 text-center text-xs font-medium ${pct === 100 ? "text-accent-text" : "text-muted-foreground"}`}
      >
        {pct === 100
          ? "✓ Mission complete — you know your machine!"
          : `${checked.size} / ${steps.length} done`}
      </p>
    </div>
  );
}

/* NOTE: no aggregate map export — the notes topic page imports each component
 * by name and builds the map server-side; an object exported from this client
 * module loses members when spread across the RSC boundary. */
