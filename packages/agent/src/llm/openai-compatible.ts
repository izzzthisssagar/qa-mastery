import { TUTOR_GENERATION, type ChatMessage } from "./types";

/**
 * Streaming chat for any OpenAI-compatible Chat Completions API (Groq, xAI,
 * OpenAI). They share the same request/response shape, so one implementation
 * serves all three — only the base URL, key and label differ.
 */
export async function* streamOpenAiCompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  label: string,
): AsyncGenerator<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: TUTOR_GENERATION.temperature,
      max_tokens: TUTOR_GENERATION.maxOutputTokens,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${label} error ${res.status}: ${text}`);
  }
  if (!res.body) throw new Error(`${label} returned no body`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;
      const payload = trimmed.slice(6);
      if (payload === "[DONE]") continue;
      const json = JSON.parse(payload) as {
        choices?: Array<{ delta?: { content?: string } }>;
      };
      const text = json.choices?.[0]?.delta?.content;
      if (text) yield text;
    }
  }
}

export async function openAiCompatibleChat(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  label: string,
): Promise<string> {
  let out = "";
  for await (const chunk of streamOpenAiCompatible(baseUrl, apiKey, model, messages, label)) {
    out += chunk;
  }
  return out;
}
