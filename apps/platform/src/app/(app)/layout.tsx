import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HelpAgentWidget } from "@/components/help-agent/help-agent-widget";
import { FeedbackWidget } from "@/components/feedback/feedback-widget";
import { talentEnabled } from "@/lib/talent/flag";
import { logout } from "../(auth)/actions";

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

  const showTalent = talentEnabled();

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/70 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60 sm:px-10">
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="text-base font-bold tracking-tight">
            QA<span className="text-accent">Mastery</span>
          </Link>
          <Link
            href="/dashboard"
            className="relative text-zinc-300 transition-colors hover:text-zinc-50 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-accent after:transition-transform hover:after:scale-x-100"
          >
            Dashboard
          </Link>
          <Link
            href="/portfolio/me"
            className="relative text-zinc-300 transition-colors hover:text-zinc-50 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-accent after:transition-transform hover:after:scale-x-100"
          >
            Portfolio
          </Link>
          <Link
            href="/test-cases"
            className="relative text-zinc-300 transition-colors hover:text-zinc-50 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-accent after:transition-transform hover:after:scale-x-100"
          >
            Test cases
          </Link>
          {showTalent && (
            <Link
              href="/talent"
              className="relative font-medium text-accent transition-colors hover:text-emerald-200 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-accent after:transition-transform hover:after:scale-x-100"
            >
              Talent
            </Link>
          )}
          <Link
            href="/settings"
            className="relative text-zinc-300 transition-colors hover:text-zinc-50 after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-accent after:transition-transform hover:after:scale-x-100"
          >
            Settings
          </Link>
        </nav>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden text-zinc-500 sm:inline">{user.email}</span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 px-6 py-10 sm:px-10">{children}</main>
      <HelpAgentWidget />
      <FeedbackWidget />
    </div>
  );
}
