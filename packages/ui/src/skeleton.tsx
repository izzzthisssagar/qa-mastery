import type { HTMLAttributes } from "react";
import { cn } from "./cn";

/** A shimmering placeholder block. Compose several to mirror a page's layout
 *  while its data streams in. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-zinc-800/70", className)}
      {...props}
    />
  );
}
