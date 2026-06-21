import type { Metadata } from "next";
import { Badge, Card, CardTitle } from "@qa-mastery/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TestCaseForm } from "./test-case-form";
import { deleteTestCase, setTestCaseStatus } from "./actions";

export const metadata: Metadata = { title: "Test cases" };

interface TestCaseRow {
  id: string;
  title: string;
  preconditions: string;
  steps: string[];
  expected: string;
  priority: "low" | "medium" | "high";
  status: "draft" | "ready" | "passed" | "failed" | "blocked";
  created_at: string;
}

const STATUSES = ["draft", "ready", "passed", "failed", "blocked"] as const;

function priorityTone(p: string): "default" | "warning" | "info" {
  if (p === "high") return "warning";
  if (p === "medium") return "info";
  return "default";
}
function statusTone(s: string): "default" | "success" | "warning" | "info" {
  if (s === "passed") return "success";
  if (s === "failed" || s === "blocked") return "warning";
  if (s === "ready") return "info";
  return "default";
}

export default async function TestCasesPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("test_cases")
    .select("id, title, preconditions, steps, expected, priority, status, created_at")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as TestCaseRow[];

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-accent/80">Test cases</p>
        <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-zinc-50">
          Your test cases
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Write and manage your own test cases — the same artifact you&apos;ll author on the job.
        </p>
      </header>

      <Card className="mb-8">
        <CardTitle>New test case</CardTitle>
        <TestCaseForm />
      </Card>

      {rows.length === 0 ? (
        <Card className="text-center text-zinc-400">
          No test cases yet. Write your first one above.
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Steps</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-zinc-800/60 align-top last:border-0">
                  <td className="px-5 py-4">
                    <div className="font-medium text-zinc-100">{r.title}</div>
                    {r.expected ? (
                      <div className="mt-1 text-xs text-zinc-500">Expected: {r.expected}</div>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-zinc-400">{r.steps?.length ?? 0}</td>
                  <td className="px-5 py-4">
                    <Badge tone={priorityTone(r.priority)}>{r.priority}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <form action={setTestCaseStatus} className="flex items-center gap-1">
                        <input type="hidden" name="id" value={r.id} />
                        <select
                          name="status"
                          defaultValue={r.status}
                          className="rounded-md border border-zinc-800 bg-zinc-950/60 px-2 py-1 text-xs text-zinc-200 outline-none focus:border-accent/70"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-50"
                        >
                          Set
                        </button>
                      </form>
                      <form action={deleteTestCase}>
                        <input type="hidden" name="id" value={r.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-300 transition-colors hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
