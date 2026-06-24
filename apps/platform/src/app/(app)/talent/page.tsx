import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Talent hub — role-aware entry to the marketplace. */
export default async function TalentHubPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("talent_profiles")
        .select("handle, is_public")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const handle = profile?.handle as string | undefined;
  const isPublic = Boolean(profile?.is_public);

  return (
    <div className="space-y-8 py-2">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          QA Mastery <span className="text-accent">Talent</span>
        </h1>
        <p className="max-w-xl text-zinc-400">
          The hiring layer for QA. Show real proof — bug reports, automation scripts, your device
          matrix, lab-verified skills — and let teams find you.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/talent/profile"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 transition-colors hover:border-zinc-600"
        >
          <h2 className="font-medium text-zinc-100">
            {handle ? "Edit your tester profile" : "Create your tester profile"}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Skills, device matrix and portfolio proof.{" "}
            {isPublic ? (
              <span className="text-accent">Live</span>
            ) : (
              <span className="text-zinc-500">Draft</span>
            )}
          </p>
        </Link>

        {handle ? (
          <Link
            href={`/talent/u/${handle}`}
            className="group rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 transition-colors hover:border-zinc-600"
          >
            <h2 className="font-medium text-zinc-100">View your public profile</h2>
            <p className="mt-1 text-sm text-zinc-400">
              /talent/u/{handle} — share it anywhere.
            </p>
          </Link>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800 p-5 text-sm text-zinc-500">
            Your public profile appears here once you pick a handle.
          </div>
        )}
      </div>
    </div>
  );
}
