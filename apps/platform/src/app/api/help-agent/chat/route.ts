import { guardedStream, streamChat } from "@qa-mastery/agent";
import { buildAgentContext } from "@/lib/help-agent/context";
import {
  persistMessage,
  touchProfileOnMessage,
} from "@/lib/help-agent/brain-consolidation";
import { buildSystemPrompt } from "@/lib/help-agent/prompt";
import { assertWithinRateLimit } from "@/lib/help-agent/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface ChatRequestBody {
  message: string;
  pathname?: string;
  sessionId: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const message = body.message?.trim();
  if (!message || message.length > 2000) {
    return new Response(JSON.stringify({ error: "Message must be 1–2000 characters" }), {
      status: 400,
    });
  }
  if (!body.sessionId) {
    return new Response(JSON.stringify({ error: "sessionId is required" }), { status: 400 });
  }

  try {
    await assertWithinRateLimit(user.id);
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 429 });
  }

  const pathname = body.pathname ?? null;
  const history = body.history ?? [];
  const assistantTurn = history.filter((m) => m.role === "assistant").length + 1;

  const { contextBlock, lessonSlug, profile } = await buildAgentContext({
    userId: user.id,
    pathname,
    assistantTurn,
  });

  const updatedProfile = await touchProfileOnMessage(user.id);
  const activeProfile = profile ?? updatedProfile;

  await persistMessage({
    userId: user.id,
    role: "user",
    content: message,
    pathname,
    lessonSlug,
    sessionId: body.sessionId,
  });

  const systemPrompt = buildSystemPrompt({
    brainStage: activeProfile.brain_stage,
    brainDayCount: activeProfile.brain_day_count,
    summary: activeProfile.summary,
    weakTopics: activeProfile.weak_topics,
    strongTopics: activeProfile.strong_topics,
    hintPreference: activeProfile.hint_preference,
    contextBlock,
    assistantTurn,
  });

  const llmMessages = [
    { role: "system" as const, content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: message },
  ];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // guardedStream applies the streaming-safe guard (flush only guard-clean
        // text, hold back a forming tail) and returns the text to persist.
        const gen = guardedStream(streamChat(llmMessages), assistantTurn);
        let res = await gen.next();
        while (!res.done) {
          controller.enqueue(encoder.encode(res.value));
          res = await gen.next();
        }

        await persistMessage({
          userId: user.id,
          role: "assistant",
          content: res.value,
          pathname,
          lessonSlug,
          sessionId: body.sessionId,
        });

        controller.close();
      } catch (err) {
        // Keep the learner-facing message generic; log the cause server-side.
        controller.enqueue(
          encoder.encode("Sorry, the tutor is unavailable right now. Please try again in a moment."),
        );
        console.error("help-agent chat error:", (err as Error).message);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
