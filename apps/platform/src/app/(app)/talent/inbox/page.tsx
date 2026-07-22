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
        <p className="text-sm text-muted-foreground">Your conversations with clients and testers.</p>
      </header>

      {convos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No conversations yet. Contact a tester from their profile to start one.
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {convos.map((c) => (
            <li key={c.id}>
              <Link
                href={`/talent/inbox/${c.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface/60"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {c.otherHandle ?? (c.role === "tester" ? "A client" : "A tester")}
                  </p>
                  {c.lastMessage && (
                    <p className="truncate text-sm text-muted-foreground">{c.lastMessage}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
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
