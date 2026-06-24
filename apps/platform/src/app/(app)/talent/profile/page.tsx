import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileEditor } from "../_components/profile-editor";

/** Tester profile editor shell (RSC) — loads the caller's profile, hands it to
 *  the client editor island. */
export default async function TalentProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("talent_profiles")
    .select("handle, headline, bio, location, specialties, stack, availability, is_public")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-6 py-2">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Your tester profile</h1>
        <p className="text-sm text-zinc-400">Proof first — this is what teams see when they search.</p>
      </header>

      <ProfileEditor
        initial={{
          handle: profile?.handle ?? undefined,
          headline: profile?.headline ?? undefined,
          bio: profile?.bio ?? undefined,
          location: profile?.location ?? undefined,
          specialties: (profile?.specialties as string[] | null) ?? [],
          stack: (profile?.stack as string[] | null) ?? [],
          availability: profile?.availability ?? "open",
          isPublic: Boolean(profile?.is_public),
        }}
      />
    </div>
  );
}
