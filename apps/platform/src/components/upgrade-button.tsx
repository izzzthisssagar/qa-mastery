"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "@/components/motion";
import { grantPro } from "@/app/(app)/learn/actions";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { createBrowserSupabase } from "@qa-mastery/db";

/**
 * Upgrade to Pro button. If BILLING_ENABLED is true, this opens the Paddle checkout modal
 * and passes the current user ID as customData for the webhook to process.
 * Otherwise, it falls back to the mock grantPro action for local development without billing.
 */
export function UpgradeButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [paddle, setPaddle] = useState<Paddle | null>(null);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_BILLING_ENABLED === "true") {
      const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
      if (!clientToken) {
        console.error("Missing NEXT_PUBLIC_PADDLE_CLIENT_TOKEN for Paddle Billing");
        return;
      }
      initializePaddle({
        environment: "sandbox",
        token: clientToken,
      }).then((paddleInstance) => {
        if (paddleInstance) setPaddle(paddleInstance);
      });
    }
  }, []);

  async function upgrade() {
    setBusy(true);
    try {
      if (process.env.NEXT_PUBLIC_BILLING_ENABLED === "true") {
        if (!paddle) {
          console.error("Paddle SDK is not initialized");
          return;
        }
        const supabase = createBrowserSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error("User not authenticated");
          return;
        }

        paddle.Checkout.open({
          items: [{ priceId: "pri_qa_mastery_pro_placeholder", quantity: 1 }],
          customData: { userId: user.id }
        });
      } else {
        // Fallback mock behavior for local dev
        await grantPro();
        router.refresh();
      }
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
