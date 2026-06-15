import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Reveal } from "@/components/motion";

export const metadata: Metadata = { title: "Certificate" };

interface LessonRow {
  id: string;
  modules: { tracks: { slug: string; title: string } | null } | null;
}

interface PageProps {
  params: Promise<{ track: string }>;
}

/**
 * A learner earns a (non-accredited, honest) certificate for a track once every
 * published lesson in it is complete. Until then the page shows progress toward
 * it — completion is computed server-side from their own RLS-scoped progress.
 */
export default async function CertificatePage({ params }: PageProps) {
  const { track } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound(); // layout already gates (app); defensive

  const [{ data: lessonRows }, { data: profile }, { data: progressRows }] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, modules!inner(tracks!inner(slug, title))")
      .eq("status", "published"),
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle<{
      display_name: string | null;
    }>(),
    supabase.from("progress").select("lesson_id, status").eq("status", "completed"),
  ]);

  const inTrack = ((lessonRows ?? []) as unknown as LessonRow[]).filter(
    (l) => l.modules?.tracks?.slug === track,
  );
  if (inTrack.length === 0) notFound();

  const trackTitle = inTrack[0].modules!.tracks!.title;
  const completed = new Set((progressRows ?? []).map((p) => p.lesson_id as string));
  const done = inTrack.filter((l) => completed.has(l.id)).length;
  const total = inTrack.length;
  const earned = done === total;
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
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight">{trackTitle}</h1>
          <p className="mt-4 text-zinc-400" data-testid="certificate-locked">
            Not earned yet — {done} / {total} lessons complete. Finish the track to unlock your
            certificate.
          </p>
          <Link href="/dashboard" className="mt-6 inline-block text-sm text-accent hover:text-emerald-300">
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
          className="rounded-3xl border border-accent/30 bg-zinc-900/60 px-10 py-14 text-center shadow-2xl shadow-black/40 backdrop-blur"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Certificate of Completion
          </p>
          <p className="mt-8 text-sm text-zinc-500">This certifies that</p>
          <p className="font-display mt-2 text-4xl font-semibold tracking-tight text-zinc-50">
            {learner}
          </p>
          <p className="mt-6 text-sm text-zinc-500">has completed all {total} lessons of</p>
          <p className="font-display mt-1 text-2xl font-semibold tracking-tight text-accent">
            {trackTitle}
          </p>
          <p className="mt-8 text-xs text-zinc-500">Issued {issued} · QA Mastery</p>
          <p className="mt-6 text-[11px] text-zinc-600">
            A non-accredited certificate of completion — proof of the work you did, not a formal
            qualification.
          </p>
        </article>
        <div className="mt-6 text-center">
          <Link href="/dashboard" className="text-sm text-accent hover:text-emerald-300">
            ← Back to your learning
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
