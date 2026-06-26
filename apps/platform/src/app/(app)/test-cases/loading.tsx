import { Skeleton } from "@qa-mastery/ui";

/** Test-cases table skeleton — row-shaped to match the data table. */
export default function Loading() {
  return (
    <div className="space-y-6 py-2">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <div className="border-b border-zinc-800 bg-zinc-900/50 p-3">
          <Skeleton className="h-4 w-32" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-zinc-800/60 p-4 last:border-0"
          >
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-4 w-full max-w-xs flex-1" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
