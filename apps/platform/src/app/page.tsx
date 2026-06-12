import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-4 sm:px-10">
        <span className="text-lg font-bold tracking-tight">
          QA<span className="text-accent">Mastery</span>
        </span>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-zinc-300 hover:text-zinc-50">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-accent px-4 py-2 font-semibold text-zinc-950 hover:opacity-90"
          >
            Start learning
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-accent">
          The hands-on QA learning platform
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Don&apos;t watch testing. Do it.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
          Learn every QA concept visually, hunt real seeded bugs in a real
          practice app, and get your work graded like you&apos;re already on
          the job — from manual testing to automation, and on to QA lead.
        </p>
        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-accent px-6 py-3 font-semibold text-zinc-950 hover:opacity-90"
          >
            Start learning free
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-zinc-700 px-6 py-3 font-semibold text-zinc-200 hover:border-zinc-500"
          >
            Log in
          </Link>
        </div>
      </main>

      <footer className="px-6 py-6 text-center text-xs text-zinc-600">
        Built in public · The practice app (BuggyShop) and the first lessons
        are on their way.
      </footer>
    </div>
  );
}
