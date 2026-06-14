"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "@/components/motion";

/**
 * Primary CTA with a tasteful hover lift + press. Wraps a Next Link so it stays
 * a real anchor for routing and the e2e contract.
 */
export function CtaLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
}) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/60";
  const styles =
    variant === "primary"
      ? "bg-accent text-zinc-950 shadow-lg shadow-accent/20 hover:shadow-accent/30"
      : "border border-zinc-700 text-zinc-200 hover:border-zinc-500 hover:text-zinc-50";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ y: 0, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
    >
      <Link href={href} className={`${base} ${styles}`}>
        {children}
      </Link>
    </motion.div>
  );
}
