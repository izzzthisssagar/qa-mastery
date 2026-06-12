"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-emerald-400 text-zinc-950 hover:bg-emerald-300 focus-visible:outline-emerald-400",
  secondary:
    "border border-zinc-700 text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800 focus-visible:outline-zinc-500",
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
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
