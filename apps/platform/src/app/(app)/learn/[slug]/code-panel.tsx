"use client";

import { useState } from "react";
import { Button } from "@qa-mastery/ui";
import { submitCodeLab, pollCodeRun } from "../actions";
import type { RunResult } from "@qa-mastery/grading";

export function CodeRunnerLab({ slug }: { slug: string }) {
  const [code, setCode] = useState(
    "public class Hello {\n    public static void main(String[] args) {\n        System.out.println(\"Tests starting...\");\n    }\n}"
  );
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-resize textarea and tab support
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      setCode(code.substring(0, start) + "    " + code.substring(end));
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  async function runCode() {
    setRunning(true);
    setResult(null);
    setError(null);
    try {
      const { runId } = await submitCodeLab(slug, code);
      
      let currentResult: RunResult | null = null;
      while (!currentResult || currentResult.status === "running" || currentResult.status === "queued") {
        await new Promise((r) => setTimeout(r, 1000));
        currentResult = await pollCodeRun(slug, runId);
        setResult(currentResult);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Code execution failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="my-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <p className="text-sm font-semibold text-zinc-100">Java Interactive Runner</p>
      <p className="mt-1 text-xs text-zinc-500 mb-4">
        Write your Java code below. It will be compiled and run against an OpenJDK sandbox.
      </p>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full min-h-64 bg-[#0d1117] border border-zinc-800 rounded-lg p-4 font-mono text-[13px] leading-relaxed text-zinc-300 focus:outline-none focus:border-accent"
        spellCheck={false}
        disabled={running}
      />

      <div className="mt-4 flex items-center justify-between">
        <Button onClick={runCode} disabled={running || !code.trim()} data-testid="run-code">
          {running ? "Running..." : "Run Code"}
        </Button>
        {result?.status === "passed" && <span className="text-xs font-semibold text-emerald-400">Execution completed</span>}
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-zinc-400 mb-1">Console Output:</p>
          <pre className={`w-full bg-black border ${result.passed ? 'border-zinc-800' : 'border-red-900/50'} rounded-lg p-4 font-mono text-xs text-zinc-300 overflow-auto whitespace-pre-wrap`}>
            {result.console || "No output."}
          </pre>
        </div>
      )}
    </section>
  );
}
