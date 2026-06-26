import { Skeleton } from "@qa-mastery/ui";

/** Lesson reader skeleton — prose-shaped, so the long-content route streams a
 *  matching placeholder instead of the generic app skeleton. */
export default function Loading() {
  return (
    <div className="space-y-6 py-2">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-1.5 w-full rounded-full" />
      <div className="space-y-7 pt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2.5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            {i % 2 === 0 && <Skeleton className="h-32 w-full rounded-xl" />}
          </div>
        ))}
      </div>
      <div className="flex justify-between pt-4">
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
    </div>
  );
}
