"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-emerald-300 to-emerald-400 text-zinc-950 " +
    "shadow-[0_1px_0_0_rgba(255,255,255,0.35)_inset,0_10px_30px_-12px_color-mix(in_oklab,var(--accent)_70%,transparent)] " +
    "hover:from-emerald-200 hover:to-emerald-300 active:translate-y-px focus-visible:outline-emerald-400",
  secondary:
    "border border-zinc-700 text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800/80 active:translate-y-px focus-visible:outline-zinc-500",
  ghost: "text-zinc-300 hover:bg-zinc-800 focus-visible:outline-zinc-500",
  danger: "bg-red-500 text-white hover:bg-red-400 focus-visible:outline-red-500",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
