"use client";

import { useState, useTransition } from "react";
import { Badge, Button } from "@qa-mastery/ui";
import {
  getMyVerifiedSkills,
  refreshMyVerifiedSkills,
  type VerifiedSkill,
} from "@/app/(app)/talent/actions";

export function VerifiedSkills({ initial }: { initial: VerifiedSkill[] }) {
  const [skills, setSkills] = useState<VerifiedSkill[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh() {
    setError(null);
    startTransition(async () => {
      const res = await refreshMyVerifiedSkills();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const next = await getMyVerifiedSkills();
      if (next.ok) setSkills(next.data);
    });
  }

  return (
    <div className="space-y-3">
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <Badge key={s.skill} tone="success">
              {s.skill} · {s.score}%
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          No verified skills yet — pass graded labs on QA Mastery, then refresh to earn badges.
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={refresh} disabled={pending}>
          {pending ? "Checking your labs…" : "Refresh from my labs"}
        </Button>
        {error && <span className="text-sm text-red-300">{error}</span>}
      </div>
    </div>
  );
}
