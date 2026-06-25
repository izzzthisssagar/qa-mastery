import { Skeleton } from "@qa-mastery/ui";

export default function Loading() {
  return (
    <div className="space-y-8 py-2">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-20 w-full max-w-2xl" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-6 w-16 rounded-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
