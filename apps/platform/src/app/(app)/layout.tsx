import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3 sm:px-10">
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/dashboard" className="text-base font-bold tracking-tight">
            QA<span className="text-accent">Mastery</span>
          </Link>
          <Link href="/dashboard" className="text-zinc-300 hover:text-zinc-50">
            Dashboard
          </Link>
        </nav>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden text-zinc-500 sm:inline">{user.email}</span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:border-zinc-500 hover:text-zinc-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 px-6 py-10 sm:px-10">{children}</main>
    </div>
  );
}
