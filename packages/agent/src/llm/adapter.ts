import { geminiChat, streamGeminiChat } from "./gemini";
import { groqChat, streamGroqChat } from "./groq";
import { ollamaChat, ollamaHealthy, streamOllamaChat } from "./ollama";
import { openAiChat, streamOpenAiChat } from "./openai";
import { xaiChat, streamXaiChat } from "./xai";
import { FREE_PROVIDERS, type ChatMessage, type LlmEnv, type ResolvedProvider } from "./types";

export function readLlmEnv(env: NodeJS.ProcessEnv = process.env): LlmEnv {
  return {
    provider: env.HELP_AGENT_PROVIDER,
    ollamaBaseUrl: env.OLLAMA_BASE_URL,
    ollamaModel: env.OLLAMA_MODEL ?? "llama3.2:3b",
    geminiApiKey: env.GEMINI_API_KEY,
    geminiModel: env.GEMINI_MODEL ?? "gemini-2.0-flash",
    groqApiKey: env.GROQ_API_KEY,
    groqModel: env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
    xaiApiKey: env.XAI_API_KEY,
    xaiModel: env.XAI_MODEL ?? "grok-2-latest",
    openaiApiKey: env.OPENAI_API_KEY,
    openaiModel: env.OPENAI_MODEL ?? "gpt-4o-mini",
  };
}

const KEY_ENV: Record<string, string> = {
  ollama: "OLLAMA_BASE_URL",
  gemini: "GEMINI_API_KEY",
  groq: "GROQ_API_KEY",
  xai: "XAI_API_KEY",
  openai: "OPENAI_API_KEY",
};

/** Every configured provider, in free-first order (Ollama probed for health). */
async function buildCandidates(env: LlmEnv): Promise<ResolvedProvider[]> {
  const out: ResolvedProvider[] = [];
  if (env.ollamaBaseUrl && (await ollamaHealthy(env.ollamaBaseUrl)))
    out.push({ name: "ollama", model: env.ollamaModel! });
  if (env.geminiApiKey) out.push({ name: "gemini", model: env.geminiModel! });
  if (env.groqApiKey) out.push({ name: "groq", model: env.groqModel! });
  if (env.xaiApiKey) out.push({ name: "xai", model: env.xaiModel! });
  if (env.openaiApiKey) out.push({ name: "openai", model: env.openaiModel! });
  return out;
}

/**
 * Ordered provider chain to try. In `auto` mode this is FREE providers only —
 * the tutor never silently bills a paid backend (the "must be free" rule). Paid
 * providers (xAI, OpenAI) are reachable only by selecting them explicitly via
 * HELP_AGENT_PROVIDER. A multi-entry chain enables failover (see streamChat).
 */
export async function availableProviders(env: LlmEnv = readLlmEnv()): Promise<ResolvedProvider[]> {
  const preference = (env.provider ?? "auto").toLowerCase();
  const candidates = await buildCandidates(env);

  if (preference !== "auto") {
    const picked = candidates.filter((c) => c.name === preference);
    if (picked.length) return picked;
    if (preference === "ollama") {
      throw new Error("Ollama is not reachable. Start Ollama or set HELP_AGENT_PROVIDER=gemini.");
    }
    throw new Error(`${KEY_ENV[preference] ?? preference} is not configured.`);
  }

  const free = candidates.filter((c) => FREE_PROVIDERS.has(c.name));
  if (free.length) return free;
  throw new Error(
    "No free LLM provider configured. Set GEMINI_API_KEY, GROQ_API_KEY, or OLLAMA_BASE_URL — " +
      "or choose a paid provider explicitly with HELP_AGENT_PROVIDER=xai|openai.",
  );
}

export async function resolveProvider(env: LlmEnv = readLlmEnv()): Promise<ResolvedProvider> {
  return (await availableProviders(env))[0];
}

function streamWithProvider(
  provider: ResolvedProvider,
  env: LlmEnv,
  messages: ChatMessage[],
): AsyncGenerator<string> {
  switch (provider.name) {
    case "ollama":
      return streamOllamaChat(env.ollamaBaseUrl!, provider.model, messages);
    case "gemini":
      return streamGeminiChat(env.geminiApiKey!, provider.model, messages);
    case "groq":
      return streamGroqChat(env.groqApiKey!, provider.model, messages);
    case "xai":
      return streamXaiChat(env.xaiApiKey!, provider.model, messages);
    case "openai":
      return streamOpenAiChat(env.openaiApiKey!, provider.model, messages);
  }
}

function chatWithProvider(
  provider: ResolvedProvider,
  env: LlmEnv,
  messages: ChatMessage[],
): Promise<string> {
  switch (provider.name) {
    case "ollama":
      return ollamaChat(env.ollamaBaseUrl!, provider.model, messages);
    case "gemini":
      return geminiChat(env.geminiApiKey!, provider.model, messages);
    case "groq":
      return groqChat(env.groqApiKey!, provider.model, messages);
    case "xai":
      return xaiChat(env.xaiApiKey!, provider.model, messages);
    case "openai":
      return openAiChat(env.openaiApiKey!, provider.model, messages);
  }
}

/**
 * Stream a reply, failing over to the next provider in the chain if one errors
 * *before* producing any output (e.g. a 429 quota error on connect). Once a
 * provider has started streaming we commit to it — partial output can't be
 * un-sent.
 */
export async function* streamChat(
  messages: ChatMessage[],
  env: LlmEnv = readLlmEnv(),
): AsyncGenerator<string> {
  const providers = await availableProviders(env);
  let lastErr: unknown;
  for (const provider of providers) {
    let started = false;
    try {
      for await (const chunk of streamWithProvider(provider, env, messages)) {
        started = true;
        yield chunk;
      }
      return;
    } catch (err) {
      if (started) throw err;
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("All LLM providers failed.");
}

export async function chat(
  messages: ChatMessage[],
  env: LlmEnv = readLlmEnv(),
): Promise<string> {
  const providers = await availableProviders(env);
  let lastErr: unknown;
  for (const provider of providers) {
    try {
      return await chatWithProvider(provider, env, messages);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("All LLM providers failed.");
}
