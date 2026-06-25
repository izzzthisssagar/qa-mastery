"use client";

import { type ChangeEvent, useState, useTransition } from "react";
import { createBrowserSupabase } from "@qa-mastery/db";
import { setAvatarPath } from "@/app/(app)/talent/actions";
import { AVATAR_BUCKET, avatarUrl } from "@/lib/talent/avatar";

/** Uploads a profile photo straight to the public talent-avatars bucket (storage
 *  RLS scopes the write to the user's own folder), then persists the path. */
export function AvatarUploader({
  userId,
  initialPath,
}: {
  userId: string;
  initialPath: string | null;
}) {
  const [path, setPath] = useState<string | null>(initialPath);
  const [bust, setBust] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const supabase = createBrowserSupabase();
    const objectPath = `${userId}/avatar`;
    const { error: upErr } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(objectPath, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setError("Upload failed — use a PNG/JPG/WebP under 5MB.");
      return;
    }

    startTransition(async () => {
      const res = await setAvatarPath(objectPath);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPath(objectPath);
      setBust(Date.now());
    });
  }

  const url = avatarUrl(path);

  return (
    <div className="flex items-center gap-4">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${url}?v=${bust}`}
          alt="Your avatar"
          width={64}
          height={64}
          className="size-16 rounded-full object-cover"
        />
      ) : (
        <div className="flex size-16 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-xs text-zinc-500">
          No photo
        </div>
      )}
      <label className="cursor-pointer text-sm text-accent hover:underline">
        {pending ? "Uploading…" : "Upload photo"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={onFile}
          disabled={pending}
        />
      </label>
      {error && <span className="text-sm text-red-300">{error}</span>}
    </div>
  );
}
