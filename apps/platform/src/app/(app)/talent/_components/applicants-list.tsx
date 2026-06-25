"use client";

import { useState, useTransition } from "react";
import { Badge } from "@qa-mastery/ui";
import { applicationTone } from "@/lib/talent/status";
import { labelFor } from "@/lib/talent/taxonomy";
import { setApplicationStatus } from "@/app/(app)/talent/actions";

export type Applicant = {
  id: string;
  tester_id: string;
  status: string;
  note: string | null;
};

const ACTIONS: { value: string; label: string }[] = [
  { value: "shortlisted", label: "Shortlist" },
  { value: "hired", label: "Hire" },
  { value: "declined", label: "Decline" },
];

function Row({ a }: { a: Applicant }) {
  const [status, setStatus] = useState(a.status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set(next: string) {
    setError(null);
    const prev = status;
    setStatus(next);
    startTransition(async () => {
      const res = await setApplicationStatus(a.id, next);
      if (!res.ok) {
        setStatus(prev);
        setError(res.error);
      }
    });
  }

  return (
    <li className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-zinc-400">{a.tester_id.slice(0, 8)}</span>
        <Badge tone={applicationTone[status] ?? "default"}>{labelFor(status)}</Badge>
      </div>
      {a.note && <p className="text-sm text-zinc-300">{a.note}</p>}
      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((act) => (
          <button
            key={act.value}
            type="button"
            disabled={pending || status === act.value}
            onClick={() => set(act.value)}
            className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:border-zinc-500 disabled:opacity-40"
          >
            {act.label}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </li>
  );
}

export function ApplicantsList({ applicants }: { applicants: Applicant[] }) {
  if (applicants.length === 0) {
    return <p className="text-sm text-zinc-500">No applications yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {applicants.map((a) => (
        <Row key={a.id} a={a} />
      ))}
    </ul>
  );
}
