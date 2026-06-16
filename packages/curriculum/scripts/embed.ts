/**
 * Curriculum embedding indexer — chunks every lesson's MDX body, embeds the
 * chunks (Gemini), and upserts them into `public.lesson_chunks` for the tutor's
 * RAG retrieval. Re-run whenever lesson content changes.
 *
 * Needs: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY.
 *   pnpm --filter @qa-mastery/curriculum exec tsx scripts/embed.ts
 */
import { embedTexts } from "@qa-mastery/agent";
import { createServiceClient } from "@qa-mastery/db";
import { loadAllLessons } from "../src/load";

const MAX_CHUNK = 1200; // chars

/** Strip MDX/JSX tags and split prose into ~MAX_CHUNK-sized chunks on paragraphs. */
function chunkLesson(body: string): string[] {
  const clean = body
    .replace(/<\/?[A-Za-z][A-Za-z0-9]*(\s[^>]*)?\/?>/g, " ") // drop <Widget /> tags
    .replace(/\r/g, "")
    .trim();
  const paras = clean.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  const chunks: string[] = [];
  let cur = "";
  for (const p of paras) {
    if (cur && cur.length + p.length + 2 > MAX_CHUNK) {
      chunks.push(cur);
      cur = "";
    }
    cur = cur ? `${cur}\n\n${p}` : p;
    if (cur.length >= MAX_CHUNK) {
      chunks.push(cur);
      cur = "";
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

const service = createServiceClient();
const lessons = loadAllLessons();
console.log(`embedding ${lessons.length} lessons…`);

let totalChunks = 0;
for (const lesson of lessons) {
  const { slug, title, track, module } = lesson.frontmatter;
  const chunks = chunkLesson(lesson.body);
  if (chunks.length === 0) continue;

  // Embed each chunk with a little lesson context so retrieval ranks by topic.
  const embeddings = await embedTexts(
    chunks.map((c) => `Lesson: ${title} (${track}/${module})\n\n${c}`),
  );

  // Replace this lesson's chunks wholesale (slugs are stable; chunk count varies).
  const { error: delError } = await service
    .from("lesson_chunks")
    .delete()
    .eq("lesson_slug", slug);
  if (delError) throw new Error(`clear ${slug}: ${delError.message}`);

  const { error: insError } = await service.from("lesson_chunks").insert(
    chunks.map((content, i) => ({
      lesson_slug: slug,
      track,
      module,
      title,
      chunk_index: i,
      content,
      // pgvector parses the JSON array text form "[0.1,0.2,…]".
      embedding: JSON.stringify(embeddings[i]),
    })),
  );
  if (insError) throw new Error(`insert ${slug}: ${insError.message}`);

  totalChunks += chunks.length;
  console.log(`  ✓ ${slug} — ${chunks.length} chunks`);
  await new Promise((r) => setTimeout(r, 1500)); // throttle the free embedding tier
}

console.log(`\nindexed ${totalChunks} chunks across ${lessons.length} lessons.`);
