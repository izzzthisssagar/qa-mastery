"use client";

import { useRef, useState } from "react";
import { useLessonProgress } from "./progress-context";

/**
 * Locator Lab — a safe, infra-free "code runner" for the single most-practiced
 * Selenium skill: writing a locator that matches exactly the right elements.
 *
 * The learner types a CSS selector (or an XPath) and we run it live, in the
 * browser, against a fixed fragment rendered below — `querySelectorAll` for
 * CSS and `document.evaluate` for XPath, both scoped to the stage node. We
 * highlight what matched and grade the match set against the challenge target.
 * No code is executed and nothing reaches the server: it's pure DOM querying,
 * which is exactly what a `By` locator does under the hood.
 */

type Mode = "css" | "xpath";

interface Challenge {
  prompt: string;
  /** Canonical CSS selector that defines the target element set. */
  target: string;
  /** A worked answer revealed on demand. */
  reveal: string;
}

const CHALLENGES: Challenge[] = [
  {
    prompt: "Match the Sign in button — and nothing else (1 element).",
    target: "#login-btn",
    reveal: "CSS: #login-btn   ·   XPath: //button[@id='login-btn']",
  },
  {
    prompt: "Match every navigation link (3 elements).",
    target: "nav a",
    reveal: "CSS: nav a   ·   XPath: //nav//a",
  },
  {
    prompt: "Match the email field by its name attribute (1 element).",
    target: "input[name='email']",
    reveal: "CSS: input[name='email']   ·   XPath: //input[@name='email']",
  },
  {
    prompt: "Match both text inputs inside the form (2 elements).",
    target: "form input",
    reveal: "CSS: form input   ·   XPath: //form//input",
  },
];

const RING = "lab-locator-hit";

