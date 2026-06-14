"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  filterByMaxPrice,
  readRelease,
  searchByName,
  sortByPrice,
  PRODUCTS,
  type SortDir,
} from "@/lib/catalog";


export default function ProductsPage() {
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<SortDir>("none");

  // Release decides which seeded bugs are live. Read once from the session if
  // the learner arrived via the handoff; default release otherwise.
  const release = useMemo(() => readRelease(), []);

  const maxPrice = maxPriceInput.trim() === "" ? null : Number(maxPriceInput);
  const visible = sortByPrice(
    filterByMaxPrice(searchByName(PRODUCTS, search, release), maxPrice, release),
    sortDir,
    release,
  );

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
          <Link href="/products" data-testid="nav-products" className="text-shop-accent">
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

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>

        <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Search
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. mug"
              data-testid="search-input"
              className="w-44 rounded-lg border border-zinc-300 px-3 py-1.5 text-zinc-900 focus:border-shop-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Sort
            <select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as SortDir)}
              data-testid="sort-select"
              className="w-44 rounded-lg border border-zinc-300 px-3 py-1.5 text-zinc-900 focus:border-shop-accent focus:outline-none"
            >
              <option value="none">Featured</option>
              <option value="asc">Price: low to high</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Max price ($)
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={maxPriceInput}
              onChange={(e) => setMaxPriceInput(e.target.value)}
              placeholder="e.g. 100"
              data-testid="max-price-input"
              className="w-40 rounded-lg border border-zinc-300 px-3 py-1.5 text-zinc-900 focus:border-shop-accent focus:outline-none"
            />
          </label>
          {maxPriceInput.trim() !== "" && (
            <button
              type="button"
              data-testid="clear-filter"
              onClick={() => setMaxPriceInput("")}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:border-zinc-400"
            >
              Clear
            </button>
          )}
          <span data-testid="result-count" className="ml-auto text-sm text-zinc-500">
            {visible.length} of {PRODUCTS.length} products
          </span>
        </div>

        <ul
          data-testid="product-grid"
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {visible.map((product) => (
            <li
              key={product.id}
              data-testid={`product-card-${product.id}`}
              className="flex flex-col rounded-xl border border-zinc-200 bg-white p-4"
            >
              <span className="text-xs uppercase tracking-wide text-zinc-400">
                {product.category}
              </span>
              <span className="mt-1 font-medium text-zinc-900">{product.name}</span>
              <span
                data-testid={`product-price-${product.id}`}
                className="mt-2 text-lg font-semibold text-shop-accent"
              >
                ${product.price}
              </span>
              <Link
                href={`/products/${product.id}`}
                data-testid={`view-${product.id}`}
                className="mt-2 text-xs font-medium text-shop-accent hover:underline"
              >
                View →
              </Link>
            </li>
          ))}
        </ul>

        {visible.length === 0 && (
          <p data-testid="empty-state" className="mt-10 text-center text-sm text-zinc-500">
            No products match that filter.
          </p>
        )}
      </main>

      <footer className="border-t border-zinc-200 px-6 py-4 text-center text-xs text-zinc-400">
        BuggyShop is the QA Mastery practice app. Every bug is intentional.
      </footer>
    </div>
  );
}
