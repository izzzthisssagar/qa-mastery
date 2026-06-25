"use client";

import { type ChangeEvent, useState, useTransition } from "react";
import { createBrowserSupabase } from "@qa-mastery/db";
import { setCvPath } from "@/app/(app)/talent/actions";

const PORTFOLIO_BUCKET = "talent-portfolio";

/** Uploads a CV/résumé (PDF) to the private portfolio bucket, then persists the
 *  path. Reads on the public profile go through a short-lived signed URL. */
export function CvUploader({ userId, hasCv }: { userId: string; hasCv: boolean }) {
  const [done, setDone] = useState(hasCv);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const supabase = createBrowserSupabase();
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
    const objectPath = `${userId}/cv-${crypto.randomUUID()}-${safe}`;
    const { error: upErr } = await supabase.storage
      .from(PORTFOLIO_BUCKET)
      .upload(objectPath, file, { contentType: file.type });
    if (upErr) {
      setError("Upload failed — use a PDF under 10MB.");
      return;
    }

    startTransition(async () => {
      const res = await setCvPath(objectPath);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(true);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="cursor-pointer rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:border-zinc-500">
        {pending ? "Uploading…" : done ? "Replace CV" : "Upload CV / résumé (PDF or Word)"}
        <input
          type="file"
          accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
          className="hidden"
          onChange={onFile}
          disabled={pending}
        />
      </label>
      {done && !error && <span className="text-sm text-emerald-300">CV attached ✓</span>}
      {error && <span className="text-sm text-red-300">{error}</span>}
    </div>
  );
}
