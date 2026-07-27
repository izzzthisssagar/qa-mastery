import { getTasksData } from "./actions";
import { TasksBoard } from "./tasks-board";

export const metadata = {
  title: "Tasks · QA Mastery",
};

/**
 * Tasks hub — system-assigned graded practice plus a personal planner. Data is
 * fetched server-side (owner-scoped); all mutations flow through the server
 * actions. Grades are service-role-written, never learner-written.
 */
export default async function TasksPage() {
  const data = await getTasksData();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-xs font-medium uppercase tracking-widest text-accent">Practice</p>
      <h1 className="mt-1 text-2xl font-semibold text-foreground">Tasks</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Accept graded practice tasks to earn XP, and keep your own to-do list of what to study next.
      </p>

      <div className="mt-8">
        <TasksBoard initial={data} />
      </div>
    </main>
  );
}
