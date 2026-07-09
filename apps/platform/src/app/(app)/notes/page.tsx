import Link from "next/link";
import { NOTES_TAXONOMY, listNoteFiles } from "@qa-mastery/curriculum";
import { NotesSearch } from "./notes-search";

export const metadata = {
  title: "Notes · QA Mastery",
};

/**
 * Notes wiki landing — the QA reference encyclopedia. Shows the module tree with
 * a live count of written topics per module, plus search. Pure static content;
 * no auth-specific data (the (app) layout still gates the route).
 */
export default function NotesPage() {
  const written = new Set(
    listNoteFiles().map((f) => `${f.moduleSlug}/${f.chapterSlug}/${f.topicSlug}`),
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-xs font-medium uppercase tracking-widest text-accent">Reference</p>
      <h1 className="mt-1 text-2xl font-semibold text-foreground">Notes wiki</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        A growing encyclopedia of QA knowledge — foundations, manual, automation, API,
        performance, security, and more. Browse by module or search across every topic.
      </p>

      <div className="mt-6">
        <NotesSearch />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {NOTES_TAXONOMY.map((m) => {
          const total = m.chapters.reduce((n, c) => n + c.topics.length, 0);
          const done = m.chapters.reduce(
            (n, c) => n + c.topics.filter((t) => written.has(`${m.slug}/${c.slug}/${t.slug}`)).length,
            0,
          );
          return (
            <Link
              key={m.slug}
              href={`/notes/${m.slug}`}
              data-testid={`notes-module-${m.slug}`}
              className="group rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-accent/50"
            >
              <div className="flex items-baseline justify-between">
                <h2 className="text-base font-semibold text-foreground">{m.title}</h2>
                <span className="text-xs text-muted-foreground">
                  {done}/{total}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{m.summary}</p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
