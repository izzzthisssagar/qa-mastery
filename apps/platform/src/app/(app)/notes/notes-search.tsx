"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { searchNotes, type NoteHit } from "./actions";

/** Debounced instant search over the notes corpus (server action; the corpus is
 *  small enough to scan in-process). */
export function NotesSearch() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<NoteHit[]>([]);
  const [pending, startTransition] = useTransition();

  function onChange(value: string) {
    setQuery(value);
    startTransition(async () => {
      setHits(value.trim().length >= 2 ? await searchNotes(value) : []);
    });
  }

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search notes…"
        data-testid="notes-search"
        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent"
      />

      {query.trim().length >= 2 && (
        <div className="mt-2 space-y-1 rounded-xl border border-border bg-surface p-2">
          {hits.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">
              {pending ? "Searching…" : "No matching topics."}
            </p>
          ) : (
            hits.map((h) => (
              <Link
                key={`${h.moduleSlug}/${h.chapterSlug}/${h.topicSlug}`}
                href={`/notes/${h.moduleSlug}/${h.chapterSlug}/${h.topicSlug}`}
                data-testid="notes-search-hit"
                className="block rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
              >
                <span className="text-sm font-medium text-foreground">{h.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{h.summary}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
