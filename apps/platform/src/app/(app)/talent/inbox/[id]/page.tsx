import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMessages } from "../../actions";
import { ConversationThread } from "../../_components/conversation-thread";

type Params = { params: Promise<{ id: string }> };

/** Conversation thread shell (RSC) — auth + initial messages, then the client
 *  Realtime island takes over. RLS guarantees a non-participant gets nothing. */
export default async function ConversationPage({ params }: Params) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Participant check via RLS: a non-participant can't read the conversation.
  const { data: convo } = await supabase
    .from("talent_conversations")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!convo) notFound();

  const res = await getMessages(id);
  const messages = res.ok ? res.data : [];

  return (
    <div className="space-y-4 py-2">
      <Link href="/talent/inbox" className="text-sm text-zinc-400 hover:text-zinc-200">
        ← Inbox
      </Link>
      <ConversationThread conversationId={id} currentUserId={user.id} initial={messages} />
    </div>
  );
}
