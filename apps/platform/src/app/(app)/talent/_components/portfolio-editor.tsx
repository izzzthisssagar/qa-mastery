"use client";

import { type ChangeEvent, useState, useTransition } from "react";
import { createBrowserSupabase } from "@qa-mastery/db";
import { Badge, Button } from "@qa-mastery/ui";
import { PORTFOLIO_TYPES, labelFor } from "@/lib/talent/taxonomy";
import { portfolioTypeTone } from "@/lib/talent/status";
import {
  addPortfolioItem,
  type PortfolioInput,
  type ReusableArtifact,
} from "@/app/(app)/talent/actions";

const PORTFOLIO_BUCKET = "talent-portfolio";

export type PortfolioRow = { id: string; type: string; title: string; is_nda?: boolean };

const field =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus-visible:border-zinc-500";

export function PortfolioEditor({
  initial,
  reusable,
  userId,
}: {
  initial: PortfolioRow[];
  reusable: ReusableArtifact[];
  userId: string;
}) {
  const [rows, setRows] = useState<PortfolioRow[]>(initial);
  const [type, setType] = useState<string>("automation");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [isNda, setIsNda] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState<{ source_table: string; source_id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function prefillFromArtifact(a: ReusableArtifact) {
    setTitle(a.title);
    setType(a.source_table === "bug_reports" ? "bug_report" : "test_case");
    setLink({ source_table: a.source_table, source_id: a.source_id });
  }

  function add() {
    if (!title.trim()) return;
    setError(null);
    startTransition(async () => {
      let assetPath: string | undefined;
      if (file) {
        const supabase = createBrowserSupabase();
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
        const objectPath = `${userId}/${crypto.randomUUID()}-${safe}`;
        const { error: upErr } = await supabase.storage
          .from(PORTFOLIO_BUCKET)
          .upload(objectPath, file, { contentType: file.type });
        if (upErr) {
          setError("File upload failed — use a PDF/CSV/image under 10MB.");
          return;
        }
        assetPath = objectPath;
      }

      const input: PortfolioInput = {
        type,
        title,
        body: body || undefined,
        repoUrl: repoUrl || undefined,
        isNda,
        sourceTable: link?.source_table as PortfolioInput["sourceTable"],
        sourceId: link?.source_id,
        assetPath,
      };
      const res = await addPortfolioItem(input);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setRows((r) => [...r, { id: res.data.id, type, title, is_nda: isNda }]);
      setTitle("");
      setBody("");
      setRepoUrl("");
      setIsNda(false);
      setLink(null);
      setFile(null);
    });
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  return (
    <div className="space-y-5">
      {rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm"
            >
              <Badge tone={portfolioTypeTone[p.type] ?? "default"}>{labelFor(p.type)}</Badge>
              <span className="text-zinc-200">{p.title}</span>
              {p.is_nda && <Badge tone="info">NDA</Badge>}
            </li>
          ))}
        </ul>
      )}

      {reusable.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500">
            Reuse proof you already built on QA Mastery (one click → linked):
          </p>
          <div className="flex flex-wrap gap-2">
            {reusable.slice(0, 12).map((a) => (
              <button
                key={`${a.source_table}-${a.source_id}`}
                type="button"
                onClick={() => prefillFromArtifact(a)}
                className="rounded-md border border-zinc-700 px-2 py-1 text-left text-xs text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-200"
              >
                <span className="font-medium">{a.title}</span>{" "}
                <span className="text-zinc-500">· {a.meta}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-zinc-800 p-4">
        {link && (
          <p className="text-xs text-emerald-300">
            Linked to your {link.source_table === "bug_reports" ? "bug report" : "test case"}.{" "}
            <button type="button" className="text-zinc-400 underline" onClick={() => setLink(null)}>
              unlink
            </button>
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <select className={field + " w-auto"} value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">
            {PORTFOLIO_TYPES.map((t) => (
              <option key={t} value={t}>
                {labelFor(t)}
              </option>
            ))}
          </select>
          <input
            className={field}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What this proves"
            aria-label="Title"
          />
        </div>
        <textarea
          className={field + " min-h-20 resize-y"}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Optional context, or paste a short snippet."
          aria-label="Body"
        />
        <input
          className={field}
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/… (optional)"
          aria-label="Repo URL"
        />
        <label className="block text-sm text-zinc-400">
          <span className="mb-1 block">Attach a file (bug-report sheet, coverage PDF — optional)</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf,text/csv,text/plain"
            onChange={onFile}
            className="block w-full text-xs text-zinc-400 file:mr-3 file:rounded-md file:border file:border-zinc-700 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-zinc-200"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-zinc-400">
          <input type="checkbox" checked={isNda} onChange={(e) => setIsNda(e.target.checked)} />
          Under NDA — hide details from public view
        </label>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <Button onClick={add} disabled={pending || !title.trim()}>
          {pending ? "Adding…" : "Add to portfolio"}
        </Button>
      </div>
    </div>
  );
}
