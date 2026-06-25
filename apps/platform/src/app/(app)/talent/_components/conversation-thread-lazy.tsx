"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@qa-mastery/ui";
import type { Message } from "@/app/(app)/talent/actions";

/** Lazy-loads the realtime chat (Supabase websocket client) only when a thread
 *  is actually opened — it never ships to other routes, and a spinner covers
 *  the brief load. */
const ConversationThread = dynamic(
  () => import("./conversation-thread").then((m) => m.ConversationThread),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[60vh] items-center justify-center text-zinc-500">
        <Spinner className="text-zinc-400" />
      </div>
    ),
  },
);

export function ConversationThreadLazy(props: {
  conversationId: string;
  currentUserId: string;
  initial: Message[];
}) {
  return <ConversationThread {...props} />;
}
