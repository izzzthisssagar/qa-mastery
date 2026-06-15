import { NextResponse } from "next/server";
import { consolidateAllActiveBrains, consolidateBrain } from "@/lib/help-agent/brain-consolidation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const cronSecret = process.env.HELP_AGENT_CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (isCron) {
    const count = await consolidateAllActiveBrains();
    return NextResponse.json({ ok: true, consolidated: count });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let sessionId: string | undefined;
  try {
    const body = (await request.json()) as { sessionId?: string };
    sessionId = body.sessionId;
  } catch {
    // optional body
  }

  await consolidateBrain(user.id, sessionId);
  return NextResponse.json({ ok: true });
}
