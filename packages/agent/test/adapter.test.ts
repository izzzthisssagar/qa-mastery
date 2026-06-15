import { describe, expect, it } from "vitest";
import { resolveProvider } from "../src/llm/adapter";
import type { LlmEnv } from "../src/llm/types";

// No ollamaBaseUrl in these envs, so the Ollama health probe is skipped (no
// network) and resolution is deterministic.

describe("resolveProvider — free-first auto resolution", () => {
  it("prefers the free Gemini tier even when paid keys are also present", async () => {
    const env: LlmEnv = {
      geminiApiKey: "g",
      geminiModel: "gemini-2.0-flash",
      xaiApiKey: "x",
      xaiModel: "grok-2-latest",
      openaiApiKey: "o",
      openaiModel: "gpt-4o-mini",
    };
    expect((await resolveProvider(env)).name).toBe("gemini");
  });

  it("falls to free Groq when Gemini is absent", async () => {
    const env: LlmEnv = {
      groqApiKey: "gr",
      groqModel: "llama-3.3-70b-versatile",
      openaiApiKey: "o",
      openaiModel: "gpt-4o-mini",
    };
    expect((await resolveProvider(env)).name).toBe("groq");
  });

  it("uses a paid provider only when no free option is configured", async () => {
    const env: LlmEnv = { xaiApiKey: "x", xaiModel: "grok-2-latest" };
    expect((await resolveProvider(env)).name).toBe("xai");
  });

  it("throws when nothing is configured", async () => {
    await expect(resolveProvider({})).rejects.toThrow(/No LLM provider/);
  });
});

describe("resolveProvider — explicit selection", () => {
  it("honors an explicit paid provider", async () => {
    const env: LlmEnv = {
      provider: "openai",
      geminiApiKey: "g",
      geminiModel: "gemini-2.0-flash",
      openaiApiKey: "o",
      openaiModel: "gpt-4o-mini",
    };
    expect((await resolveProvider(env)).name).toBe("openai");
  });

  it("throws when the chosen provider lacks a key", async () => {
    await expect(resolveProvider({ provider: "xai" })).rejects.toThrow(/XAI_API_KEY/);
  });
});
