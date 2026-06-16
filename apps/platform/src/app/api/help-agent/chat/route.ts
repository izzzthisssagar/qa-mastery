import {
  classifyInScope,
  guardedStream,
  SCOPE_REFUSAL,
  streamChat,
} from "@qa-mastery/agent";
import { buildAgentContext } from "@/lib/help-agent/context";
import {
  persistMessage,
  touchProfileOnMessage,
} from "@/lib/help-agent/brain-consolidation";
import { buildSystemPrompt } from "@/lib/help-agent/prompt";
import { assertWithinRateLimit } from "@/lib/help-agent/rate-limit";
import { parseLessonSlug } from "@/lib/help-agent/types";
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

  // Scope guard — refuse off-topic questions BEFORE spending an answer call
  // (saves tokens and resists jailbreaks into long off-topic replies). Records
  // the exchange so the panel shows the refusal in history.
  if (!(await classifyInScope(message))) {
    const slug = parseLessonSlug(pathname);
    await persistMessage({
      userId: user.id,
      role: "user",
      content: message,
      pathname,
      lessonSlug: slug,
      sessionId: body.sessionId,
    });
    await persistMessage({
      userId: user.id,
      role: "assistant",
      content: SCOPE_REFUSAL,
      pathname,
      lessonSlug: slug,
      sessionId: body.sessionId,
    });
    return new Response(SCOPE_REFUSAL, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
    });
  }

  const { contextBlock, lessonSlug, profile } = await buildAgentContext({
    userId: user.id,
    pathname,
    assistantTurn,
    message,
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
      let streamedAny = false;
      let fullText = "";
      try {
        // guardedStream flushes only guard-clean text and returns the full text
        // to persist as its final value.
        const gen = guardedStream(streamChat(llmMessages), assistantTurn);
        let res = await gen.next();
        while (!res.done) {
          streamedAny = true;
          controller.enqueue(encoder.encode(res.value));
          res = await gen.next();
        }
        fullText = res.value;
      } catch (err) {
        console.error("help-agent chat error:", (err as Error).message);
        // Only surface the fallback if nothing was streamed yet — never append
        // an error after the learner has already received a full answer.
        if (!streamedAny) {
          controller.enqueue(
            encoder.encode("Sorry, the tutor is unavailable right now. Please try again in a moment."),
          );
        }
        controller.close();
        return;
      }

      // Persist AFTER a successful generation. A persistence failure must not
      // corrupt the client stream — the learner already has the answer — so log
      // it and close cleanly rather than throwing the error into the stream.
      try {
        await persistMessage({
          userId: user.id,
          role: "assistant",
          content: fullText,
          pathname,
          lessonSlug,
          sessionId: body.sessionId,
        });
      } catch (err) {
        console.error("help-agent persist error:", (err as Error).message);
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
