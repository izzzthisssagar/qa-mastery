"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { selectRole } from "@/app/(app)/talent/actions";

const ROLES = [
  {
    value: "tester",
    title: "I'm a QA tester",
    blurb: "Showcase proof and get hired for testing work.",
    next: "/talent/profile",
  },
  {
    value: "client",
    title: "I need testing done",
    blurb: "Post a project and find the right tester.",
    next: "/talent",
  },
  {
    value: "both",
    title: "Both",
    blurb: "Hire testers and take testing work yourself.",
    next: "/talent/profile",
  },
] as const;

export function RoleChooser() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [picked, setPicked] = useState<string | null>(null);

  function choose(value: string, next: string) {
    setError(null);
    setPicked(value);
    startTransition(async () => {
      const res = await selectRole(value);
      if (!res.ok) {
        setError(res.error);
        setPicked(null);
        return;
      }
      router.push(next);
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {ROLES.map((r) => (
          <button
            key={r.value}
            type="button"
            disabled={pending}
            onClick={() => choose(r.value, r.next)}
            className={
              "rounded-xl border p-5 text-left transition-colors disabled:opacity-60 " +
              (picked === r.value
                ? "border-emerald-500/50 bg-emerald-500/10"
                : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-600")
            }
          >
            <h2 className="font-medium text-zinc-100">{r.title}</h2>
            <p className="mt-1 text-sm text-zinc-400">{r.blurb}</p>
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
