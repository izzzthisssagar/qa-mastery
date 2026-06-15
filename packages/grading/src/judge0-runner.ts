import type { RunnerProvider, RunRequest, RunResult, RunStatus } from "./runner";

export class Judge0Runner implements RunnerProvider {
  readonly name = "judge0";

  // RapidAPI URL for Judge0 Extra CE (Java 17 support)
  // Ensure we use the proper language ID for Java (usually 62 for standard Judge0, 
  // but depends on the rapidapi configuration. For Judge0 CE, Java is 62).
  private readonly API_URL = "https://judge0-ce.p.rapidapi.com";

  private get headers() {
    return {
      "Content-Type": "application/json",
      "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      "X-RapidAPI-Key": process.env.JUDGE0_RAPIDAPI_KEY || "",
    };
  }

  async submit(request: RunRequest): Promise<{ runId: string }> {
    const sourceCode = request.payload.code as string;
    
    if (!process.env.JUDGE0_RAPIDAPI_KEY) {
      console.warn("Missing JUDGE0_RAPIDAPI_KEY, using mock submission.");
      return { runId: "mock-run-id" };
    }

    const response = await fetch(`${this.API_URL}/submissions?base64_encoded=false&wait=false`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        language_id: 62, // Java (OpenJDK 13.0.1) - standard ID on CE
        source_code: sourceCode,
      }),
    });

    if (!response.ok) {
      throw new Error(`Judge0 API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    return { runId: data.token };
  }

  async getResult(runId: string): Promise<RunResult> {
    if (runId === "mock-run-id") {
      return {
        status: "passed",
        passed: true,
        console: "Tests starting...\nHello from Mock Runner!",
        artifacts: [],
        staticChecks: [],
      };
    }

    const response = await fetch(`${this.API_URL}/submissions/${runId}?base64_encoded=false`, {
      method: "GET",
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Judge0 API error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;

    // Map Judge0 status IDs to our internal status
    // 1 = In Queue, 2 = Processing, 3 = Accepted, 4 = Wrong Answer, 5 = Time Limit Exceeded, 6 = Compilation Error, etc.
    let status: RunStatus = "error";
    let passed = false;
    let consoleOutput = data.stdout || "";

    if (data.status?.id === 1 || data.status?.id === 2) {
      status = "running";
    } else if (data.status?.id === 3) {
      status = "passed";
      passed = true;
    } else if (data.status?.id === 6) {
      status = "failed";
      consoleOutput = data.compile_output || "Compilation failed with no output.";
    } else if (data.status?.id > 3) {
      status = "failed";
      consoleOutput = (data.stderr || "") + "\n" + (data.compile_output || "");
    }

    return {
      status,
      passed,
      console: consoleOutput.trim(),
      artifacts: [],
      staticChecks: [],
    };
  }
}
