"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { readRelease, getProduct, isQuantityAccepted } from "@/lib/catalog";
import { bugFlag, DEFAULT_RELEASE } from "@qa-mastery/shared";


function ShopHeader() {
  return (
    <header
      data-testid="shop-header"
      className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4"
    >
      <Link href="/" data-testid="shop-logo" className="text-lg font-bold">
        🛒 Buggy<span className="text-shop-accent">Shop</span>
      </Link>
      <nav className="flex items-center gap-5 text-sm text-zinc-600">
        <Link href="/products" data-testid="nav-products" className="hover:text-shop-accent">
          Products
        </Link>
        <Link href="/signup" data-testid="nav-signup" className="hover:text-shop-accent">
          Sign up
        </Link>
      </nav>
    </header>
  );
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const product = getProduct(params.id);
  const [qtyInput, setQtyInput] = useState("1");
  const [line, setLine] = useState<{ qty: number; accepted: boolean } | null>(null);
  const [networkError, setNetworkError] = useState(false);

  const [release, setReleaseState] = useState(DEFAULT_RELEASE);
  useEffect(() => {
    let cancelled = false;
    // Yield once so the first setState never fires synchronously in the effect.
    void (async () => {
      await Promise.resolve();
      if (!cancelled) setReleaseState(readRelease());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!product) {
    return (
      <div className="flex flex-1 flex-col">
        <ShopHeader />
        <main className="mx-auto w-full max-w-md flex-1 px-6 py-16 text-center text-sm text-zinc-600">
          <p data-testid="product-not-found">No such product.</p>
          <Link href="/products" className="mt-3 inline-block text-shop-accent">
            Back to products
          </Link>
        </main>
      </div>
    );
  }

  function addToCart() {
    setNetworkError(false);
    
    // BS-022: Chaos Mode (30% chance to fail)
    if (bugFlag("BS-022", release) && Math.random() < 0.3) {
      setNetworkError(true);
      setLine(null);
      return;
    }

    const qty = Number(qtyInput);
    setLine({ qty, accepted: isQuantityAccepted(qty, release) });
  }

  return (
    <div className="flex flex-1 flex-col">
      <ShopHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
        <Link href="/products" className="text-sm text-zinc-500 hover:text-shop-accent">
          ← Products
        </Link>

        <h1 className="mt-4 text-2xl font-bold tracking-tight" data-testid="product-name">
          {product.name}
        </h1>
        <p className="mt-1 text-xs uppercase tracking-wide text-zinc-400">{product.category}</p>
        <p className="mt-2 text-xl font-semibold text-shop-accent" data-testid="product-price">
          ${product.price}
        </p>

        <div className="mt-6 flex items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Quantity
            <input
              type="number"
              value={qtyInput}
              onChange={(e) => setQtyInput(e.target.value)}
              min={0}
              step={1}
              data-testid="qty-input"
              className="w-28 rounded-lg border border-zinc-300 px-3 py-1.5 text-zinc-900 focus:border-shop-accent focus:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={addToCart}
            data-testid="add-to-cart"
            className="rounded-lg bg-shop-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Add to cart
          </button>
        </div>

        {networkError && (
          <p
            data-testid="network-error"
            className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            Network error: the request failed intermittently. Please try again.
          </p>
        )}

        {line &&
          (line.accepted ? (
            <p
              data-testid="cart-line"
              className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            >
              Added: {line.qty} × ${product.price} = ${(line.qty * product.price).toFixed(2)}
            </p>
          ) : (
            <p
              data-testid="qty-rejected"
              className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              Quantity must be a whole number of at least 1.
            </p>
          ))}
      </main>
    </div>
  );
}
