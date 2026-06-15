import { openAiCompatibleChat, streamOpenAiCompatible } from "./openai-compatible";
import type { ChatMessage } from "./types";

// OpenAI Chat Completions. Paid: an opt-in backend, never the free default
// (see the adapter's auto-resolution order).
const OPENAI_BASE_URL = "https://api.openai.com/v1";

export function streamOpenAiChat(apiKey: string, model: string, messages: ChatMessage[]) {
  return streamOpenAiCompatible(OPENAI_BASE_URL, apiKey, model, messages, "OpenAI");
}

export function openAiChat(apiKey: string, model: string, messages: ChatMessage[]) {
  return openAiCompatibleChat(OPENAI_BASE_URL, apiKey, model, messages, "OpenAI");
}
