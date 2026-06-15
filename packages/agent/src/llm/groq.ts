import { openAiCompatibleChat, streamOpenAiCompatible } from "./openai-compatible";
import type { ChatMessage } from "./types";

// Groq — OpenAI-compatible API with a generous free tier (a free default).
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

export function streamGroqChat(apiKey: string, model: string, messages: ChatMessage[]) {
  return streamOpenAiCompatible(GROQ_BASE_URL, apiKey, model, messages, "Groq");
}

export function groqChat(apiKey: string, model: string, messages: ChatMessage[]) {
  return openAiCompatibleChat(GROQ_BASE_URL, apiKey, model, messages, "Groq");
}
