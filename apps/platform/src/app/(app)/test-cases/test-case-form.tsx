"use client";

import { useActionState } from "react";
import { Button } from "@qa-mastery/ui";
import { createTestCase, type TestCaseActionState } from "./actions";

const INITIAL: TestCaseActionState = { error: null };

const field =
  "w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-accent/70";

export function TestCaseForm() {
  const [state, action, pending] = useActionState(createTestCase, INITIAL);

  return (
    <form action={action} className="space-y-3">
      <input
        name="title"
        required
        maxLength={200}
        placeholder="Title — e.g. Cart total updates when quantity changes"
        className={field}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <textarea name="preconditions" rows={2} placeholder="Preconditions (optional)" className={field} />
        <textarea name="expected" rows={2} placeholder="Expected result" className={field} />
      </div>
      <textarea name="steps" rows={3} placeholder="Steps — one per line" className={field} />
      <div className="flex items-center gap-3">
        <select name="priority" defaultValue="medium" className={`${field} w-auto`}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Add test case"}
        </Button>
        {state.error ? (
          <span role="alert" className="text-sm text-red-300">
            {state.error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
