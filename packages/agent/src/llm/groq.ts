import type { ChatMessage } from "./types";

export async function* streamGroqChat(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): AsyncGenerator<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream: true }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq error ${res.status}: ${text}`);
  }
  if (!res.body) throw new Error("Groq returned no body");

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

export async function groqChat(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<string> {
  let out = "";
  for await (const chunk of streamGroqChat(apiKey, model, messages)) {
    out += chunk;
  }
  return out;
}
