import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * Shared "never a blank panel" empty state (UX §2B): cold-start and
 * filtered-to-nothing are the two states every list/grid can land in, and
 * both need orientation + a next step, not silence. `actions` renders after
 * the copy — pass Buttons wrapped in Links for navigation.
 */
export function EmptyState({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-grid grain relative overflow-hidden rounded-2xl border border-border px-6 py-16 text-center",
        className,
      )}
    >
      <div className="bg-glow pointer-events-none absolute inset-0" />
      <div className="relative space-y-3">
        <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>
        {actions && <div className="flex justify-center gap-3 pt-2">{actions}</div>}
      </div>
    </div>
  );
}
