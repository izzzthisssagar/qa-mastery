"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { readRelease } from "@/lib/catalog";
import { cardOffered, submitPayment, type PayMethod } from "@/lib/payment";


// Fixed demo order total — deliberately under $100 so the BS-011 rule conflict
// surfaces: Card is offered yet rejected on submit.
const ORDER_TOTAL = 50;

export default function PaymentPage() {
  const [method, setMethod] = useState<PayMethod>("card");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Release decides which seeded bugs are live. Read once from the session if
  // the learner arrived via the handoff; default release otherwise.
  const release = useMemo(() => readRelease(), []);

  const handlePay = () => {
    setResult(submitPayment(ORDER_TOTAL, method, release));
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
          <span className="cursor-not-allowed opacity-60" data-testid="nav-cart">
            Cart (0)
          </span>
          <span className="cursor-not-allowed opacity-60" data-testid="nav-login">
            Log in
          </span>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight">Payment</h1>

        <div className="mt-6 flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600">Order total</span>
            <span data-testid="order-total" className="text-lg font-semibold text-shop-accent">
              ${ORDER_TOTAL}
            </span>
          </div>

          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Payment method
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PayMethod)}
              data-testid="pay-method"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-zinc-900 focus:border-shop-accent focus:outline-none"
            >
              {cardOffered(ORDER_TOTAL) && <option value="card">Card</option>}
              <option value="cash">Cash</option>
            </select>
          </label>

          <button
            type="button"
            data-testid="pay-submit"
            onClick={handlePay}
            className="rounded-lg bg-shop-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Pay ${ORDER_TOTAL}
          </button>

          {result && (
            <div
              data-testid="pay-result"
              className={`rounded-lg border px-3 py-2 text-sm ${
                result.ok
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              <span data-testid="pay-message">{result.message}</span>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-zinc-200 px-6 py-4 text-center text-xs text-zinc-400">
        BuggyShop is the QA Mastery practice app. Every bug is intentional.
      </footer>
    </div>
  );
}
