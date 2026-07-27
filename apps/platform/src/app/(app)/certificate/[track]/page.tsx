import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Reveal } from "@/components/motion";
import { getNotesCurriculumProgress } from "@/app/(app)/notes/actions";

export const metadata: Metadata = { title: "Certificate" };

interface PageProps {
  params: Promise<{ track: string }>;
}

/**
 * A learner earns a (non-accredited, honest) certificate for a notes track once
 * every backed topic in it is complete. Until then the page shows progress
 * toward it — completion comes from getNotesCurriculumProgress, which is scored
 * server-side from the learner's own note_progress rows.
 */
export default async function CertificatePage({ params }: PageProps) {
  const { track: trackSlug } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound(); // layout already gates (app); defensive

  const [tracks, { data: profile }] = await Promise.all([
    getNotesCurriculumProgress(),
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle<{
      display_name: string | null;
    }>(),
  ]);

  const track = tracks.find((t) => t.slug === trackSlug);
  if (!track) notFound();

  const done = track.topicsDone;
  const total = track.topicCount;
  const earned = track.certEarned;
  const learner = profile?.display_name || "QA learner";
  const issued = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (!earned) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Certificate</p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight">{track.title}</h1>
          <p className="mt-4 text-muted-foreground" data-testid="certificate-locked">
            Not earned yet — {done} / {total} notes complete. Finish the track to unlock your
            certificate.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block text-sm text-accent hover:opacity-80"
          >
            ← Back to your learning
          </Link>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="relative isolate mx-auto max-w-3xl py-16">
      <div aria-hidden className="grain pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-80 bg-glow" />
      </div>
      <Reveal>
        <article
          data-testid="certificate-earned"
          className="rounded-3xl border border-accent/30 bg-surface/60 px-10 py-14 text-center shadow-2xl shadow-black/40 backdrop-blur"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Certificate of Completion
          </p>
          <p className="mt-8 text-sm text-muted-foreground">This certifies that</p>
          <p className="font-display mt-2 text-4xl font-semibold tracking-tight text-foreground">
            {learner}
          </p>
          <p className="mt-6 text-sm text-muted-foreground">has completed all {total} notes of</p>
          <p className="font-display mt-1 text-2xl font-semibold tracking-tight text-accent">
            {track.title}
          </p>
          <p className="mt-8 text-xs text-muted-foreground">Issued {issued} · QA Mastery</p>
          <p className="mt-6 text-[11px] text-muted-foreground">
            A non-accredited certificate of completion — proof of the work you did, not a formal
            qualification.
          </p>
        </article>
        <div className="mt-6 text-center">
          <Link href="/dashboard" className="text-sm text-accent hover:opacity-80">
            ← Back to your learning
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
