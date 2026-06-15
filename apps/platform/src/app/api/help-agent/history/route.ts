import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { HelpAgentMessage } from "@/lib/help-agent/types";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const { data, error } = await supabase
    .from("help_agent_messages")
    .select("id, role, content, pathname, lesson_slug, session_id, created_at")
    .eq("user_id", user.id)
    .gte("created_at", cutoff.toISOString())
    .order("created_at", { ascending: true })
    .limit(40);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: (data ?? []) as HelpAgentMessage[] });
}
