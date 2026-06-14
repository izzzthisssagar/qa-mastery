"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "@/components/motion";
import { grantPro } from "@/app/(app)/learn/actions";

/**
 * Mock "Upgrade to Pro". Calls the grantPro server action (which writes the
 * entitlement via the service role), then refreshes so the gated content opens.
 * A real build would route to checkout; the server side is already wired.
 */
export function UpgradeButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function upgrade() {
    setBusy(true);
    try {
      await grantPro();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.button
      type="button"
      data-testid="upgrade-pro"
      onClick={upgrade}
      disabled={busy}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent hover:bg-accent/20 disabled:opacity-60"
    >
      {busy ? "Upgrading…" : "Upgrade to Pro"}
    </motion.button>
  );
}
