"use client";

import Link from "next/link";
import { useMemo } from "react";
import { readRelease } from "@/lib/catalog";
import { CURRENT_USER, visibleOrders } from "@/lib/order-history";


export default function OrderHistoryPage() {
  // Release decides which seeded bugs are live. Read once from the session if
  // the learner arrived via the handoff; default release otherwise.
  const release = useMemo(() => readRelease(), []);

  const orders = visibleOrders(CURRENT_USER, release);

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
          <Link href="/orders" data-testid="nav-orders" className="hover:text-shop-accent">
            Orders
          </Link>
          <span className="cursor-not-allowed opacity-60" data-testid="nav-login">
            Log in
          </span>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight">Order History</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Signed in as <span className="font-medium text-zinc-700">{CURRENT_USER}</span>
        </p>

        <p data-testid="history-count" className="mt-6 text-sm text-zinc-500">
          {orders.length} order{orders.length === 1 ? "" : "s"}
        </p>

        <ul className="mt-4 flex flex-col gap-4">
          {orders.map((order) => (
            <li
              key={order.id}
              data-testid={`history-order-${order.id}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4"
            >
              <div className="flex flex-col">
                <span className="font-medium text-zinc-900">Order #{order.id}</span>
                <span className="text-sm text-zinc-500">{order.item}</span>
              </div>
              <span
                data-testid={`history-owner-${order.id}`}
                className="text-sm font-semibold text-zinc-700"
              >
                {order.owner}
              </span>
            </li>
          ))}
        </ul>
      </main>

      <footer className="border-t border-zinc-200 px-6 py-4 text-center text-xs text-zinc-400">
        BuggyShop is the QA Mastery practice app. Every bug is intentional.
      </footer>
    </div>
  );
}
