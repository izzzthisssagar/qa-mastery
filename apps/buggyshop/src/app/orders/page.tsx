"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getActiveRelease } from "@/lib/catalog";
import { canCancel, paymentStatusFor, type OrderStatus } from "@/lib/orders";

const SESSION_STORAGE_KEY = "bs-session";

export default function OrdersPage() {
  const [status, setStatus] = useState<OrderStatus>("Shipped");
  const [rejected, setRejected] = useState(false);

  // Release decides which seeded bugs are live. Read once from the session if
  // the learner arrived via the handoff; default release otherwise.
  const release = useMemo(() => {
    if (typeof window === "undefined") return getActiveRelease(null);
    return getActiveRelease(localStorage.getItem(SESSION_STORAGE_KEY));
  }, []);

  const handleCancel = () => {
    if (canCancel(status, release)) {
      setStatus("Cancelled");
      setRejected(false);
    } else {
      setRejected(true);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <header
        data-testid="shop-header"
        className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4"
      >
        <Link href="/" data-testid="shop-logo" className="text-lg font-bold">
          🛒 Buggy<span className="text-shop-accent">Shop</span>
        </Link>
        <nav data-testid="shop-nav" className="flex items-center gap-5 text-sm text-zinc-600">
          <Link href="/products" data-testid="nav-products" className="hover:text-shop-accent">
            Products
          </Link>
          <Link href="/cart" data-testid="nav-cart" className="hover:text-shop-accent">
            Cart (0)
          </Link>
          <Link href="/orders" data-testid="nav-orders" className="text-shop-accent">
            Orders
          </Link>
          <span className="cursor-not-allowed opacity-60" data-testid="nav-login">
            Log in
          </span>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>

        <div
          data-testid="order-card"
          className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4"
        >
          <div className="flex flex-col">
            <span className="font-medium text-zinc-900">Order #1042</span>
            <span className="text-sm text-zinc-500">Annual Membership</span>
            <span data-testid="order-status" className="mt-2 text-sm font-semibold text-shop-accent">
              {status}
            </span>
          </div>
          <button
            type="button"
            data-testid="order-cancel"
            onClick={handleCancel}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:border-zinc-400"
          >
            Cancel
          </button>
        </div>

        <div
          data-testid="order-card-2"
          className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4"
        >
          <div className="flex flex-col">
            <span className="font-medium text-zinc-900">Order #1043</span>
            <span className="text-sm text-zinc-500">Tester Mug</span>
            <span className="mt-2 text-sm">
              Fulfillment:{" "}
              <span data-testid="order2-fulfillment" className="font-semibold text-shop-accent">
                Delivered
              </span>
            </span>
            <span className="text-sm">
              Payment:{" "}
              <span data-testid="order2-payment" className="font-semibold text-zinc-700">
                {paymentStatusFor("Delivered", release)}
              </span>
            </span>
          </div>
        </div>

        {status === "Cancelled" && (
          <p data-testid="cancel-result" className="mt-6 text-sm text-zinc-600">
            Order cancelled
          </p>
        )}

        {rejected && status !== "Cancelled" && (
          <p data-testid="cancel-rejected" className="mt-6 text-sm text-red-600">
            Cannot cancel a shipped order
          </p>
        )}
      </main>

      <footer className="border-t border-zinc-200 px-6 py-4 text-center text-xs text-zinc-400">
        BuggyShop is the QA Mastery practice app. Every bug is intentional.
      </footer>
    </div>
  );
}
