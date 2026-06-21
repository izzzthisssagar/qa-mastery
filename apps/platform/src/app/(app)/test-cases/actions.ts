"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Learner-authored test cases. All writes go through the request-scoped
 *  (RLS-enforced) client, which pins every row to the caller — the
 *  "own test cases" policies are the security boundary. */

const CreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  preconditions: z.string().trim().max(2000).optional(),
  steps: z.string().trim().max(4000).optional(),
  expected: z.string().trim().max(2000).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

const STATUSES = ["draft", "ready", "passed", "failed", "blocked"] as const;

export type TestCaseActionState = { error: string | null };

export async function createTestCase(
  _prev: TestCaseActionState,
  formData: FormData,
): Promise<TestCaseActionState> {
  const parsed = CreateSchema.safeParse({
    title: formData.get("title"),
    preconditions: formData.get("preconditions"),
    steps: formData.get("steps"),
    expected: formData.get("expected"),
    priority: formData.get("priority"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid test case" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in." };

  // Split the steps textarea into a clean array (one step per non-empty line).
  const steps = (parsed.data.steps ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const { error } = await supabase.from("test_cases").insert({
    user_id: user.id,
    title: parsed.data.title,
    preconditions: parsed.data.preconditions ?? "",
    steps,
    expected: parsed.data.expected ?? "",
    priority: parsed.data.priority,
  });
  if (error) return { error: "Couldn't save the test case — try again." };

  revalidatePath("/test-cases");
  return { error: null };
}

export async function setTestCaseStatus(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !STATUSES.includes(status as (typeof STATUSES)[number])) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("test_cases").update({ status }).eq("id", id);
  revalidatePath("/test-cases");
}

export async function deleteTestCase(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("test_cases").delete().eq("id", id);
  revalidatePath("/test-cases");
}
