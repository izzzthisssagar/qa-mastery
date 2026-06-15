import { guardFallback, guardResponse, streamChat, wouldGuard } from "@qa-mastery/agent";
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
  // Streaming-safe guard: only ever flush text that is already guard-clean, and
  // hold back a trailing window so a forbidden phrase can never be sent while it
  // is still forming at the tail. The guard runs *before* the client sees text —
  // not after the whole reply has already streamed.
  const HOLDBACK = 160;
  let fullResponse = "";
  let flushedLen = 0;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let blocked = false;
        for await (const chunk of streamChat(llmMessages)) {
          fullResponse += chunk;
          if (wouldGuard(fullResponse, assistantTurn)) {
            blocked = true;
            break;
          }
          const safeUpto = fullResponse.length - HOLDBACK;
          if (safeUpto > flushedLen) {
            controller.enqueue(encoder.encode(fullResponse.slice(flushedLen, safeUpto)));
            flushedLen = safeUpto;
          }
        }

        let persisted: string;
        if (blocked) {
          // Everything already flushed was guard-clean; replace the rest (where
          // the trip lives, inside the held-back window) with a safe redirect.
          controller.enqueue(encoder.encode("\n\n" + guardFallback()));
          persisted = guardFallback();
        } else {
          const guarded = guardResponse(fullResponse, assistantTurn);
          if (guarded !== fullResponse) {
            // A pattern lived entirely inside the held-back tail — never flushed.
            controller.enqueue(encoder.encode("\n\n" + guardFallback()));
            persisted = guardFallback();
          } else {
            controller.enqueue(encoder.encode(fullResponse.slice(flushedLen)));
            persisted = fullResponse;
          }
        }

        await persistMessage({
          userId: user.id,
          role: "assistant",
          content: persisted,
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
