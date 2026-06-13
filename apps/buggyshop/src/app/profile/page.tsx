"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getActiveRelease } from "@/lib/catalog";
import { isProfileEmailAccepted } from "@/lib/profile";

const SESSION_STORAGE_KEY = "bs-session";

export default function ProfilePage() {
  const [email, setEmail] = useState("tester@example.com");
  const [saved, setSaved] = useState<{ email: string; accepted: boolean } | null>(null);

  const release = useMemo(() => {
    if (typeof window === "undefined") return getActiveRelease(null);
    return getActiveRelease(localStorage.getItem(SESSION_STORAGE_KEY));
  }, []);

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved({ email: email.trim(), accepted: isProfileEmailAccepted(email, release) });
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
          <Link href="/profile" data-testid="nav-profile" className="text-shop-accent">
            Profile
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-6 py-12">
        <h1 className="text-2xl font-bold tracking-tight">Edit your profile</h1>

        <form onSubmit={onSave} className="mt-6 space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
          <label className="flex flex-col gap-1 text-sm text-zinc-700">
            Email
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              data-testid="profile-email"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-shop-accent focus:outline-none"
            />
          </label>
          <button
            type="submit"
            data-testid="profile-save"
            className="w-full rounded-lg bg-shop-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Save
          </button>
        </form>

        {saved && (
          <div
            data-testid="profile-result"
            className={
              saved.accepted
                ? "mt-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                : "mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
            }
          >
            <span data-testid="profile-verdict">
              {saved.accepted ? "Saved" : "Invalid email — not saved"}
            </span>
            <span className="ml-1 text-zinc-500">({saved.email || "empty"})</span>
          </div>
        )}

        <p className="mt-6 text-xs text-zinc-400">
          Change the email to an obviously invalid address and see whether it still saves.
        </p>
      </main>

      <footer className="border-t border-zinc-200 px-6 py-4 text-center text-xs text-zinc-400">
        BuggyShop is the QA Mastery practice app. Every bug is intentional.
      </footer>
    </div>
  );
}
