import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@qa-mastery/ui";
import { getPublicProfile } from "@/app/(app)/talent/actions";
import { labelFor } from "@/lib/talent/taxonomy";
import { availabilityTone, portfolioTypeTone } from "@/lib/talent/status";

type Params = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { handle } = await params;
  const res = await getPublicProfile(handle);
  if (!res.ok) return { title: "Tester not found — QA Mastery Talent" };
  const p = res.data.profile;
  const headline = (p.headline as string) || "QA tester on QA Mastery Talent";
  return {
    title: `${p.handle} — QA Mastery Talent`,
    description: headline,
    openGraph: { title: `${p.handle} — QA tester`, description: headline },
  };
}

export default async function PublicProfilePage({ params }: Params) {
  const { handle } = await params;
  const res = await getPublicProfile(handle);
  if (!res.ok) notFound();
  const { profile, portfolio, devices, badges } = res.data;

  const specialties = (profile.specialties as string[] | null) ?? [];
  const stack = (profile.stack as string[] | null) ?? [];
  const availability = (profile.availability as string) ?? "open";

  return (
    <div className="space-y-8 py-2">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold tracking-tight">{profile.handle as string}</h1>
          <Badge tone={availabilityTone[availability] ?? "default"}>{labelFor(availability)}</Badge>
          {(profile.verification_status as string) === "verified" && <Badge tone="success">Verified</Badge>}
        </div>
        {(profile.headline as string) && (
          <p className="max-w-2xl text-lg text-zinc-300">{profile.headline as string}</p>
        )}
        {(profile.location as string) && (
          <p className="text-sm text-zinc-500">{profile.location as string}</p>
        )}
      </header>

      {badges.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-400">Verified skills</h2>
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <Badge key={b.id as string} tone="success">
                {(b.skill as string)} · {b.score as number}%
              </Badge>
            ))}
          </div>
        </section>
      )}

      {specialties.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-400">Specialties</h2>
          <div className="flex flex-wrap gap-2">
            {specialties.map((s) => (
              <Badge key={s} tone="info">
                {labelFor(s)}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {stack.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-400">Automation stack</h2>
          <div className="flex flex-wrap gap-2 font-mono text-xs text-zinc-300">
            {stack.map((s) => (
              <span key={s} className="rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1">
                {labelFor(s)}
              </span>
            ))}
          </div>
        </section>
      )}

      {devices.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-400">Device matrix</h2>
          <div className="flex flex-wrap gap-2 font-mono text-xs text-zinc-300">
            {devices.map((d) => (
              <span
                key={d.id as string}
                className="rounded-md border border-zinc-800 bg-zinc-900/60 px-2 py-1"
              >
                {(d.device as string)}
                {d.os ? ` · ${d.os as string}` : ""}
                {d.os_version ? ` ${d.os_version as string}` : ""}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-400">Portfolio</h2>
        {portfolio.length === 0 ? (
          <p className="text-sm text-zinc-500">No portfolio items yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {portfolio.map((item) => (
              <article
                key={item.id as string}
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Badge tone={portfolioTypeTone[item.type as string] ?? "default"}>
                    {labelFor(item.type as string)}
                  </Badge>
                  {Boolean(item.is_nda) && <Badge tone="info">NDA</Badge>}
                </div>
                <h3 className="font-medium text-zinc-100">{item.title as string}</h3>
                {(item.body as string) && (
                  <p className="mt-1 line-clamp-4 text-sm text-zinc-400">{item.body as string}</p>
                )}
                {(item.repo_url as string) && (
                  <a
                    href={item.repo_url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-accent hover:underline"
                  >
                    View repo →
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
