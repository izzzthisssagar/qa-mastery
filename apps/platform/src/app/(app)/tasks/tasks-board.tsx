"use client";

import { useOptimistic, useState, useTransition } from "react";
import {
  createPersonalTask,
  deleteUserTask,
  setUserTaskStatus,
  startAssignedTask,
  submitTaskForGrading,
  type TasksData,
  type TaskTemplate,
  type UserTask,
} from "./actions";

/** Interactive tasks board: assigned system tasks (accept + grade) and a
 *  personal planner (add / status / delete). All mutations go through the
 *  owner-scoped server actions. */
export function TasksBoard({ initial }: { initial: TasksData }) {
  const acceptedTaskIds = new Set(initial.planner.map((p) => p.taskId).filter(Boolean));

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Assigned
        </h2>
        <div className="mt-3 space-y-3">
          {initial.assigned.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks assigned yet.</p>
          ) : (
            initial.assigned.map((t) => (
              <AssignedCard
                key={t.id}
                task={t}
                accepted={acceptedTaskIds.has(t.id)}
                userTask={initial.planner.find((p) => p.taskId === t.id) ?? null}
              />
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Planner
        </h2>
        <Planner planner={initial.planner.filter((p) => p.taskId == null)} />
      </section>
    </div>
  );
}

function AssignedCard({
  task,
  accepted,
  userTask,
}: {
  task: TaskTemplate;
  accepted: boolean;
  userTask: UserTask | null;
}) {
  // Accept and grade need SEPARATE transitions: while the accept roundtrip is
  // still settling, the optimistically-flipped card must already read
  // "Grade my work" — a shared pending flag showed a bogus "Grading…" there.
  const [acceptPending, startAccept] = useTransition();
  const [gradePending, startGrade] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  // Optimistic accept: flip to the accepted view immediately, revert on error.
  const [acceptedNow, setAcceptedNow] = useState(false);
  const showAccepted = accepted || acceptedNow;

  return (
    <div
      className="rounded-2xl border border-border bg-surface p-4"
      data-testid={`task-${task.slug}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{task.title}</h3>
          {task.summary && <p className="mt-0.5 text-xs text-muted-foreground">{task.summary}</p>}
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {task.xp} XP
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {!showAccepted ? (
          <button
            disabled={acceptPending}
            onClick={() => {
              setAcceptedNow(true);
              startAccept(async () => {
                const r = await startAssignedTask(task.id);
                if (!r?.ok) setAcceptedNow(false);
              });
            }}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground disabled:opacity-50"
          >
            Accept task
          </button>
        ) : (
          <>
            <button
              disabled={acceptPending || gradePending || userTask?.grade?.passed}
              onClick={() =>
                startGrade(async () => {
                  if (!userTask) return;
                  const r = await submitTaskForGrading(userTask.id);
                  setResult(
                    r.ok
                      ? r.passed
                        ? `Passed · ${r.score}%`
                        : `Not yet · ${r.score}%`
                      : (r.error ?? "Error"),
                  );
                })
              }
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground disabled:opacity-50"
            >
              {userTask?.grade?.passed
                ? "Completed ✓"
                : gradePending
                  ? "Grading…"
                  : "Grade my work"}
            </button>
            {result && <span className="text-xs text-muted-foreground">{result}</span>}
            {!result && userTask?.grade && (
              <span className="text-xs text-muted-foreground">
                {userTask.grade.passed ? "Passed" : `${userTask.grade.score}%`}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Planner({ planner }: { planner: UserTask[] }) {
  const [title, setTitle] = useState("");
  const [pending, start] = useTransition();
  // Optimistic add: show the new row immediately; the revalidated server list
  // replaces it (real id) when the action settles.
  const [rows, addRow] = useOptimistic(planner, (cur: UserTask[], t: string) => [
    {
      id: `optimistic-${t}`,
      taskId: null,
      title: t,
      notes: null,
      dueDate: null,
      status: "todo" as const,
      grade: null,
    },
    ...cur,
  ]);

  return (
    <div className="mt-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const t = title.trim();
          if (!t) return;
          setTitle("");
          start(async () => {
            addRow(t);
            await createPersonalTask({ title: t });
          });
        }}
        className="flex gap-2"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a personal to-do…"
          data-testid="planner-input"
          className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
        <button
          disabled={pending || title.trim().length === 0}
          className="rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50"
        >
          Add
        </button>
      </form>

      <ul className="mt-3 space-y-2">
        {rows.length === 0 ? (
          <li className="text-sm text-muted-foreground">Nothing planned. Add a to-do above.</li>
        ) : (
          rows.map((p) => <PlannerRow key={p.id} task={p} />)
        )}
      </ul>
    </div>
  );
}

function PlannerRow({ task }: { task: UserTask }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(task.status === "done");
  // An optimistic row has no server id yet — mutations wait for the real row.
  const settling = task.id.startsWith("optimistic-");
  return (
    <li
      data-testid="planner-row"
      className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2"
    >
      <input
        type="checkbox"
        checked={done}
        disabled={pending || settling}
        onChange={() => {
          const next = !done;
          setDone(next);
          start(async () => {
            const res = await setUserTaskStatus(task.id, next ? "done" : "todo");
            if (!res?.ok) setDone(!next);
          });
        }}
        className="size-4 accent-[var(--accent)]"
        aria-label="Toggle done"
      />
      <span
        className={`flex-1 text-sm ${done ? "text-muted-foreground line-through" : "text-foreground"}`}
      >
        {task.title}
      </span>
      <button
        disabled={pending || settling}
        onClick={() => start(async () => void (await deleteUserTask(task.id)))}
        aria-label="Delete"
        className="text-muted-foreground hover:text-foreground"
      >
        ✕
      </button>
    </li>
  );
}
