"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createBrowserSupabase } from "@qa-mastery/db";
import { Button } from "@qa-mastery/ui";
import { useReducedMotion } from "@/components/motion";
import { markRead, sendMessage, type Message } from "@/app/(app)/talent/actions";

function Bubble({ m, mine }: { m: Message; mine: boolean }) {
  return (
    <div className={"flex " + (mine ? "justify-end" : "justify-start")}>
      <div
        className={
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm " +
          (mine
            ? "bg-emerald-500/15 text-emerald-50"
            : "border border-zinc-800 bg-zinc-900/60 text-zinc-200")
        }
      >
        <p className="whitespace-pre-wrap break-words">{m.body}</p>
      </div>
    </div>
  );
}

export function ConversationThread({
  conversationId,
  currentUserId,
  initial,
}: {
  conversationId: string;
  currentUserId: string;
  initial: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Live delivery via RLS-authorized Postgres Changes on talent_messages.
  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`talent:convo:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "talent_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Scroll to newest + mark the other party's messages read.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    void markRead(conversationId);
  }, [messages, conversationId, reduce]);

  function send() {
    const body = draft.trim();
    if (!body) return;
    setError(null);
    setDraft("");
    startTransition(async () => {
      const res = await sendMessage(conversationId, body);
      if (!res.ok) {
        setError(res.error);
        setDraft(body);
        return;
      }
      // Render it immediately (don't depend on the realtime echo, which can lag
      // or — in some environments — not arrive). The realtime INSERT, if/when it
      // arrives, dedups by id in the subscription handler.
      setMessages((prev) =>
        prev.some((m) => m.id === res.data.id)
          ? prev
          : [
              ...prev,
              {
                id: res.data.id,
                sender_id: currentUserId,
                body,
                created_at: new Date().toISOString(),
                read_at: null,
              },
            ],
      );
    });
  }

  return (
    <div className="flex h-[60vh] flex-col gap-3">
      <div
        aria-live="polite"
        className="flex-1 space-y-2 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/40 p-4"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-500">No messages yet — say hello.</p>
        ) : (
          messages.map((m) => <Bubble key={m.id} m={m} mine={m.sender_id === currentUserId} />)
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <div className="flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          placeholder="Write a message… (Enter to send, Shift+Enter for a new line)"
          aria-label="Message"
          className="min-h-12 flex-1 resize-y rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus-visible:border-zinc-500"
        />
        <Button onClick={send} disabled={pending || !draft.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
