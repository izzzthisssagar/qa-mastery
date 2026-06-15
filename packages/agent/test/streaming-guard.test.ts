import { describe, expect, it } from "vitest";
import { guardedStream } from "../src/streaming-guard";

async function* from(chunks: string[]) {
  for (const c of chunks) yield c;
}

/** Drain the generator: join client-bound chunks and capture the return value. */
async function collect(gen: AsyncGenerator<string, string, unknown>) {
  const out: string[] = [];
  let res = await gen.next();
  while (!res.done) {
    out.push(res.value);
    res = await gen.next();
  }
  return { client: out.join(""), persisted: res.value };
}

describe("guardedStream", () => {
  it("passes a clean reply through and persists it verbatim", async () => {
    const r = await collect(guardedStream(from(["Think about ", "the boundaries."]), 2));
    expect(r.client).toBe("Think about the boundaries.");
    expect(r.persisted).toBe("Think about the boundaries.");
  });

  it("withholds a quiz-answer leak forming mid-stream (turn 1)", async () => {
    const r = await collect(guardedStream(from(["The correct ", "answer is option B."]), 1));
    expect(r.client).not.toMatch(/correct answer is/i);
    expect(r.persisted).not.toMatch(/option B/);
    expect(r.persisted).toMatch(/what have you tried/i); // safe fallback
  });

  it("flushes the clean prefix but holds back a forming manifest leak", async () => {
    const prefix = "Here is a hint about ranges. ".repeat(3); // long + clean
    const r = await collect(guardedStream(from([prefix, "matchedBugId BS-008"]), 3, 12));
    expect(r.client).toContain("hint about ranges"); // safe prefix reached the client
    expect(r.client).not.toContain("matchedBugId"); // the leak never did
    expect(r.persisted).not.toContain("matchedBugId");
  });

  it("catches a manifest leak confined to the held-back tail at stream end", async () => {
    const r = await collect(guardedStream(from(["See ", "title_internal here"]), 5));
    expect(r.client).not.toContain("title_internal");
    expect(r.persisted).not.toContain("title_internal");
  });
});
