"use client";

import { useState, useTransition } from "react";
import { Button } from "@qa-mastery/ui";
import { addExperience, removeExperience } from "@/app/(app)/talent/actions";

export type ExperienceRow = {
  id: string;
  company: string;
  role: string;
  start_year: number;
  end_year: number | null;
  summary: string | null;
};

const field =
  "rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus-visible:border-zinc-500";

export function ExperienceEditor({ initial }: { initial: ExperienceRow[] }) {
  const [rows, setRows] = useState<ExperienceRow[]>(initial);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function add() {
    if (!company.trim() || !role.trim() || !startYear) return;
    setError(null);
    startTransition(async () => {
      const res = await addExperience({
        company,
        role,
        startYear: Number(startYear),
        endYear: endYear ? Number(endYear) : undefined,
        summary: summary || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRows((r) => [
        {
          id: res.data.id,
          company,
          role,
          start_year: Number(startYear),
          end_year: endYear ? Number(endYear) : null,
          summary: summary || null,
        },
        ...r,
      ]);
      setCompany("");
      setRole("");
      setStartYear("");
      setEndYear("");
      setSummary("");
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await removeExperience(id);
      if (res.ok) setRows((r) => r.filter((x) => x.id !== id));
    });
  }

  return (
    <div className="space-y-4">
      {rows.length > 0 && (
        <ul className="space-y-3">
          {rows.map((e) => (
            <li key={e.id} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-zinc-100">
                    {e.role} · <span className="text-zinc-300">{e.company}</span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    {e.start_year} – {e.end_year ?? "present"}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${e.role} at ${e.company}`}
                  onClick={() => remove(e.id)}
                  disabled={pending}
                  className="text-zinc-500 hover:text-red-300"
                >
                  ×
                </button>
              </div>
              {e.summary && <p className="mt-1 text-sm text-zinc-400">{e.summary}</p>}
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 rounded-xl border border-zinc-800 p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className={field}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role (e.g. QA Analyst)"
            aria-label="Role"
          />
          <input
            className={field}
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company"
            aria-label="Company"
          />
          <input
            type="number"
            className={field}
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            placeholder="Start year"
            aria-label="Start year"
          />
          <input
            type="number"
            className={field}
            value={endYear}
            onChange={(e) => setEndYear(e.target.value)}
            placeholder="End year (blank = present)"
            aria-label="End year"
          />
        </div>
        <textarea
          className={field + " w-full resize-y"}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="What you did there (optional)."
          aria-label="Summary"
        />
        {error && <p className="text-sm text-red-300">{error}</p>}
        <Button
          variant="secondary"
          onClick={add}
          disabled={pending || !company.trim() || !role.trim() || !startYear}
        >
          Add role
        </Button>
      </div>
    </div>
  );
}
