"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { readRelease } from "@/lib/catalog";
import { authenticate, rememberMeHonored, type AuthResult } from "@/lib/login";


export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [result, setResult] = useState<AuthResult | null>(null);
  const [rememberHonored, setRememberHonored] = useState(false);

  const release = useMemo(() => readRelease(), []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(authenticate(email, password, release));
    setRememberHonored(rememberMeHonored(rememberMe, release));
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
          <Link href="/signup" data-testid="nav-signup" className="hover:text-shop-accent">
            Sign up
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-6 py-12">
        <h1 className="text-2xl font-bold tracking-tight">Log in</h1>

        <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            Email
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              data-testid="login-email"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-shop-accent focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              data-testid="login-password"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-shop-accent focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              data-testid="remember-me"
              className="h-4 w-4 rounded border-zinc-300 text-shop-accent focus:ring-shop-accent"
            />
            Remember me (keep me signed in)
          </label>
          <button
            type="submit"
            data-testid="login-submit"
            className="w-full rounded-lg bg-shop-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Log in
          </button>
        </form>

        {result && (
          <div
            data-testid="login-result"
            className={
              result.ok
                ? "mt-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                : "mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
            }
          >
            <span data-testid="login-message">{result.message}</span>
            {result.ok && (
              <span data-testid="remember-status" className="mt-1 block">
                Remember me: {rememberHonored ? "on" : "off"}
              </span>
            )}
          </div>
        )}

        <p className="mt-6 text-xs text-zinc-400">
          Demo account: shopper@buggyshop.test / password1. Try a wrong password and read the error closely.
        </p>
      </main>

      <footer className="border-t border-zinc-200 px-6 py-4 text-center text-xs text-zinc-400">
        BuggyShop is the QA Mastery practice app. Every bug is intentional.
      </footer>
    </div>
  );
}
