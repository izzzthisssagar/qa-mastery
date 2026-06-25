"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@qa-mastery/ui";
import {
  ENGAGEMENTS,
  PROJECT_TYPES,
  SPECIALTIES,
  STACK,
  labelFor,
} from "@/lib/talent/taxonomy";
import { postProject, type ProjectInput } from "@/app/(app)/talent/actions";

const field =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus-visible:border-zinc-500";

function Chips({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(o)}
            className={
              "rounded-full border px-3 py-1 text-xs transition-colors " +
              (on
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-200"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-500")
            }
          >
            {labelFor(o)}
          </button>
        );
      })}
    </div>
  );
}

export function PostProjectForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState<string>("web");
  const [engagement, setEngagement] = useState<string>("one_off");
  const [requiredTypes, setRequiredTypes] = useState<string[]>([]);
  const [stack, setStack] = useState<string[]>([]);
  const [ndaRequired, setNdaRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const toggle = (list: string[], set: (v: string[]) => void) => (v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  function submit() {
    setError(null);
    startTransition(async () => {
      const input: ProjectInput = {
        title,
        description: description || undefined,
        projectType,
        engagement,
        requiredTypes,
        stack,
        tooling: [],
        ndaRequired,
      };
      const res = await postProject(input);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
        <h2 className="font-medium text-emerald-200">Project posted.</h2>
        <p className="text-sm text-zinc-400">Now find testers who match what you need.</p>
        <Link href="/talent/testers">
          <Button>Browse testers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <label className="block text-sm">
        <span className="mb-1 block text-zinc-400">Title</span>
        <input
          className={field}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Regression + API testing for our React app"
          aria-label="Title"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-zinc-400">Description</span>
        <textarea
          className={field + " min-h-24 resize-y"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What needs testing, on what, by when."
          aria-label="Description"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-400">Project type</span>
          <select className={field} value={projectType} onChange={(e) => setProjectType(e.target.value)}>
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {labelFor(t)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-400">Engagement</span>
          <select className={field} value={engagement} onChange={(e) => setEngagement(e.target.value)}>
            {ENGAGEMENTS.map((en) => (
              <option key={en} value={en}>
                {labelFor(en)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2 text-sm">
        <span className="block text-zinc-400">Required testing types</span>
        <Chips options={SPECIALTIES} selected={requiredTypes} onToggle={toggle(requiredTypes, setRequiredTypes)} />
      </div>

      <div className="space-y-2 text-sm">
        <span className="block text-zinc-400">Tech stack</span>
        <Chips options={STACK} selected={stack} onToggle={toggle(stack, setStack)} />
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-400">
        <input type="checkbox" checked={ndaRequired} onChange={(e) => setNdaRequired(e.target.checked)} />
        NDA required
      </label>

      {error && <p className="text-sm text-red-300">{error}</p>}

      <Button onClick={submit} disabled={pending || title.trim().length < 3}>
        {pending ? "Posting…" : "Post project"}
      </Button>
    </div>
  );
}