export function LocatorLab() {
  const { markStep } = useLessonProgress();
  const stageRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("css");
  const [value, setValue] = useState("");
  const [result, setResult] = useState<{
    matched: number;
    target: number;
    ok: boolean;
    error?: string;
  } | null>(null);
  const [showReveal, setShowReveal] = useState(false);

  const challenge = CHALLENGES[index];

  function clearHighlights(stage: HTMLElement) {
    stage.querySelectorAll(`.${RING}`).forEach((el) => el.classList.remove(RING));
  }

  function run() {
    const stage = stageRef.current;
    if (!stage) return;
    clearHighlights(stage);

    const query = value.trim();
    if (!query) {
      setResult({ matched: 0, target: 0, ok: false, error: "Type a locator first." });
      return;
    }

    let matched: Element[] = [];
    try {
      if (mode === "css") {
        matched = Array.from(stage.querySelectorAll(query));
      } else {
        const snapshot = document.evaluate(
          query,
          stage,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null,
        );
        for (let i = 0; i < snapshot.snapshotLength; i++) {
          const node = snapshot.snapshotItem(i);
          // Keep only nodes inside the stage — an absolute //… can escape it.
          if (node instanceof Element && stage.contains(node) && node !== stage) {
            matched.push(node);
          }
        }
      }
    } catch {
      setResult({
        matched: 0,
        target: 0,
        ok: false,
        error: `That isn't a valid ${mode === "css" ? "CSS selector" : "XPath expression"}.`,
      });
      return;
    }

    const targetNodes = new Set(stage.querySelectorAll(challenge.target));
    const ok =
      matched.length === targetNodes.size &&
      matched.length > 0 &&
      matched.every((el) => targetNodes.has(el));

    matched.forEach((el) => el.classList.add(RING));
    setResult({ matched: matched.length, target: targetNodes.size, ok });

    // Mark the "Try it" progress step when the learner passes the last challenge.
    if (ok && index === CHALLENGES.length - 1) {
      markStep("try");
    }
  }

  function go(next: number) {
    const stage = stageRef.current;
    if (stage) clearHighlights(stage);
    setIndex(next);
    setValue("");
    setResult(null);
    setShowReveal(false);
  }

  return (
    <div
      data-testid="locator-lab"
      className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40"
    >
      <style>{`.${RING}{outline:2px solid var(--color-accent);outline-offset:2px;border-radius:3px;}`}</style>

      <div className="border-b border-zinc-800 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Locator Lab · challenge {index + 1} / {CHALLENGES.length}
          </p>
          <div
            role="group"
            aria-label="Locator language"
            className="flex gap-1 rounded-lg bg-zinc-800 p-0.5 text-xs"
          >
            {(["css", "xpath"] as const).map((m) => (
              <button
                key={m}
                type="button"
                data-testid={`locator-mode-${m}`}
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={`rounded-md px-2.5 py-1 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  mode === m ? "bg-accent text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {m === "css" ? "CSS" : "XPath"}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-sm text-zinc-300" data-testid="locator-prompt">
          {challenge.prompt}
        </p>
      </div>

      {/* The page under test — real DOM, queried by ref. */}
      <div className="px-5 py-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Page under test
        </p>
        <div
          ref={stageRef}
          className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300"
        >
          <nav className="flex gap-4 border-b border-zinc-800 pb-3 text-zinc-400">
            <a href="#home" className="hover:text-accent">
              Home
            </a>
            <a href="#products" className="hover:text-accent">
              Products
            </a>
            <a href="#cart" className="hover:text-accent">
              Cart
            </a>
          </nav>
          <form id="login" className="mt-3 space-y-2">
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              readOnly
              className="block w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-300"
            />
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              readOnly
              className="block w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-300"
            />
            <button
              id="login-btn"
              type="button"
              className="rounded bg-accent px-3 py-1 font-medium text-zinc-950"
            >
              Sign in
            </button>
          </form>
          <p className="mt-3 text-xs text-zinc-500">Forgot password?</p>
        </div>
      </div>

      <div className="border-t border-zinc-800 px-5 py-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            data-testid="locator-input"
            aria-label="Locator (CSS selector or XPath)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run();
            }}
            placeholder={mode === "css" ? "e.g. nav a" : "e.g. //nav//a"}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-accent outline-none focus:border-accent"
          />
          <button
            type="button"
            data-testid="locator-run"
            onClick={run}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Run locator
          </button>
        </div>

        {result && (
          <div
            data-testid="locator-result"
            role="status"
            aria-live="polite"
            className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
              result.error
                ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                : result.ok
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-zinc-700 bg-zinc-800/50 text-zinc-300"
            }`}
          >
            {result.error ? (
              result.error
            ) : result.ok ? (
              <span data-testid="locator-pass">
                Matched {result.matched} element{result.matched === 1 ? "" : "s"} — exactly the
                target. Clean locator.
              </span>
            ) : result.matched === result.target ? (
              <>
                Matched {result.matched} — the right count, but not the target element
                {result.target === 1 ? "" : "s"}. Check the highlights.
              </>
            ) : (
              <>
                Matched {result.matched}, need {result.target}.{" "}
                {result.matched > result.target
                  ? "Too broad — tighten it."
                  : "Too narrow — widen it."}
              </>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-xs">
          <button
            type="button"
            data-testid="locator-reveal"
            onClick={() => setShowReveal((s) => !s)}
            className="text-zinc-400 underline underline-offset-2 hover:text-zinc-200"
          >
            {showReveal ? "Hide answer" : "Show answer"}
          </button>
          {result?.ok && index < CHALLENGES.length - 1 && (
            <button
              type="button"
              data-testid="locator-next"
              onClick={() => go(index + 1)}
              className="font-semibold text-accent hover:text-accent/80"
            >
              Next challenge →
            </button>
          )}
        </div>
        {showReveal && (
          <p className="mt-2 font-mono text-xs text-zinc-400" data-testid="locator-answer">
            {challenge.reveal}
          </p>
        )}
      </div>
    </div>
  );
}
