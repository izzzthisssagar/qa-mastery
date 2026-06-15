import { openAiCompatibleChat, streamOpenAiCompatible } from "./openai-compatible";
import type { ChatMessage } from "./types";

// xAI / Grok — OpenAI-compatible API. Paid: an opt-in backend, never the free
// default (see the adapter's auto-resolution order).
const XAI_BASE_URL = "https://api.x.ai/v1";

export function streamXaiChat(apiKey: string, model: string, messages: ChatMessage[]) {
  return streamOpenAiCompatible(XAI_BASE_URL, apiKey, model, messages, "xAI");
}

export function xaiChat(apiKey: string, model: string, messages: ChatMessage[]) {
  return openAiCompatibleChat(XAI_BASE_URL, apiKey, model, messages, "xAI");
}
