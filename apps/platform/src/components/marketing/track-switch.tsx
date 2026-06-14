"use client";

import { useState } from "react";
import { motion } from "@/components/motion";

type Track = {
  id: "manual" | "automation";
  tag: string;
  title: string;
  blurb: string;
  steps: string[];
};

const TRACKS: Track[] = [
  {
    id: "manual",
    tag: "Track A",
    title: "Manual testing",
    blurb:
      "Read a spec, write the cases, find what breaks. You learn to think like a tester before you automate one.",
    steps: [
      "Test design — boundaries, equivalence, exploratory charters",
      "File reports the way a real team triages them",
      "Hunt seeded bugs in BuggyShop and get graded on each",
    ],
  },
  {
    id: "automation",
    tag: "Track B",
    title: "Automation",
    blurb:
      "Turn those cases into code. Selenium + Java, the Page Object Model, and a suite that runs in CI like a real job.",
    steps: [
      "WebDriver core, locators, and waits that don’t flake",
      "TestNG + Page Object Model on a real practice app",
      "Wire it into CI and read the report like a QA lead",
    ],
  },
];

/**
 * Two-track strip: pick Manual or Automation, the panel cross-fades. The whole
 * thing degrades to a static list under reduced motion (handled by Motion).
 */
export function TrackSwitch() {
  const [active, setActive] = useState<Track["id"]>("manual");
  const track = TRACKS.find((t) => t.id === active)!;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-2">
      <div
        role="tablist"
        aria-label="Learning tracks"
        className="relative flex rounded-xl bg-zinc-950/60 p-1"
      >
        {TRACKS.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setActive(t.id)}
              className="relative flex-1 rounded-lg px-4 py-2.5 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              {selected && (
                <motion.span
                  layoutId="track-pill"
                  className="absolute inset-0 rounded-lg bg-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span
                className={
                  selected
                    ? "relative z-10 text-zinc-950"
                    : "relative z-10 text-zinc-400 hover:text-zinc-200"
                }
              >
                <span className="mr-2 font-mono text-xs uppercase tracking-widest opacity-70">
                  {t.tag}
                </span>
                {t.title}
              </span>
            </button>
          );
        })}
      </div>

      <motion.div
        key={track.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="px-5 py-6"
      >
        <p className="max-w-xl text-base leading-7 text-zinc-300">
          {track.blurb}
        </p>
        <ul className="mt-5 space-y-3">
          {track.steps.map((s, i) => (
            <li key={s} className="flex items-start gap-3 text-sm text-zinc-400">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-accent/30 font-mono text-[11px] text-accent">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
