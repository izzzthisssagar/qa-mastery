import type { HTMLAttributes } from "react";
import { cn } from "./cn";

type Tone = "default" | "success" | "warning" | "info" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  default: "border-border text-foreground",
  success: "border-emerald-500/40 bg-emerald-500/10 text-success-text",
  warning: "border-amber-500/40 bg-amber-500/10 text-warning-text",
  info: "border-sky-500/40 bg-sky-500/10 text-info-text",
  danger: "border-red-500/40 bg-red-500/10 text-danger-text",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}
