import type { HTMLAttributes } from "react";
import { cn } from "./cn";

type Tone = "default" | "success" | "warning" | "info" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  default: "border-zinc-700 text-zinc-300",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  info: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  danger: "border-red-500/40 bg-red-500/10 text-red-300",
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
