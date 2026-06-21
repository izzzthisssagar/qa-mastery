"use client";

import { useActionState } from "react";
import { Button } from "@qa-mastery/ui";
import { updateProfile, type ProfileState } from "./actions";

const INITIAL: ProfileState = { error: null };

const field =
  "w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-accent/70";
const label = "mb-1.5 block text-[0.7rem] font-medium uppercase tracking-[0.18em] text-zinc-500";

export function SettingsForm({
  displayName,
  username,
  avatarUrl,
}: {
  displayName: string;
  username: string;
  avatarUrl: string;
}) {
  const [state, action, pending] = useActionState(updateProfile, INITIAL);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="display_name" className={label}>
          Display name
        </label>
        <input
          id="display_name"
          name="display_name"
          defaultValue={displayName}
          maxLength={80}
          placeholder="Your name"
          className={field}
        />
      </div>

      <div>
        <label htmlFor="username" className={label}>
          Username
        </label>
        <input
          id="username"
          name="username"
          defaultValue={username}
          placeholder="your-handle"
          className={field}
        />
        <p className="mt-1 text-xs text-zinc-600">
          3–30 chars: letters, numbers, hyphen or underscore. Used for your public profile.
        </p>
      </div>

      <div>
        <label htmlFor="avatar_url" className={label}>
          Avatar URL
        </label>
        <input
          id="avatar_url"
          name="avatar_url"
          type="url"
          defaultValue={avatarUrl}
          placeholder="https://…/avatar.png"
          className={field}
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {state.error ? (
          <span role="alert" data-testid="form-error" className="text-sm text-red-300">
            {state.error}
          </span>
        ) : null}
        {state.ok ? (
          <span role="status" className="text-sm text-emerald-300">
            Saved.
          </span>
        ) : null}
      </div>
    </form>
  );
}
