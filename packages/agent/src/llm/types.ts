export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type ProviderName = "ollama" | "gemini" | "groq" | "xai" | "openai";

/** Providers that are free to run (local or free API tier). */
export const FREE_PROVIDERS: ReadonlySet<ProviderName> = new Set(["ollama", "gemini", "groq"]);

export interface ResolvedProvider {
  name: ProviderName;
  model: string;
}

export interface LlmEnv {
  provider?: string;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  groqApiKey?: string;
  groqModel?: string;
  xaiApiKey?: string;
  xaiModel?: string;
  openaiApiKey?: string;
  openaiModel?: string;
}

/** Generation knobs shared across providers — focused + bounded for a tutor. */
export interface GenerationConfig {
  temperature: number;
  maxOutputTokens: number;
}

export const TUTOR_GENERATION: GenerationConfig = {
  temperature: 0.6,
  maxOutputTokens: 800,
};
