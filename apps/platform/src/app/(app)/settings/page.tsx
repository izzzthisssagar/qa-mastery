import type { Metadata } from "next";
import { Card, CardTitle } from "@qa-mastery/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

interface ProfileRow {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", user?.id ?? "")
    .maybeSingle<ProfileRow>();

  return (
    <div className="mx-auto max-w-xl">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent/80">Settings</p>
        <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-zinc-50">
          Your profile
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          How you show up across QA Mastery and on your public portfolio.
        </p>
      </header>

      <Card>
        <CardTitle>Profile</CardTitle>
        <div className="mt-4">
          <SettingsForm
            displayName={data?.display_name ?? ""}
            username={data?.username ?? ""}
            avatarUrl={data?.avatar_url ?? ""}
          />
        </div>
        <p className="mt-6 border-t border-zinc-800/70 pt-4 text-xs text-zinc-600">
          Signed in as {user?.email}
        </p>
      </Card>
    </div>
  );
}
