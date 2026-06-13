"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getActiveRelease } from "@/lib/catalog";
import { shippingLabel } from "@/lib/cart";

const SESSION_STORAGE_KEY = "bs-session";

const UNIT_PRICE = 999;

export default function CartPage() {
  const [qty, setQty] = useState(1);

  // Release decides which seeded bugs are live. Read once from the session if
  // the learner arrived via the handoff; default release otherwise.
  const release = useMemo(() => {
    if (typeof window === "undefined") return getActiveRelease(null);
    return getActiveRelease(localStorage.getItem(SESSION_STORAGE_KEY));
  }, []);

  const subtotal = UNIT_PRICE * qty;
  const shipping = shippingLabel(subtotal, release);

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
          <Link href="/cart" data-testid="nav-cart" className="text-shop-accent">
            Cart ({qty})
          </Link>
          <span className="cursor-not-allowed opacity-60" data-testid="nav-login">
            Log in
          </span>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight">Cart</h1>

        <div
          data-testid="cart-line"
          className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4"
        >
          <div className="flex flex-col">
            <span className="font-medium text-zinc-900">Annual Membership</span>
            <span className="text-sm text-zinc-500">${UNIT_PRICE}.00 each</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="cart-qty-decrement"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="h-8 w-8 rounded-lg border border-zinc-300 text-zinc-600 hover:border-zinc-400"
            >
              −
            </button>
            <span
              data-testid="cart-qty"
              className="w-8 text-center font-medium text-zinc-900"
            >
              {qty}
            </span>
            <button
              type="button"
              data-testid="cart-qty-increment"
              onClick={() => setQty((q) => q + 1)}
              className="h-8 w-8 rounded-lg border border-zinc-300 text-zinc-600 hover:border-zinc-400"
            >
              +
            </button>
          </div>
        </div>

        <dl className="mt-6 flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between text-sm">
            <dt className="text-zinc-600">Subtotal</dt>
            <dd data-testid="cart-subtotal" className="font-medium text-zinc-900">
              ${subtotal}.00
            </dd>
          </div>
          <div className="flex items-center justify-between text-sm">
            <dt className="text-zinc-600">Shipping</dt>
            <dd data-testid="cart-shipping" className="font-medium text-shop-accent">
              {shipping}
            </dd>
          </div>
        </dl>

        <p className="mt-4 text-xs text-zinc-500">
          Free shipping on orders over $999.
        </p>
      </main>

      <footer className="border-t border-zinc-200 px-6 py-4 text-center text-xs text-zinc-400">
        BuggyShop is the QA Mastery practice app. Every bug is intentional.
      </footer>
    </div>
  );
}
