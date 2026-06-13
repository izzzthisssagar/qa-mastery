import Link from "next/link";

export default function ShopHomePage() {
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
          <Link href="/signup" data-testid="nav-signup" className="hover:text-shop-accent">
            Sign up
          </Link>
          <span className="cursor-not-allowed opacity-60" data-testid="nav-cart">
            Cart (0)
          </span>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <h1 data-testid="hero-title" className="text-4xl font-bold tracking-tight">
          BuggyShop
        </h1>
        <p data-testid="hero-tagline" className="mt-3 text-lg text-zinc-500">
          everything for testers who shop
        </p>
        <p
          data-testid="release-notice"
          className="mt-10 max-w-md rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-4 text-sm text-zinc-500"
        >
          Release v1.0 — the <Link href="/products" className="text-shop-accent underline">products</Link>{" "}
          page is open (mind the price filter). Cart, checkout and the rest of
          the 20 seeded bugs are being stocked.
        </p>
      </main>

      <footer className="border-t border-zinc-200 px-6 py-4 text-center text-xs text-zinc-400">
        BuggyShop is the QA Mastery practice app. Every bug is intentional.
        Data here is sandboxed per learner and resettable.
      </footer>
    </div>
  );
}
