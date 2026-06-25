import { Skeleton } from "@qa-mastery/ui";

/** Global app-level loading skeleton. Next.js streams this during navigation to
 *  any (app) route that doesn't define its own loading.tsx — so moving between
 *  pages never shows a dull blank frame. Route-specific skeletons (e.g. /talent)
 *  override this where a closer match exists. */
export default function Loading() {
  return (
    <div className="space-y-8 py-2">
      {/* page header */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* a band of summary tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* a content list */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4"
            >
              <Skeleton className="size-10 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
