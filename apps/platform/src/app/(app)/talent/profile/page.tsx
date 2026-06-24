import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getReusableArtifacts } from "../actions";
import { ProfileEditor } from "../_components/profile-editor";
import { DeviceEditor, type DeviceRow } from "../_components/device-editor";
import { PortfolioEditor, type PortfolioRow } from "../_components/portfolio-editor";

/** Tester profile editor shell (RSC) — loads the caller's profile, devices,
 *  portfolio and reusable artifacts, hands them to the client editor islands. */
export default async function TalentProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: devices }, { data: portfolio }, reusableRes] =
    await Promise.all([
      supabase
        .from("talent_profiles")
        .select("handle, headline, bio, location, specialties, stack, availability, is_public")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("talent_devices")
        .select("id, kind, device, os, os_version")
        .eq("tester_id", user.id),
      supabase
        .from("talent_portfolio_items")
        .select("id, type, title, is_nda")
        .eq("tester_id", user.id),
      getReusableArtifacts(),
    ]);

  const reusable = reusableRes.ok ? reusableRes.data : [];

  return (
    <div className="space-y-10 py-2">
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

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">Device matrix</h2>
        <p className="text-xs text-zinc-500">
          Real devices you can test on — a top filter for clients, rare on other marketplaces.
        </p>
        <DeviceEditor initial={(devices as DeviceRow[] | null) ?? []} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">Portfolio</h2>
        <PortfolioEditor initial={(portfolio as PortfolioRow[] | null) ?? []} reusable={reusable} />
      </section>
    </div>
  );
}
