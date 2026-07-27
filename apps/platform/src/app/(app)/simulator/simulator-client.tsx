"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Button, Skeleton } from "@qa-mastery/ui";
import { SIMULATOR_LANGUAGES, findSimulatorLanguage, type RunResult } from "@qa-mastery/grading";
import { runSimulatorCode } from "./actions";
import { usePointerFine } from "@/hooks/use-pointer-fine";

// Monaco can't SSR (needs window), and it's heavy + touch-hostile — only
// load it for fine-pointer (mouse/trackpad) devices. Touch devices get a
// plain textarea below instead; both feed the same `code` state into the
// same RunnerProvider seam, so grading is identical.
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <Skeleton className="h-[420px] w-full rounded-xl" />,
});

const DEFAULT_LANG = "java";

export function SimulatorClient() {
  const { resolvedTheme } = useTheme();
  const pointerFine = usePointerFine();
  const [langId, setLangId] = useState(DEFAULT_LANG);
  const lang = findSimulatorLanguage(langId)!;
  const [code, setCode] = useState(lang.starter);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchLanguage(next: string) {
    const nextLang = findSimulatorLanguage(next);
    if (!nextLang) return;
    // Only replace the buffer if it's still the previous starter (don't clobber
    // the learner's edits).
    setCode((cur) => (cur.trim() === lang.starter.trim() ? nextLang.starter : cur));
    setLangId(next);
  }

  async function run() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      setResult(await runSimulatorCode(langId, code));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not run your code");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground" htmlFor="sim-lang">
            Language
          </label>
          <select
            id="sim-lang"
            data-testid="simulator-language"
            value={langId}
            onChange={(e) => switchLanguage(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground outline-none focus:border-accent"
          >
            {SIMULATOR_LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
          <Button onClick={run} loading={running} data-testid="simulator-run" className="ml-auto">
            {running ? "Running…" : "Run ▸"}
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          {pointerFine ? (
            <MonacoEditor
              height="420px"
              language={lang.monaco}
              theme={resolvedTheme === "light" ? "light" : "vs-dark"}
              value={code}
              onChange={(v) => setCode(v ?? "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          ) : (
            <textarea
              data-testid="simulator-editor-fallback"
              aria-label="Code editor"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-[420px] w-full resize-none bg-surface p-4 font-mono text-sm text-foreground outline-none"
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">Output</p>
        <pre
          data-testid="simulator-output"
          className={`min-h-[420px] overflow-auto rounded-xl border border-border bg-surface p-4 text-sm ${
            result && !result.passed ? "text-danger-text" : "text-foreground"
          }`}
        >
          {error ? error : result ? result.console : "Run your code to see output here."}
        </pre>
      </div>
    </div>
  );
}
