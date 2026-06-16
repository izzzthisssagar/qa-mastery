import { TUTOR_GENERATION, type ChatMessage } from "./types";

function toGeminiContents(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
}

export async function* streamGeminiChat(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): AsyncGenerator<string> {
  const system = messages.find((m) => m.role === "system")?.content;
  const contents = toGeminiContents(messages);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      contents,
      generationConfig: {
        temperature: TUTOR_GENERATION.temperature,
        maxOutputTokens: TUTOR_GENERATION.maxOutputTokens,
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini error ${res.status}: ${text}`);
  }
  if (!res.body) throw new Error("Gemini returned no body");

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
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === "[DONE]") continue;
      const json = JSON.parse(payload) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) yield text;
    }
  }
}

export async function geminiChat(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<string> {
  let out = "";
  for await (const chunk of streamGeminiChat(apiKey, model, messages)) {
    out += chunk;
  }
  return out;
}

/**
 * Embed a batch of texts with a Gemini embedding model (default
 * `text-embedding-004`, 768-dim). Used to index the curriculum and to embed a
 * learner's question at retrieval time (the RAG path).
 */
export async function geminiEmbed(
  apiKey: string,
  model: string,
  texts: string[],
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents?key=${apiKey}`;
  const body = JSON.stringify({
    requests: texts.map((text) => ({
      model: `models/${model}`,
      content: { parts: [{ text }] },
      // Pin to the lesson_chunks vector(768) column (gemini-embedding-001
      // defaults to 3072 and supports 768/1536/3072). Must equal EMBED_DIM.
      outputDimensionality: 768,
    })),
  });

  // Retry on 429 (free-tier rate limit) with exponential backoff; the indexer
  // also throttles between lessons.
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (res.ok) {
      const json = (await res.json()) as { embeddings?: Array<{ values: number[] }> };
      if (!json.embeddings) throw new Error("Gemini embed returned no embeddings");
      return json.embeddings.map((e) => e.values);
    }
    if (res.status === 429 && attempt < 6) {
      await new Promise((r) => setTimeout(r, Math.min(64000, 5000 * 2 ** attempt)));
      continue;
    }
    throw new Error(`Gemini embed error ${res.status}: ${await res.text()}`);
  }
}
