import { geminiChat, streamGeminiChat } from "./gemini";
import { groqChat, streamGroqChat } from "./groq";
import { ollamaChat, ollamaHealthy, streamOllamaChat } from "./ollama";
import type { ChatMessage, LlmEnv, ResolvedProvider } from "./types";

export function readLlmEnv(env: NodeJS.ProcessEnv = process.env): LlmEnv {
  return {
    provider: env.HELP_AGENT_PROVIDER,
    ollamaBaseUrl: env.OLLAMA_BASE_URL,
    ollamaModel: env.OLLAMA_MODEL ?? "llama3.2:3b",
    geminiApiKey: env.GEMINI_API_KEY,
    geminiModel: env.GEMINI_MODEL ?? "gemini-2.0-flash",
    groqApiKey: env.GROQ_API_KEY,
    groqModel: env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
  };
}

export async function resolveProvider(env: LlmEnv = readLlmEnv()): Promise<ResolvedProvider> {
  const preference = (env.provider ?? "auto").toLowerCase();

  const tryOllama = async (): Promise<ResolvedProvider | null> => {
    if (!env.ollamaBaseUrl) return null;
    const ok = await ollamaHealthy(env.ollamaBaseUrl);
    return ok ? { name: "ollama", model: env.ollamaModel! } : null;
  };
  const tryGemini = (): ResolvedProvider | null =>
    env.geminiApiKey ? { name: "gemini", model: env.geminiModel! } : null;
  const tryGroq = (): ResolvedProvider | null =>
    env.groqApiKey ? { name: "groq", model: env.groqModel! } : null;

  if (preference === "ollama") {
    const ollama = await tryOllama();
    if (ollama) return ollama;
    throw new Error("Ollama is not reachable. Start Ollama or set HELP_AGENT_PROVIDER=gemini.");
  }
  if (preference === "gemini") {
    const gemini = tryGemini();
    if (gemini) return gemini;
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  if (preference === "groq") {
    const groq = tryGroq();
    if (groq) return groq;
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const ollama = await tryOllama();
  if (ollama) return ollama;
  const gemini = tryGemini();
  if (gemini) return gemini;
  const groq = tryGroq();
  if (groq) return groq;

  throw new Error(
    "No LLM provider configured. Set OLLAMA_BASE_URL, GEMINI_API_KEY, or GROQ_API_KEY.",
  );
}

async function* streamWithProvider(
  provider: ResolvedProvider,
  env: LlmEnv,
  messages: ChatMessage[],
): AsyncGenerator<string> {
  switch (provider.name) {
    case "ollama":
      yield* streamOllamaChat(env.ollamaBaseUrl!, provider.model, messages);
      break;
    case "gemini":
      yield* streamGeminiChat(env.geminiApiKey!, provider.model, messages);
      break;
    case "groq":
      yield* streamGroqChat(env.groqApiKey!, provider.model, messages);
      break;
  }
}

async function chatWithProvider(
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
  }
}

export async function* streamChat(
  messages: ChatMessage[],
  env: LlmEnv = readLlmEnv(),
): AsyncGenerator<string> {
  const provider = await resolveProvider(env);
  yield* streamWithProvider(provider, env, messages);
}

export async function chat(
  messages: ChatMessage[],
  env: LlmEnv = readLlmEnv(),
): Promise<string> {
  const provider = await resolveProvider(env);
  return chatWithProvider(provider, env, messages);
}
