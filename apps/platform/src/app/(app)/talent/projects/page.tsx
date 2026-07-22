import Link from "next/link";
import { getOpenProjects } from "../actions";
import { ProjectCard } from "../_components/project-card";

type Search = { [key: string]: string | string[] | undefined };

/** Open projects directory — testers browse work to apply to. */
export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const cursor = Array.isArray(sp.cursor) ? sp.cursor[0] : sp.cursor;

  const res = await getOpenProjects(cursor);
  const items = res.ok ? res.data.items : [];
  const nextCursor = res.ok ? res.data.nextCursor : null;

  return (
    <div className="space-y-6 py-2">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Open projects</h1>
        <p className="text-sm text-muted-foreground">Testing work looking for QA. Apply to what fits.</p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No open projects right now — check back soon.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
          {nextCursor && (
            <div className="flex justify-center">
              <Link
                href={`/talent/projects?cursor=${encodeURIComponent(nextCursor)}`}
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:border-border"
              >
                Load more
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
