import type { ChatMessage } from "./types";

export async function ollamaHealthy(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/tags`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function* streamOllamaChat(
  baseUrl: string,
  model: string,
  messages: ChatMessage[],
): AsyncGenerator<string> {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: true }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama error ${res.status}: ${text}`);
  }
  if (!res.body) throw new Error("Ollama returned no body");

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
      if (!trimmed) continue;
      const chunk = JSON.parse(trimmed) as { message?: { content?: string } };
      const text = chunk.message?.content;
      if (text) yield text;
    }
  }
}

export async function ollamaChat(
  baseUrl: string,
  model: string,
  messages: ChatMessage[],
): Promise<string> {
  let out = "";
  for await (const chunk of streamOllamaChat(baseUrl, model, messages)) {
    out += chunk;
  }
  return out;
}
