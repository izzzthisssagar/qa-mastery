"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "@/components/motion";

type Card = {
  no: string;
  slug: string;
  title: string;
  teaser: string;
};

// A spine across the real 48-module arc, zero to job-ready — slugs, titles,
// and teasers pulled straight from packages/curriculum/src/notes/taxonomy.ts.
const CARDS: Card[] = [
  { no: "01", slug: "how-a-computer-works", title: "How a computer works", teaser: "Absolute zero — the physical parts, and how software comes alive on them." },
  { no: "06", slug: "digital-literacy-and-safety", title: "Digital literacy & safety", teaser: "Accounts, passwords, phishing — the unglamorous skills that decide trust." },
  { no: "11", slug: "programming-basics", title: "Programming basics", teaser: "The logic a tester needs before automating — Java and Python side by side." },
  { no: "12", slug: "qa-foundations", title: "QA foundations", teaser: "How professional testing thinks — what QA is, and where it fits." },
  { no: "18", slug: "testers-toolbox", title: "The Tester's Toolbox", teaser: "The free extensions and tools that separate a pro from a beginner." },
  { no: "20", slug: "api-testing-fundamentals", title: "API testing fundamentals", teaser: "Reading HTTP itself, the status-code vocabulary, driving requests by hand." },
  { no: "24", slug: "playwright", title: "Playwright", teaser: "Auto-waiting instead of sleeps, resilient locators, first-class traces." },
  { no: "31", slug: "sql-and-databases-for-testers", title: "SQL & databases for testers", teaser: "Verifying data is daily manual-QA work — before any automation exists." },
  { no: "37", slug: "performance-testing", title: "Performance testing", teaser: "Load, stress, and soak — the metrics that reveal how a system behaves." },
  { no: "38", slug: "security-testing-web", title: "Security testing — web", teaser: "Authorization-bounded testing across OWASP risks, hands-on." },
  { no: "44", slug: "ai-and-the-modern-tester", title: "AI & the modern tester", teaser: "Using AI critically, automating with it, and building judgment that lasts." },
  { no: "48", slug: "your-first-90-days", title: "Your first 90 days", teaser: "Onboarding, solo-QA constraints, and picking a specialization on purpose." },
];

/**
 * A horizontally-scrolling "card catalog" of the notes wiki — index cards
 * alternate a faint tilt (straightens on hover/focus) so it reads as a real
 * drawer of references, not a carousel. Edge-masked so cards visibly
 * continue off-screen in both directions. Each card is a real link into
 * /notes/[module] — auth-gated, same as clicking through from the wiki index.
 */
export function NotesShelf() {
  const reduce = useReducedMotion();

  return (
    <div
      className="-mx-6 overflow-x-auto pb-4 pt-2 [&::-webkit-scrollbar]:hidden sm:-mx-10"
      style={{
        scrollbarWidth: "none",
        maskImage:
          "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)",
      }}
    >
      <div className="flex w-max gap-4 px-6 sm:px-10">
        {CARDS.map((c, i) => (
          <motion.div
            key={c.no}
            initial={reduce ? false : { rotate: i % 2 === 0 ? -1.5 : 1.5 }}
            whileHover={{ rotate: 0, y: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-[240px] shrink-0"
          >
            <Link
              href={`/notes/${c.slug}`}
              className="block h-full rounded-lg border border-dashed border-border bg-surface/40 p-5 outline-none transition-colors hover:border-accent/40 hover:bg-surface/60 focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-accent/70">
                Module {c.no} / 48
              </span>
              <h3 className="font-display mt-2.5 text-[15px] font-bold leading-snug text-foreground">
                {c.title}
              </h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{c.teaser}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
