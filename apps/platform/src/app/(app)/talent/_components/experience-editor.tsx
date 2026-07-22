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
  "rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm text-foreground outline-none focus-visible:border-border";

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
            <li key={e.id} className="rounded-lg border border-border bg-surface/40 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground">
                    {e.role} · <span className="text-foreground">{e.company}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {e.start_year} – {e.end_year ?? "present"}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${e.role} at ${e.company}`}
                  onClick={() => remove(e.id)}
                  disabled={pending}
                  className="text-muted-foreground hover:text-danger-text"
                >
                  ×
                </button>
              </div>
              {e.summary && <p className="mt-1 text-sm text-muted-foreground">{e.summary}</p>}
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 rounded-xl border border-border p-4">
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
        {error && <p className="text-sm text-danger-text">{error}</p>}
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
