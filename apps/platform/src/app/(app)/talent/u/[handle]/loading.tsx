import { Skeleton } from "@qa-mastery/ui";

export default function Loading() {
  return (
    <div className="space-y-8 py-2">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-14 rounded-full" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-6 w-2/3 max-w-xl" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-6 w-20 rounded-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
