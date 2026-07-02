import type { RunnerProvider, RunRequest, RunResult } from "./runner";
import { findSimulatorLanguage, normalizeSource } from "./simulator-languages";

/**
 * Wandbox runner — executes code against the free public Wandbox API
 * (https://github.com/melpon/wandbox), our $0 replacement for Piston after the
 * public Piston API went whitelist-only (Feb 2026). Wandbox is a synchronous
 * request/response sandbox: no queue, no polling. So the real path is
 * `executeSync`; the submit/getResult pair exists only to satisfy
 * RunnerProvider and delegates to a tiny in-memory cache (fine because the
 * runner ladder always prefers executeSync when present).
 *
 * Override the endpoint with WANDBOX_URL to point at a self-hosted instance.
 */
export class WandboxRunner implements RunnerProvider {
  readonly name = "wandbox";

  private get baseUrl(): string {
    return process.env.WANDBOX_URL || "https://wandbox.org";
  }

  async executeSync(request: RunRequest): Promise<RunResult> {
    const code = String(request.payload.code ?? "");
    const langId = String(request.payload.language ?? "");
    const lang = findSimulatorLanguage(langId);
    if (!lang) {
      return {
        status: "error",
        passed: false,
        console: `Unsupported language: ${langId || "(none)"}.`,
        artifacts: [],
        staticChecks: [],
      };
    }

    const source = normalizeSource(code, lang.normalize);

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/compile.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compiler: lang.compiler, code: source }),
      });
    } catch {
      return {
        status: "unavailable",
        passed: false,
        console: "Could not reach the code runner. Try again in a moment.",
        artifacts: [],
        staticChecks: [],
      };
    }

    if (res.status === 429) {
      return {
        status: "unavailable",
        passed: false,
        console: "Rate limited by the shared code runner. Wait a few seconds and re-run.",
        artifacts: [],
        staticChecks: [],
      };
    }
    if (!res.ok) {
      return {
        status: "error",
        passed: false,
        console: `Runner error (HTTP ${res.status}).`,
        artifacts: [],
        staticChecks: [],
      };
    }

    const data = (await res.json()) as {
      status?: string;
      compiler_error?: string;
      program_output?: string;
      program_error?: string;
      program_message?: string;
    };

    // Wandbox: status "0" == the program ran and exited 0. A compiler_error with
    // no program output means the build failed — show that as the console.
    const exit = Number.parseInt(data.status ?? "0", 10);
    const passed = exit === 0;
    const runtimeOut = (
      data.program_message ??
      `${data.program_output ?? ""}${data.program_error ?? ""}`
    ).trim();
    const compileErr = (data.compiler_error ?? "").trim();

    if (!passed && !runtimeOut && compileErr) {
      return {
        status: "failed",
        passed: false,
        console: compileErr,
        artifacts: [],
        staticChecks: [],
      };
    }

    return {
      status: passed ? "passed" : "failed",
      passed,
      console:
        runtimeOut ||
        compileErr ||
        (passed ? "(no output)" : "Program exited with a non-zero status."),
      artifacts: [],
      staticChecks: [],
    };
  }

  // ── submit/getResult: best-effort in-memory shim (executeSync is preferred) ──
  private cache = new Map<string, RunResult>();

  async submit(request: RunRequest): Promise<{ runId: string }> {
    const result = await this.executeSync(request);
    const runId = `wandbox-${result.status}-${this.cache.size}`;
    this.cache.set(runId, result);
    return { runId };
  }

  async getResult(runId: string): Promise<RunResult> {
    return (
      this.cache.get(runId) ?? {
        status: "unavailable",
        passed: false,
        console: "Result expired — re-run the snippet.",
        artifacts: [],
        staticChecks: [],
      }
    );
  }
}
