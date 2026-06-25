import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PostProjectForm } from "../_components/post-project-form";

/** Post a QA project (client side). */
export default async function PostProjectPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6 py-2">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Post a testing project</h1>
        <p className="text-sm text-zinc-400">
          Tell testers exactly what you need — the more specific, the better the match.
        </p>
      </header>
      <PostProjectForm />
    </div>
  );
}
