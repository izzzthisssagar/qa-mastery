import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { HelpAgentProfile } from "@/lib/help-agent/types";
import { brainStageLabel } from "@qa-mastery/agent";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("help_agent_profiles")
    .select(
      "brain_stage, brain_day_count, summary, weak_topics, strong_topics, hint_preference, total_messages",
    )
    .eq("user_id", user.id)
    .maybeSingle<Pick<
      HelpAgentProfile,
      | "brain_stage"
      | "brain_day_count"
      | "summary"
      | "weak_topics"
      | "strong_topics"
      | "hint_preference"
      | "total_messages"
    >>();

  if (!profile) {
    return NextResponse.json({
      brain_stage: "new",
      brain_day_count: 0,
      brain_label: brainStageLabel("new"),
      summary: "",
      weak_topics: [],
      strong_topics: [],
      hint_preference: "hybrid",
      total_messages: 0,
    });
  }

  return NextResponse.json({
    ...profile,
    brain_label: brainStageLabel(profile.brain_stage),
    summary: profile.summary.slice(0, 200),
  });
}
