import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, CardBody, CardTitle } from "@qa-mastery/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

interface LessonRow {
  slug: string;
  title: string;
  free: boolean;
  order_index: number;
  modules: { slug: string; title: string; order_index: number } | null;
}

interface ModuleGroup {
  slug: string;
  title: string;
  order: number;
  lessons: LessonRow[];
}

/** Group published lessons by module, ordered by module then lesson order. */
function groupByModule(rows: LessonRow[]): ModuleGroup[] {
  const groups = new Map<string, ModuleGroup>();
  for (const row of rows) {
    const m = row.modules;
    if (!m) continue;
    let g = groups.get(m.slug);
    if (!g) {
      g = { slug: m.slug, title: m.title, order: m.order_index, lessons: [] };
      groups.set(m.slug, g);
    }
    g.lessons.push(row);
  }
  const ordered = [...groups.values()].sort((a, b) => a.order - b.order);
  for (const g of ordered) g.lessons.sort((a, b) => a.order_index - b.order_index);
  return ordered;
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("lessons")
    .select("slug, title, free, order_index, modules!inner(slug, title, order_index)")
    .eq("status", "published");

  const rows = (data ?? []) as unknown as LessonRow[];
  const modules = groupByModule(rows);
  const lessonCount = rows.length;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold">Your learning</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Track A — Manual Testing Foundation. {lessonCount} lessons live, free while in beta.
      </p>

      <div className="mt-8 space-y-6">
        {modules.map((module) => (
          <section key={module.slug} data-testid={`module-${module.slug}`}>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-accent">
              {module.slug.toUpperCase()} — {module.title}
            </h2>
            <ul className="mt-2 divide-y divide-zinc-800 rounded-xl border border-zinc-800">
              {module.lessons.map((lesson) => (
                <li key={lesson.slug}>
                  <Link
                    href={`/learn/${lesson.slug}`}
                    data-testid={`lesson-link-${lesson.slug}`}
                    className="flex items-center justify-between px-4 py-3 text-sm hover:bg-zinc-900"
                  >
                    <span>
                      <span className="text-zinc-500">
                        {module.slug.toUpperCase()}.{lesson.order_index}
                      </span>{" "}
                      <span className="text-zinc-100">{lesson.title}</span>
                    </span>
                    <span className="text-accent">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {modules.length === 0 && (
          <p className="text-sm text-zinc-500">Lessons are being published — check back shortly.</p>
        )}
      </div>

      <Card className="mt-8">
        <div className="mb-2 flex items-center justify-between">
          <CardTitle className="mb-0">Track B — Automation</CardTitle>
          <Badge>Planned</Badge>
        </div>
        <CardBody>
          Selenium + Java + TestNG, from &ldquo;just enough Java&rdquo; to a framework capstone,
          with code you actually run.
        </CardBody>
      </Card>
    </div>
  );
}
