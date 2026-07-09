import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { listNoteFiles, getNote, findNoteModule } from "@qa-mastery/curriculum";
import { mdxComponents } from "@/app/(app)/learn/[slug]/mdx-components";
import {
  AskCommunity,
  Callout,
  Challenge,
  CodePlayground,
  Complete,
  Figure,
  FirstTime,
  FlowAnimation,
  Flashcards,
  Hook,
  HotspotImage,
  PartsQuest,
  Quiz,
  Resources,
  StepChecklist,
  Takeaways,
  Term,
  Video,
  WhenItBreaks,
  WorkedExample,
  WhereToCheck,
} from "../../../note-components";

/** Client components must be named imports here (server module) so each gets a
 *  proper client reference — spreading a map exported from the "use client"
 *  module loses members at the RSC boundary. */
const noteInteractiveComponents = {
  AskCommunity,
  Callout,
  Challenge,
  CodePlayground,
  Complete,
  Figure,
  FirstTime,
  FlowAnimation,
  Flashcards,
  Hook,
  HotspotImage,
  PartsQuest,
  Quiz,
  Resources,
  StepChecklist,
  Takeaways,
  Term,
  Video,
  WhenItBreaks,
  WorkedExample,
  WhereToCheck,
};

/** Only pre-render leaves that actually have MDX; planned stubs never route. */
export function generateStaticParams() {
  return listNoteFiles().map((f) => ({
    module: f.moduleSlug,
    chapter: f.chapterSlug,
    topic: f.topicSlug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ module: string; chapter: string; topic: string }>;
}): Promise<Metadata> {
  const { module: m, chapter: c, topic: t } = await params;
  const note = getNote(m, c, t);
  return { title: note ? `${note.frontmatter.title} · Notes` : "Notes" };
}

export default async function NoteTopicPage({
  params,
}: {
  params: Promise<{ module: string; chapter: string; topic: string }>;
}) {
  const { module: moduleSlug, chapter: chapterSlug, topic: topicSlug } = await params;
  const note = getNote(moduleSlug, chapterSlug, topicSlug);
  if (!note) notFound();
  const mod = findNoteModule(moduleSlug);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/notes" className="hover:text-foreground">Notes</Link>
        <span aria-hidden>/</span>
        <Link href={`/notes/${moduleSlug}`} className="hover:text-foreground">
          {mod?.title ?? moduleSlug}
        </Link>
      </div>

      <h1 className="mt-4 text-3xl font-semibold text-foreground">{note.frontmatter.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{note.frontmatter.summary}</p>
      {note.frontmatter.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {note.frontmatter.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <article className="prose-notes mt-8 space-y-4 text-[15px] leading-relaxed text-foreground/90">
        <MDXRemote
          source={note.body}
          components={{ ...mdxComponents, ...noteInteractiveComponents }}
          // Notes MDX is repo-authored (trusted): allow JSX attribute
          // expressions — next-mdx-remote v6 strips them by default, which
          // silently emptied array props like WhenItBreaks items. The
          // dangerous-calls guard (blockDangerousJS) stays on.
          options={{ blockJS: false }}
        />
      </article>
    </main>
  );
}
