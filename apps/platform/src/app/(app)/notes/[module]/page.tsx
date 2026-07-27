import Link from "next/link";
import { notFound } from "next/navigation";
import { NOTES_TAXONOMY, findNoteModule, listNoteFiles } from "@qa-mastery/curriculum";

export function generateStaticParams() {
  return NOTES_TAXONOMY.map((m) => ({ module: m.slug }));
}

export default async function NotesModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module: moduleSlug } = await params;
  const mod = findNoteModule(moduleSlug);
  if (!mod) notFound();

  const written = new Set(
    listNoteFiles()
      .filter((f) => f.moduleSlug === moduleSlug)
      .map((f) => `${f.chapterSlug}/${f.topicSlug}`),
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/notes" className="text-sm text-muted-foreground hover:text-foreground">
        ← All modules
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-foreground">{mod.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{mod.summary}</p>

      <div className="mt-8 space-y-8">
        {mod.chapters.map((c) => (
          <section key={c.slug}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {c.title}
            </h2>
            <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
              {c.topics.map((t) => {
                const isWritten = written.has(`${c.slug}/${t.slug}`);
                return isWritten ? (
                  <li key={t.slug}>
                    <Link
                      href={`/notes/${mod.slug}/${c.slug}/${t.slug}`}
                      data-testid={`notes-topic-${t.slug}`}
                      className="flex items-center justify-between bg-surface px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted"
                    >
                      {t.title}
                      <span aria-hidden className="text-muted-foreground">
                        →
                      </span>
                    </Link>
                  </li>
                ) : (
                  <li
                    key={t.slug}
                    className="flex items-center justify-between bg-surface/50 px-4 py-3 text-sm text-muted-foreground"
                  >
                    {t.title}
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                      Soon
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
