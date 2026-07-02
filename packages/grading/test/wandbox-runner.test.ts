import { afterEach, describe, expect, it, vi } from "vitest";
import { WandboxRunner } from "../src/wandbox-runner";
import { normalizeSource } from "../src/simulator-languages";

const req = (language: string, code: string) => ({
  lessonSlug: "simulator",
  userId: "u1",
  payload: { code, language },
});

function mockWandbox(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

describe("normalizeSource", () => {
  it("strips public from a top-level Java class", () => {
    const out = normalizeSource("public class Main {}", "java-strip-public");
    expect(out).toBe("class Main {}");
  });

  it("leaves non-Java sources untouched", () => {
    expect(normalizeSource("print(1)", null)).toBe("print(1)");
  });
});

describe("WandboxRunner.executeSync", () => {
  afterEach(() => vi.restoreAllMocks());

  it("maps status 0 to a pass with program output", async () => {
    vi.stubGlobal("fetch", mockWandbox({ status: "0", program_output: "hi\n" }));
    const r = await new WandboxRunner().executeSync(req("python", 'print("hi")'));
    expect(r.passed).toBe(true);
    expect(r.status).toBe("passed");
    expect(r.console).toBe("hi");
  });

  it("surfaces a compile error when the build fails with no output", async () => {
    vi.stubGlobal(
      "fetch",
      mockWandbox({ status: "1", compiler_error: "prog.java:1: error: ;" }),
    );
    const r = await new WandboxRunner().executeSync(req("java", "public class Main {"));
    expect(r.passed).toBe(false);
    expect(r.console).toContain("error");
  });

  it("normalizes Java before sending it to Wandbox", async () => {
    const fetchMock = mockWandbox({ status: "0", program_output: "ok" });
    vi.stubGlobal("fetch", fetchMock);
    await new WandboxRunner().executeSync(req("java", "public class Main {}"));
    const sentBody = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(sentBody.code).toBe("class Main {}");
    expect(sentBody.compiler).toContain("openjdk");
  });

  it("rejects an unknown language without calling the network", async () => {
    const fetchMock = mockWandbox({});
    vi.stubGlobal("fetch", fetchMock);
    const r = await new WandboxRunner().executeSync(req("cobol", "x"));
    expect(r.status).toBe("error");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports a rate limit as unavailable", async () => {
    vi.stubGlobal("fetch", mockWandbox({}, 429));
    const r = await new WandboxRunner().executeSync(req("python", "print(1)"));
    expect(r.status).toBe("unavailable");
  });
});
