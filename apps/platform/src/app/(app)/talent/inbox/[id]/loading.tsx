import { Skeleton } from "@qa-mastery/ui";

export default function Loading() {
  return (
    <div className="space-y-4 py-2">
      <Skeleton className="h-4 w-16" />
      <div className="flex h-[60vh] flex-col gap-3">
        <div className="flex-1 space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={i % 2 ? "flex justify-end" : "flex justify-start"}>
              <Skeleton className="h-10 w-1/2 rounded-2xl" />
            </div>
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}
