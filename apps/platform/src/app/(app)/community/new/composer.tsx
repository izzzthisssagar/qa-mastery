"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@qa-mastery/ui";
import { createPost, type MediaItem } from "../actions";
import { signVideoUpload, verifyVideo } from "../video-actions";
import { uploadCommunityImage } from "@/lib/community/media";

const FIELD =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

export function Composer({ userId, videoEnabled }: { userId: string; videoEnabled: boolean }) {
  const router = useRouter();
  const [kind, setKind] = useState<"post" | "question">("post");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const path = await uploadCommunityImage(userId, file);
      setMedia((m) => [...m, { type: "image", path }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const sig = await signVideoUpload();
      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);
      form.append("eager", "f_mp4,q_auto");
      const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/video/upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("Cloudinary upload failed");
      const data = (await res.json()) as { public_id: string };
      const item = await verifyVideo(data.public_id); // server verifies ≤60s
      setMedia((m) => [...m, item]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Video upload failed");
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const id = await createPost({
          kind,
          title: title.trim() || undefined,
          body,
          media,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        });
        router.push(`/community/${id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not post");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl border border-border bg-surface p-1 w-fit">
        {(["post", "question"] as const).map((k) => (
          <button
            key={k}
            type="button"
            data-testid={`composer-kind-${k}`}
            onClick={() => setKind(k)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              kind === k ? "bg-accent text-zinc-950" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={kind === "question" ? "What's your question?" : "Title (optional)"}
        data-testid="composer-title"
        className={FIELD}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share your thoughts…"
        data-testid="composer-body"
        className={`${FIELD} min-h-40`}
      />
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Tags, comma-separated (e.g. automation, api)"
        data-testid="composer-tags"
        className={FIELD}
      />

      {media.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {media.length} attachment{media.length > 1 ? "s" : ""} added.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface">
          + Image
          <input type="file" accept="image/*" onChange={onImage} className="hidden" data-testid="composer-image" />
        </label>
        {videoEnabled && (
          <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface">
            + Video (≤60s)
            <input type="file" accept="video/*" onChange={onVideo} className="hidden" data-testid="composer-video" />
          </label>
        )}
        {uploading && <span className="text-xs text-accent">Uploading…</span>}
      </div>

      {error && <p className="text-sm text-red-400" data-testid="composer-error">{error}</p>}

      <Button onClick={submit} loading={pending} disabled={uploading || !body.trim()} data-testid="composer-submit">
        {pending ? "Posting…" : "Post"}
      </Button>
    </div>
  );
}
