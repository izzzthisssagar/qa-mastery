import { exec } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import os from "node:os";
import type { RunnerProvider, RunRequest, RunResult, RunStatus } from "./runner";

const execAsync = promisify(exec);

export class DockerPlaywrightRunner implements RunnerProvider {
  readonly name = "docker-playwright";
  
  private static results = new Map<string, RunResult>();

  async submit(req: RunRequest): Promise<{ runId: string }> {
    const runId = randomUUID();
    // OS temp dir — process.cwd() (/var/task) is read-only on serverless.
    const tmpDir = join(os.tmpdir(), "sandbox-docker", runId);

    // Create an isolated directory for this run
    await mkdir(tmpDir, { recursive: true });

    // Write the student's code to a spec file
    const testFile = join(tmpDir, "student.spec.ts");
    await writeFile(testFile, req.payload.code as string, "utf-8");

    // Write a generic Playwright config into the same dir
    const configFile = join(tmpDir, "playwright.config.ts");
    await writeFile(
      configFile,
      `
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  use: {
    headless: true,
  },
});
`
    );

    // Fire and forget the container execution
    this.executeInContainer(runId, tmpDir, req.lessonSlug).catch(console.error);

    return { runId };
  }

  private async executeInContainer(runId: string, tmpDir: string, lessonSlug: string) {
    DockerPlaywrightRunner.results.set(runId, {
      status: "running",
      passed: false,
      console: "Pulling sandbox image... (this may take a few minutes the first time)\n",
      artifacts: [],
      staticChecks: [],
    });

    try {
      const isMac = process.platform === "darwin";
      const networkArg = isMac ? "" : "--network=host";
      
      const cmd = `docker run --rm -v "${tmpDir}:/tests" -w /tests ${networkArg} mcr.microsoft.com/playwright:v1.40.0-jammy npx playwright test student.spec.ts -c playwright.config.ts`;

      const { stdout, stderr } = await execAsync(cmd, {
        timeout: 60000, // 60 seconds
        env: { ...process.env, CI: "true" }
      });

      DockerPlaywrightRunner.results.set(runId, {
        status: "passed",
        passed: true,
        console: stdout + "\n" + stderr,
        artifacts: [],
        staticChecks: [],
      });
    } catch (err: any) {
      const consoleOutput = err.stdout ? err.stdout : (err.stderr ? err.stderr : err.message);
      DockerPlaywrightRunner.results.set(runId, {
        status: "failed",
        passed: false,
        console: consoleOutput,
        artifacts: [],
        staticChecks: [],
      });
    } finally {
      // Cleanup the temporary directory after execution
      await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  async getResult(runId: string): Promise<RunResult> {
    const result = DockerPlaywrightRunner.results.get(runId);
    
    if (!result) {
      return { status: "error", passed: false, console: "Run not found", artifacts: [], staticChecks: [] };
    }
    
    return result;
  }
}
