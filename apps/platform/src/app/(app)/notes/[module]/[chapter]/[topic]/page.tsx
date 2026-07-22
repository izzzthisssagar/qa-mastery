import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  listNoteFiles,
  getNote,
  findNoteModule,
  findNoteLeaf,
  labForChapter,
  trackCapstoneForChapter,
} from "@qa-mastery/curriculum";
import { mdxComponents } from "@/app/(app)/learn/[slug]/mdx-components";
import { getNoteCompletion } from "../../../actions";
import { getNoteLabState } from "../../../lab-actions";
import { getNoteCapstoneState } from "../../../capstone-actions";
import { ChapterLab } from "../../../chapter-lab";
import { TrackCapstone } from "../../../track-capstone";
import { NoteProgressProvider } from "../../../note-progress-context";
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

  // Per-learner completion state for the <Complete> button inside the MDX body.
  const noteSlug = `${moduleSlug}/${chapterSlug}/${topicSlug}`;
  const { done: initialDone } = await getNoteCompletion(noteSlug);

  // A lab closes out its whole chapter, and there is no chapter route — so it
  // renders after the LAST file-backed topic, which is where a learner who has
  // read the chapter actually ends up. Registry-driven: no .mdx authoring.
  const chapterLabSlug = `${moduleSlug}/${chapterSlug}`;
  const chapterTopics = (findNoteModule(moduleSlug)?.chapters ?? [])
    .find((c) => c.slug === chapterSlug)
    ?.topics.filter((t) => !t.planned && getNote(moduleSlug, chapterSlug, t.slug));
  const isLastTopic = chapterTopics?.at(-1)?.slug === topicSlug;
  const labState =
    isLastTopic && labForChapter(chapterLabSlug)
      ? await getNoteLabState(chapterLabSlug)
      : null;
  // A track capstone anchors at the same "last topic of the chapter" position
  // as a chapter lab, on a chapter that has no chapter lab of its own — see
  // notes/track-capstones.ts for why it can't be keyed like a normal lab.
  const capstoneState =
    isLastTopic && trackCapstoneForChapter(chapterLabSlug)
      ? await getNoteCapstoneState(chapterLabSlug)
      : null;

  // Related notes are authored as "module/chapter/topic" triples; resolve each
  // against the taxonomy + disk so a stale or planned-only reference never 404s.
  const related = note.frontmatter.related
    .map((triple) => {
      const [m, c, t] = triple.split("/");
      const leaf = findNoteLeaf(m, c, t);
      if (!leaf || leaf.planned || !getNote(m, c, t)) return null;
      return { moduleSlug: m, chapterSlug: c, topicSlug: t, title: leaf.title };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

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

      <NoteProgressProvider slug={noteSlug} initialDone={initialDone}>
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
      </NoteProgressProvider>

      {labState && <ChapterLab state={labState} />}
      {capstoneState && <TrackCapstone state={capstoneState} />}

      {related.length > 0 && (
        <div className="mt-10 border-t border-border pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Related notes</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {related.map((r) => (
              <li key={`${r.moduleSlug}/${r.chapterSlug}/${r.topicSlug}`}>
                <Link
                  href={`/notes/${r.moduleSlug}/${r.chapterSlug}/${r.topicSlug}`}
                  className="rounded-full border border-border px-3 py-1 text-sm text-foreground/90 hover:border-accent hover:text-accent"
                >
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
