"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserSupabase } from "@qa-mastery/db";
import { markNotificationsRead } from "@/app/(app)/community/actions";

/**
 * Header notification bell. Seeds its unread count from the server, then
 * subscribes to Supabase Realtime postgres_changes on `notifications` filtered
 * to this user (the row is in the supabase_realtime publication — see migration
 * 0027). Opening the panel marks everything read.
 */
export function NotificationBell({ userId, initialUnread }: { userId: string; initialUnread: number }) {
  const [unread, setUnread] = useState(initialUnread);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabase();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => setUnread((n) => n + 1),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      void markNotificationsRead();
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="Notifications"
        data-testid="notification-bell"
        className="relative flex h-12 w-12 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground"
      >
        <span aria-hidden className="text-lg">🔔</span>
        {unread > 0 && (
          <span
            data-testid="notification-badge"
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-border bg-surface p-3 text-sm shadow-lg">
          <p className="text-muted-foreground">
            You&apos;re all caught up. New replies, likes and follows show up here.
          </p>
          <Link
            href="/community"
            className="mt-2 block text-accent hover:underline"
            onClick={() => setOpen(false)}
          >
            Go to community →
          </Link>
        </div>
      )}
    </div>
  );
}
