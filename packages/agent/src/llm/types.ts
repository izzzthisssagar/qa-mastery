export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type ProviderName = "ollama" | "gemini" | "groq";

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
}
