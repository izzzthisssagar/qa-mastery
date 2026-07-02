import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HelpAgentWidget } from "@/components/help-agent/help-agent-widget";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";
import { NotificationBell } from "@/components/nav/notification-bell";
import { AvatarMenu } from "@/components/nav/avatar-menu";
import { getUnreadCount } from "./community/actions";

/**
 * Authenticated shell. The proxy already redirects anonymous users, but this
 * server-side check is the real boundary (proxy checks are optimistic only).
 */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const unread = await getUnreadCount();

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/70 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-10">
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="text-base font-bold tracking-tight">
            QA<span className="text-accent">Mastery</span>
          </Link>
          <Link
            href="/dashboard"
            className="relative text-muted-foreground transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-accent after:transition-transform hover:after:scale-x-100"
          >
            Dashboard
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <NotificationBell userId={user.id} initialUnread={unread} />
          <AvatarMenu email={user.email ?? ""} />
        </div>
      </header>
      <main className="flex-1 px-6 py-10 sm:px-10">{children}</main>
      <HelpAgentWidget />
      <FeedbackWidget />
    </div>
  );
}
