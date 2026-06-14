"use client";

import { useEffect, useState } from "react";
import { RELEASES, type Release } from "@qa-mastery/shared";
import { readRelease, setRelease } from "@/lib/catalog";

/**
 * Lets a learner flip BuggyShop between releases. Bugs are release-gated via
 * bugFlag, so switching to v1.1 fixes some bugs (BS-007, BS-008) and is how the
 * retest / regression lessons (A5.2) become real. The choice persists in
 * localStorage; a reload re-reads it across all pages.
 */
export function ReleaseSwitcher() {
  const [release, setRel] = useState<Release | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Yield once so the first setState never fires synchronously in the effect.
    void (async () => {
      await Promise.resolve();
      if (!cancelled) setRel(readRelease());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!release) return null;

  function onChange(next: Release) {
    setRelease(next);
    window.location.reload();
  }

  return (
    <div
      data-testid="release-switcher"
      className="fixed bottom-3 right-3 z-50 flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs shadow-sm"
    >
      <span className="text-zinc-500">Release</span>
      <select
        data-testid="release-select"
        value={release}
        onChange={(e) => onChange(e.target.value as Release)}
        className="bg-transparent font-semibold text-zinc-800 focus:outline-none"
      >
        {RELEASES.map((r) => (
          <option key={r} value={r}>
            v{r}
          </option>
        ))}
      </select>
    </div>
  );
}
