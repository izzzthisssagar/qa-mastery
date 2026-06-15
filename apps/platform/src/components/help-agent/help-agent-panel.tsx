"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

const PANEL_EASE = [0.16, 1, 0.3, 1] as const;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface BrainInfo {
  brain_label: string;
  brain_day_count: number;
}

function newSessionId(): string {
  return crypto.randomUUID();
}

export function HelpAgentPanel({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [brain, setBrain] = useState<BrainInfo | null>(null);
  const [sessionId] = useState(newSessionId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    void fetch("/api/help-agent/brain")
      .then((r) => r.json())
      .then((data: BrainInfo) => setBrain(data))
      .catch(() => {});

    void fetch("/api/help-agent/history")
      .then((r) => r.json())
      .then((data: { messages: Array<{ role: "user" | "assistant"; content: string }> }) => {
        if (data.messages?.length) {
          setMessages(data.messages.map((m) => ({ role: m.role, content: m.content })));
        }
      })
      .catch(() => {});
  }, []);

  const consolidate = useCallback(() => {
    void fetch("/api/help-agent/consolidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
  }, [sessionId]);

  useEffect(() => {
    return () => {
      consolidate();
    };
  }, [consolidate]);

  function handleClose() {
    consolidate();
    onClose();
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/help-agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          pathname,
          sessionId,
          history: messages,
        }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `Request failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let assistantText = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        const snapshot = assistantText;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: snapshot };
          return copy;
        });
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: (err as Error).message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      role="dialog"
      aria-label="QA tutor"
      initial={reduce ? false : { opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
      transition={{ duration: 0.22, ease: PANEL_EASE }}
      className="fixed bottom-20 right-4 z-50 flex h-[480px] w-[360px] flex-col overflow-hidden rounded-2xl border border-zinc-700/70 bg-zinc-900/95 shadow-2xl shadow-black/40 backdrop-blur sm:right-6"
    >
      <header className="relative flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        <div className="flex items-center gap-2">
          <span aria-hidden className="h-2 w-2 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
          <div>
            <p className="font-display text-sm font-semibold tracking-tight text-zinc-50">QA Tutor</p>
            <p className="text-xs text-zinc-500">
              {brain
                ? `${brain.brain_label} · Day ${brain.brain_day_count}`
                : "Getting to know you…"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-lg px-2 py-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          aria-label="Close tutor"
        >
          ✕
        </button>
      </header>

      <div
        role="log"
        aria-live="polite"
        aria-label="Tutor conversation"
        className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
      >
        {messages.length === 0 && (
          <p className="text-sm text-zinc-500">
            Stuck on a lesson? Ask me — I&apos;ll hint first, then explain more if you need it.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[90%] rounded-2xl border px-3 py-2 text-sm leading-relaxed ${
              m.role === "user"
                ? "ml-auto border-accent/25 bg-accent/15 text-zinc-100"
                : "border-zinc-700/60 bg-zinc-800/80 text-zinc-300"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <p className="text-xs text-zinc-500 animate-pulse">Thinking…</p>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex gap-2 border-t border-zinc-800 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          type="text"
          aria-label="Ask the tutor a question"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          disabled={loading}
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-zinc-950 transition-opacity disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </motion.div>
  );
}
