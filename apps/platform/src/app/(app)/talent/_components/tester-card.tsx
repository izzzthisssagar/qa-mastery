import Link from "next/link";
import { Badge } from "@qa-mastery/ui";
import { labelFor } from "@/lib/talent/taxonomy";
import { availabilityTone } from "@/lib/talent/status";
import type { TesterCardData } from "@/app/(app)/talent/actions";

/** Directory card — proof-forward (verified badges + specialties up front). */
export function TesterCard({ tester }: { tester: TesterCardData }) {
  return (
    <Link
      href={`/talent/u/${tester.handle}`}
      className="group flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-emerald-500/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-medium text-zinc-100">{tester.handle}</h3>
          {tester.location && <p className="text-xs text-zinc-500">{tester.location}</p>}
        </div>
        <Badge tone={availabilityTone[tester.availability] ?? "default"}>
          {labelFor(tester.availability)}
        </Badge>
      </div>

      {tester.headline && <p className="line-clamp-2 text-sm text-zinc-400">{tester.headline}</p>}

      {tester.badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tester.badges.map((b) => (
            <Badge key={b.skill} tone="success">
              {b.skill} · {b.score}%
            </Badge>
          ))}
        </div>
      )}

      {tester.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tester.specialties.slice(0, 4).map((s) => (
            <Badge key={s} tone="info">
              {labelFor(s)}
            </Badge>
          ))}
        </div>
      )}
    </Link>
  );
}
