import Link from "next/link";
import { getConversations } from "../actions";

/** Inbox — the caller's conversations (participant-only via RLS). */
export default async function InboxPage() {
  const res = await getConversations();
  const convos = res.ok ? res.data : [];

  return (
    <div className="space-y-6 py-2">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Inbox</h1>
        <p className="text-sm text-zinc-400">Your conversations with clients and testers.</p>
      </header>

      {convos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
          No conversations yet. Contact a tester from their profile to start one.
        </div>
      ) : (
        <ul className="divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800">
          {convos.map((c) => (
            <li key={c.id}>
              <Link
                href={`/talent/inbox/${c.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-zinc-900/60"
              >
                <div className="min-w-0">
                  <p className="font-medium text-zinc-100">
                    {c.otherHandle ?? (c.role === "tester" ? "A client" : "A tester")}
                  </p>
                  {c.lastMessage && (
                    <p className="truncate text-sm text-zinc-500">{c.lastMessage}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-zinc-600">
                  {c.role === "client" ? "you contacted" : "contacted you"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
