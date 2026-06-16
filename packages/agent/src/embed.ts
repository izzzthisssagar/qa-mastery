import { readLlmEnv } from "./llm/adapter";
import { geminiEmbed } from "./llm/gemini";

/** Dimension of the embedding vectors (text-embedding-004). Must match the
 *  `vector(N)` column in the lesson_chunks migration. */
export const EMBED_DIM = 768;

/** Gemini's batchEmbedContents cap per request. */
const MAX_BATCH = 100;

function embedModel(): string {
  return process.env.GEMINI_EMBED_MODEL ?? "text-embedding-004";
}

/**
 * Embed many texts (chunks). Embeddings are Gemini-only — Groq has no embedding
 * API, so even with the Gemini→Groq chat failover, retrieval needs GEMINI_API_KEY.
 * Throws if it's missing so the indexer fails loudly; the retrieval path catches
 * and degrades gracefully (no RAG that turn) instead.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const key = readLlmEnv().geminiApiKey;
  if (!key) throw new Error("GEMINI_API_KEY is required for embeddings");
  const model = embedModel();
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += MAX_BATCH) {
    out.push(...(await geminiEmbed(key, model, texts.slice(i, i + MAX_BATCH))));
  }
  return out;
}

export async function embedQuery(text: string): Promise<number[]> {
  return (await embedTexts([text]))[0];
}
