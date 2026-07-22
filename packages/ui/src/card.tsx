import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function Card({
  className,
  interactive = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  /** Hover lift + border highlight, for cards that are themselves a link/button
   *  (e.g. wrapped in <Link>). Plain informational cards should leave this off. */
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface/60 p-6 shadow-sm transition duration-200",
        interactive &&
          "hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("mb-2 text-lg font-semibold text-foreground", className)} {...props} />
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
