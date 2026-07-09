import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/llm/adapter", () => ({ chat: vi.fn() }));

import { chat } from "../src/llm/adapter";
import { classifyInScope } from "../src/scope";

const chatMock = vi.mocked(chat);

beforeEach(() => {
  chatMock.mockReset();
});

describe("classifyInScope", () => {
  it("IN verdict → in scope", async () => {
    chatMock.mockResolvedValue("IN");
    await expect(classifyInScope("what is boundary value analysis?")).resolves.toBe(true);
  });

  it("OUT verdict → out of scope", async () => {
    chatMock.mockResolvedValue("OUT");
    await expect(classifyInScope("write my history essay")).resolves.toBe(false);
  });

  it("verdict casing/whitespace is tolerated", async () => {
    chatMock.mockResolvedValue("  out \n");
    await expect(classifyInScope("do my taxes")).resolves.toBe(false);
  });

  it("an unexpected verdict fails OPEN (never blocks a legit question)", async () => {
    chatMock.mockResolvedValue("MAYBE?");
    await expect(classifyInScope("is this about testing?")).resolves.toBe(true);
  });

  it("a provider error fails OPEN", async () => {
    chatMock.mockRejectedValue(new Error("provider down"));
    await expect(classifyInScope("what is a test plan?")).resolves.toBe(true);
  });

  it("trivial messages skip the classifier call entirely", async () => {
    await expect(classifyInScope(" a ")).resolves.toBe(true);
    expect(chatMock).not.toHaveBeenCalled();
  });

  it("long messages are truncated to 1000 chars before classification", async () => {
    chatMock.mockResolvedValue("IN");
    await classifyInScope("x".repeat(5000));
    const sent = chatMock.mock.calls[0][0];
    const userMsg = sent.find((m) => m.role === "user")!;
    expect(userMsg.content.length).toBe(1000);
  });
});
