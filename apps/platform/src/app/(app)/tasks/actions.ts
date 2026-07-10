"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@qa-mastery/db";
import { gradeTask, type TaskCriteria } from "@qa-mastery/grading";
import { getAuthedUserId } from "@/lib/auth";

/**
 * Tasks server actions. Personal planner rows are owner-scoped (RLS + explicit
 * user_id here). Grades are written ONLY through the service role into
 * user_task_grades — learners have no write path to a score (mirrors bug_reports
 * / xp_events). Evidence for grading is counted from service-role-scored rows
 * (valid bug_reports = matched && !duplicate) and the learner's test_cases, so a
 * learner can never inflate their own grade.
 */

export interface TaskTemplate {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  kind: string;
  moduleId: string | null;
  target: string | null;
  criteria: TaskCriteria;
  xp: number;
}

export interface UserTask {
  id: string;
  taskId: string | null;
  title: string | null;
  notes: string | null;
  dueDate: string | null;
  status: "todo" | "in_progress" | "done" | "archived";
  grade: { score: number; passed: boolean } | null;
}

export interface TasksData {
  assigned: TaskTemplate[];
  planner: UserTask[];
}

export async function getTasksData(moduleId?: string): Promise<TasksData> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();

  const [{ data: tasks }, { data: userTasks }, { data: grades }] = await Promise.all([
    service
      .from("tasks")
      .select("id, slug, title, summary, kind, module_id, target, criteria, xp")
      .is("archived_at", null)
      .order("created_at", { ascending: true }),
    service
      .from("user_tasks")
      .select("id, task_id, title, notes, due_date, status")
      .eq("user_id", userId)
      .neq("status", "archived")
      .order("created_at", { ascending: false }),
    service.from("user_task_grades").select("user_task_id, score, passed").eq("user_id", userId),
  ]);

  const gradeByUserTask = new Map((grades ?? []).map((g) => [g.user_task_id, g]));

  const assigned = (tasks ?? [])
    .filter((t) => !moduleId || t.module_id === moduleId || t.module_id == null)
    .map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      summary: t.summary,
      kind: t.kind,
      moduleId: t.module_id,
      target: t.target,
      criteria: (t.criteria ?? {}) as TaskCriteria,
      xp: t.xp,
    }));

  const planner: UserTask[] = (userTasks ?? []).map((u) => {
    const g = gradeByUserTask.get(u.id);
    return {
      id: u.id,
      taskId: u.task_id,
      title: u.title,
      notes: u.notes,
      dueDate: u.due_date,
      status: u.status as UserTask["status"],
      grade: g ? { score: g.score, passed: g.passed } : null,
    };
  });

  return { assigned, planner };
}

export async function createPersonalTask(input: {
  title: string;
  notes?: string;
  dueDate?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const userId = await getAuthedUserId();
  const title = input.title.trim();
  if (title.length === 0 || title.length > 200) return { ok: false, error: "Title required." };

  const service = createServiceClient();
  const { error } = await service.from("user_tasks").insert({
    user_id: userId,
    title,
    notes: input.notes?.trim() || null,
    due_date: input.dueDate || null,
    status: "todo",
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/tasks");
  return { ok: true };
}

export async function setUserTaskStatus(
  id: string,
  status: UserTask["status"],
): Promise<{ ok: boolean }> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();
  const { error } = await service
    .from("user_tasks")
    .update({ status })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { ok: false };
  revalidatePath("/tasks");
  return { ok: true };
}

export async function deleteUserTask(id: string): Promise<{ ok: boolean }> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();
  await service.from("user_tasks").delete().eq("id", id).eq("user_id", userId);
  revalidatePath("/tasks");
  return { ok: true };
}

/** Accept a system task — creates the learner's instance (idempotent via the
 *  unique (user_id, task_id) index). */
export async function startAssignedTask(taskId: string): Promise<{ ok: boolean }> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();
  const { error } = await service
    .from("user_tasks")
    .upsert(
      { user_id: userId, task_id: taskId, status: "in_progress" },
      { onConflict: "user_id,task_id", ignoreDuplicates: true },
    );
  if (error) return { ok: false };
  revalidatePath("/tasks");
  return { ok: true };
}

/**
 * Grade an accepted system task. Gathers evidence server-side, scores via the
 * pure gradeTask, and writes the verdict + XP through the service role.
 */
export async function submitTaskForGrading(
  userTaskId: string,
): Promise<{ ok: boolean; passed?: boolean; score?: number; error?: string }> {
  const userId = await getAuthedUserId();
  const service = createServiceClient();

  const { data: ut } = await service
    .from("user_tasks")
    .select("id, task_id, user_id")
    .eq("id", userTaskId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!ut || !ut.task_id) return { ok: false, error: "Not a gradable task." };

  const { data: task } = await service
    .from("tasks")
    .select("id, criteria, xp")
    .eq("id", ut.task_id)
    .maybeSingle();
  if (!task) return { ok: false, error: "Task not found." };

  const criteria = (task.criteria ?? {}) as TaskCriteria;

  // Evidence: valid bug reports (service-role-scored) + authored test cases.
  const [{ count: validBugs }, { count: testCases }] = await Promise.all([
    service
      .from("bug_reports")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("matched", true)
      .eq("duplicate", false),
    service.from("test_cases").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const result = gradeTask(criteria, {
    validBugReports: validBugs ?? 0,
    testCases: testCases ?? 0,
  });

  await service.from("user_task_grades").upsert(
    {
      user_task_id: userTaskId,
      user_id: userId,
      score: result.score,
      passed: result.passed,
      detail: { requirements: result.requirements },
    },
    { onConflict: "user_task_id" },
  );

  await service
    .from("user_tasks")
    .update({ status: result.passed ? "done" : "in_progress" })
    .eq("id", userTaskId)
    .eq("user_id", userId);

  // Award XP once, on first pass (ref_id makes it idempotent-ish per task).
  if (result.passed && task.xp > 0) {
    const { data: prior } = await service
      .from("xp_events")
      .select("id")
      .eq("user_id", userId)
      .eq("reason", "task")
      .eq("ref_id", userTaskId)
      .maybeSingle();
    if (!prior) {
      await service
        .from("xp_events")
        .insert({ user_id: userId, amount: task.xp, reason: "task", ref_id: userTaskId });
    }
  }

  revalidatePath("/tasks");
  return { ok: true, passed: result.passed, score: result.score };
}
