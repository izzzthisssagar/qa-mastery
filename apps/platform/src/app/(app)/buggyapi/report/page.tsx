import Link from "next/link";
import { ApiBugReportForm } from "./report-form";

export const metadata = {
  title: "BuggyAPI bug hunt · QA Mastery",
};

/**
 * BuggyAPI bug-hunt report page. The (app)/layout.tsx server check gates auth;
 * launch TaskFlight in bug-hunt mode from the dashboard, hunt the contract
 * violations, then file them here. Grading is server-side (dashboard/actions).
 */
export default function BuggyApiReportPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs font-medium uppercase tracking-widest text-accent">BuggyAPI</p>
      <h1 className="mt-1 text-2xl font-semibold text-foreground">TaskFlight bug hunt</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Launch TaskFlight in <strong>bug-hunt</strong> mode from your{" "}
        <Link href="/dashboard" className="text-accent underline-offset-2 hover:underline">
          dashboard
        </Link>
        , probe the endpoints against the OpenAPI contract at{" "}
        <code className="text-foreground">/api/docs</code>, and report every deviation below.
        Duplicates score 0 — exactly like a real triage queue.
      </p>

      <ApiBugReportForm />
    </main>
  );
}
