import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card } from "@qa-mastery/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My submissions" };

interface BugReportRow {
  id: string;
  title: string;
  page: string;
  feature: string;
  severity: string;
  matched: boolean;
  score: number;
  created_at: string;
}

/** Map a bug-report severity to a Badge tone. */
function severityTone(s: string): "default" | "warning" | "info" {
  if (s === "blocker" || s === "critical") return "warning";
  if (s === "major") return "info";
  return "default";
}

/**
 * Read-only portfolio of the learner's graded bug reports. Reads `bug_reports`
 * through the request-scoped (RLS-enforced) client, so it returns only the
 * caller's own rows — no service role needed, scores are display-only.
 */
export default async function PortfolioPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("bug_reports")
    .select("id, title, page, feature, severity, matched, score, created_at")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as BugReportRow[];
  const matchedCount = rows.filter((r) => r.matched).length;
  const totalScore = rows.reduce((sum, r) => sum + (r.score ?? 0), 0);

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent/80">Portfolio</p>
        <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-zinc-50">
          My submissions
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Every bug report you&apos;ve filed, graded server-side. This is your proof of work.
        </p>
      </header>

      {rows.length === 0 ? (
        <Card className="text-center">
          <p className="text-zinc-300">No graded submissions yet.</p>
          <p className="mt-2 text-sm text-zinc-500">
            Go find a bug in BuggyShop and file your first report.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block font-medium text-accent underline-offset-4 transition-colors hover:text-emerald-300 hover:underline"
          >
            Back to dashboard →
          </Link>
        </Card>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-3 gap-4">
            <Card>
              <div className="text-3xl font-bold text-zinc-50">{rows.length}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">Reports filed</div>
            </Card>
            <Card>
              <div className="text-3xl font-bold text-accent">{matchedCount}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">Bugs matched</div>
            </Card>
            <Card>
              <div className="text-3xl font-bold text-zinc-50">{totalScore}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-zinc-500">Total score</div>
            </Card>
          </div>

          <Card className="overflow-x-auto p-0">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-medium">Bug report</th>
                  <th className="px-5 py-3 font-medium">Location</th>
                  <th className="px-5 py-3 font-medium">Severity</th>
                  <th className="px-5 py-3 font-medium">Result</th>
                  <th className="px-5 py-3 text-right font-medium">Score</th>
                  <th className="px-5 py-3 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-800/60 last:border-0">
                    <td className="px-5 py-4 font-medium text-zinc-100">{r.title}</td>
                    <td className="px-5 py-4 text-zinc-400">
                      {r.page} · {r.feature}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={severityTone(r.severity)}>{r.severity}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      {r.matched ? <Badge tone="success">Matched</Badge> : <Badge>No match</Badge>}
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-zinc-200">{r.score}</td>
                    <td className="px-5 py-4 text-right text-zinc-500">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
