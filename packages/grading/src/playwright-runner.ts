import { exec } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import os from "node:os";
import type { RunnerProvider, RunRequest, RunResult, RunStatus } from "./runner";

const execAsync = promisify(exec);

export class PlaywrightRunner implements RunnerProvider {
  readonly name = "playwright";

  // Temporary in-memory store for local sandbox results
  private static results = new Map<string, RunResult>();

  async submit(request: RunRequest): Promise<{ runId: string }> {
    const sourceCode = request.payload.code as string;
    const runId = randomUUID();

    // For local dev, we run it immediately in the background and store results in a global map.
    this.execute(runId, sourceCode).catch(console.error);

    return { runId };
  }

  private async execute(runId: string, code: string) {
    PlaywrightRunner.results.set(runId, {
      status: "running",
      passed: false,
      console: "Initializing Playwright Sandbox...\n",
      artifacts: [],
      staticChecks: [],
    });

    // Use the OS temp dir (writable on serverless, where process.cwd() =
    // /var/task is read-only and mkdir would throw EACCES).
    const tmpDir = join(os.tmpdir(), "sandbox-pw", runId);
    
    try {
      await mkdir(tmpDir, { recursive: true });
      const testFile = join(tmpDir, "student.spec.ts");
      const configFile = join(tmpDir, "playwright.config.ts");

      // We ensure the student code imports Playwright if they forgot, or we just run it as-is.
      await writeFile(testFile, code);
      
      await writeFile(configFile, `
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  timeout: 10000,
  use: { headless: true },
  reporter: 'list',
});
`);

      // Run playwright test on the temporary file, but execute from the current working directory
      // so it can resolve the locally installed @playwright/test dependency.
      const { stdout, stderr } = await execAsync(`npx playwright test "${testFile}" -c "${configFile}"`, {
        cwd: process.cwd(),
        timeout: 15000,
        env: { ...process.env, CI: "true" } // Force CI mode to avoid interactive prompts
      });

      PlaywrightRunner.results.set(runId, {
        status: "passed",
        passed: true,
        console: stdout,
        artifacts: [],
        staticChecks: [],
      });
    } catch (e: any) {
      // Playwright returns exit code 1 if tests fail, which throws an error in execAsync.
      // e.stdout contains the actual test output.
      const consoleOutput = e.stdout ? e.stdout : (e.stderr ? e.stderr : e.message);
      
      PlaywrightRunner.results.set(runId, {
        status: "failed",
        passed: false,
        console: consoleOutput,
        artifacts: [],
        staticChecks: [],
      });
    } finally {
      // Clean up the temporary directory
      try {
        await rm(tmpDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error("Cleanup failed:", cleanupError);
      }
    }
  }

  async getResult(runId: string): Promise<RunResult> {
    const res = PlaywrightRunner.results.get(runId);
    if (!res) {
      return {
        status: "error",
        passed: false,
        console: "Run not found or expired.",
        artifacts: [],
        staticChecks: [],
      };
    }
    return res;
  }
}
