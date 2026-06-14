"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { readRelease } from "@/lib/catalog";
import { isZipAccepted } from "@/lib/checkout";


export default function CheckoutPage() {
  const [zip, setZip] = useState("");
  const [submitted, setSubmitted] = useState<{ zip: string; accepted: boolean } | null>(null);

  const release = useMemo(() => readRelease(), []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted({ zip: zip.trim(), accepted: isZipAccepted(zip, release) });
  }

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
          <Link href="/checkout" data-testid="nav-checkout" className="text-shop-accent">
            Checkout
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-6 py-12">
        <h1 className="text-2xl font-bold tracking-tight">Shipping address</h1>

        <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            ZIP / postal code
            <input
              type="text"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="12345"
              data-testid="zip-input"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-shop-accent focus:outline-none"
            />
          </label>
          <button
            type="submit"
            data-testid="checkout-submit"
            className="w-full rounded-lg bg-shop-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Continue
          </button>
        </form>

        {submitted && (
          <div
            data-testid="zip-result"
            className={
              submitted.accepted
                ? "mt-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                : "mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
            }
          >
            <span data-testid="zip-verdict">
              {submitted.accepted ? "ZIP accepted ✓" : "ZIP rejected ✗"}
            </span>
            <span className="ml-1 text-zinc-500">({submitted.zip || "empty"})</span>
          </div>
        )}

        <p className="mt-6 text-xs text-zinc-400">
          Try a code with letters in it and see whether it slips through.
        </p>
      </main>

      <footer className="border-t border-zinc-200 px-6 py-4 text-center text-xs text-zinc-400">
        BuggyShop is the QA Mastery practice app. Every bug is intentional.
      </footer>
    </div>
  );
}
