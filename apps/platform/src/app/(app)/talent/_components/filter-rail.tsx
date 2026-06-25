"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { AVAILABILITY, SPECIALTIES, labelFor } from "@/lib/talent/taxonomy";

/** QA-native filters. URL searchParams are the source of truth (shareable,
 *  SSR-readable, back-button correct) — the rail just rewrites them. */
export function FilterRail() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const specs = (params.get("spec") ?? "").split(",").filter(Boolean);
  const avail = params.get("avail") ?? "";
  const verified = params.get("verified") === "1";

  const commit = useCallback(
    (next: URLSearchParams) => {
      next.delete("cursor"); // any filter change resets pagination
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  function toggleSpec(s: string) {
    const next = new URLSearchParams(params.toString());
    const set = new Set(specs);
    if (set.has(s)) set.delete(s);
    else set.add(s);
    if (set.size) next.set("spec", [...set].join(","));
    else next.delete("spec");
    commit(next);
  }

  function setAvail(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== avail) next.set("avail", value);
    else next.delete("avail");
    commit(next);
  }

  function toggleVerified() {
    const next = new URLSearchParams(params.toString());
    if (verified) next.delete("verified");
    else next.set("verified", "1");
    commit(next);
  }

  function clearAll() {
    router.replace(pathname, { scroll: false });
  }

  const chip = (on: boolean) =>
    "rounded-full border px-3 py-1 text-xs transition-colors " +
    (on
      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-200"
      : "border-zinc-700 text-zinc-400 hover:border-zinc-500");

  const hasAny = specs.length > 0 || avail || verified;

  return (
    <nav aria-label="Tester filters" className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Specialty</h2>
        <div className="flex flex-wrap gap-2">
          {SPECIALTIES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={specs.includes(s)}
              onClick={() => toggleSpec(s)}
              className={chip(specs.includes(s))}
            >
              {labelFor(s)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">Availability</h2>
        <div className="flex flex-wrap gap-2">
          {AVAILABILITY.map((a) => (
            <button
              key={a}
              type="button"
              aria-pressed={avail === a}
              onClick={() => setAvail(a)}
              className={chip(avail === a)}
            >
              {labelFor(a)}
            </button>
          ))}
        </div>
      </div>

      <button type="button" aria-pressed={verified} onClick={toggleVerified} className={chip(verified)}>
        ✓ Verified skills only
      </button>

      {hasAny && (
        <button type="button" onClick={clearAll} className="block text-xs text-zinc-500 hover:text-zinc-300">
          Clear filters
        </button>
      )}
    </nav>
  );
}
