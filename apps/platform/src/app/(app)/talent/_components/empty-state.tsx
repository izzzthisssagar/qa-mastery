import Link from "next/link";
import { Button } from "@qa-mastery/ui";

/**
 * Directory empty state — never a blank grid (UX §2B). Cold-start is the #1
 * risk to the client journey, so this always gives orientation + a next step.
 */
export function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="bg-grid grain relative overflow-hidden rounded-2xl border border-zinc-800 px-6 py-16 text-center">
      <div className="bg-glow pointer-events-none absolute inset-0" />
      <div className="relative space-y-3">
        <h2 className="font-display text-xl font-semibold text-zinc-100">
          {filtered ? "No testers match those filters" : "The directory is just getting started"}
        </h2>
        <p className="mx-auto max-w-md text-sm text-zinc-400">
          {filtered
            ? "Try widening your specialty or availability filters."
            : "QA Mastery graduates are publishing profiles now. Check back soon — or, if you test, claim your spot."}
        </p>
        <div className="flex justify-center gap-3 pt-2">
          {!filtered && (
            <Link href="/talent/profile">
              <Button>Create your tester profile</Button>
            </Link>
          )}
          <Link href="/talent/post">
            <Button variant="secondary">Post a project</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
