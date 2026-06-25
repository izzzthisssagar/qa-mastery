import Link from "next/link";
import { searchTesters, type TesterFilters } from "../actions";
import { TesterCard } from "../_components/tester-card";
import { FilterRail } from "../_components/filter-rail";
import { EmptyState } from "../_components/empty-state";

type Search = { [key: string]: string | string[] | undefined };

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Tester directory — RSC list + client filter rail. Filters come from the URL
 *  (FilterRail writes them), so the page is shareable and SSR-rendered. */
export default async function TestersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const filters: TesterFilters = {
    specialties: (str(sp.spec) ?? "").split(",").filter(Boolean),
    availability: str(sp.avail),
    verifiedOnly: str(sp.verified) === "1",
    cursor: str(sp.cursor),
  };

  const res = await searchTesters(filters);
  const items = res.ok ? res.data.items : [];
  const nextCursor = res.ok ? res.data.nextCursor : null;
  const hasFilters = Boolean(filters.specialties?.length || filters.availability || filters.verifiedOnly);

  // Preserve current filters when paginating.
  const nextParams = new URLSearchParams();
  if (filters.specialties?.length) nextParams.set("spec", filters.specialties.join(","));
  if (filters.availability) nextParams.set("avail", filters.availability);
  if (filters.verifiedOnly) nextParams.set("verified", "1");
  if (nextCursor) nextParams.set("cursor", nextCursor);

  return (
    <div className="space-y-6 py-2">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Find a QA tester</h1>
        <p className="text-sm text-zinc-400">
          Filter on real testing signals — specialty, availability, lab-verified skills.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <FilterRail />
        </aside>

        <div className="space-y-6">
          {items.length === 0 ? (
            <EmptyState filtered={hasFilters} />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((t) => (
                  <TesterCard key={t.handle} tester={t} />
                ))}
              </div>
              {nextCursor && (
                <div className="flex justify-center">
                  <Link
                    href={`/talent/testers?${nextParams.toString()}`}
                    className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500"
                  >
                    Load more
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
