"use client";

import { useState, useTransition } from "react";
import { Button } from "@qa-mastery/ui";
import {
  AVAILABILITY,
  SPECIALTIES,
  STACK,
  labelFor,
} from "@/lib/talent/taxonomy";
import {
  publishProfile,
  upsertTesterProfile,
  type ProfileInput,
} from "@/app/(app)/talent/actions";

type Initial = {
  handle?: string;
  headline?: string;
  bio?: string;
  location?: string;
  specialties?: string[];
  stack?: string[];
  availability?: string;
  isPublic?: boolean;
  linkedinUrl?: string;
  githubUrl?: string;
  yearsExperience?: number;
};

function Chips({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(o)}
            className={
              "rounded-full border px-3 py-1 text-xs transition-colors " +
              (on
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-200"
                : "border-border text-muted-foreground hover:border-border")
            }
          >
            {labelFor(o)}
          </button>
        );
      })}
    </div>
  );
}

const field =
  "w-full rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm text-foreground outline-none focus-visible:border-border";

export function ProfileEditor({ initial }: { initial: Initial }) {
  const [handle, setHandle] = useState(initial.handle ?? "");
  const [headline, setHeadline] = useState(initial.headline ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [location, setLocation] = useState(initial.location ?? "");
  const [specialties, setSpecialties] = useState<string[]>(initial.specialties ?? []);
  const [stack, setStack] = useState<string[]>(initial.stack ?? []);
  const [availability, setAvailability] = useState(initial.availability ?? "open");
  const [isPublic, setIsPublic] = useState(Boolean(initial.isPublic));
  const [linkedinUrl, setLinkedinUrl] = useState(initial.linkedinUrl ?? "");
  const [githubUrl, setGithubUrl] = useState(initial.githubUrl ?? "");
  const [yearsExperience, setYearsExperience] = useState(
    initial.yearsExperience != null ? String(initial.yearsExperience) : "",
  );

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  // Which action is in flight — both buttons disable while pending, but only
  // the active one should show its spinner.
  const [active, setActive] = useState<"save" | "publish" | null>(null);

  // simple "profile strength" — fixes the UX Valley of Death (shows payoff).
  const strength = Math.min(
    100,
    (handle ? 25 : 0) +
      (specialties.length ? 25 : 0) +
      (headline ? 20 : 0) +
      (stack.length ? 15 : 0) +
      (bio ? 15 : 0),
  );

  const toggle = (list: string[], set: (v: string[]) => void) => (v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  function save() {
    setError(null);
    setSaved(false);
    setActive("save");
    startTransition(async () => {
      const input: ProfileInput = {
        handle,
        headline: headline || undefined,
        bio: bio || undefined,
        location: location || undefined,
        specialties,
        stack,
        langs: [],
        discipline: "both",
        linkedinUrl: linkedinUrl || undefined,
        githubUrl: githubUrl || undefined,
        yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
      };
      const res = await upsertTesterProfile(input);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
    });
  }

  function togglePublish() {
    setError(null);
    setActive("publish");
    startTransition(async () => {
      const next = !isPublic;
      const res = await publishProfile(next);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setIsPublic(next);
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Profile strength</span>
          <span>{strength}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={strength}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised"
        >
          <div className="h-full bg-emerald-400 transition-all" style={{ width: `${strength}%` }} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Handle</span>
          <input
            className={field}
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="priya-qa"
            aria-label="Handle"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Location</span>
          <input
            className={field}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Kathmandu, NP"
            aria-label="Location"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">Headline</span>
        <input
          className={field}
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Automation tester — Playwright + API, real devices"
          aria-label="Headline"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">Bio</span>
        <textarea
          className={field + " min-h-24 resize-y"}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="What you test, how you prove it."
          aria-label="Bio"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_8rem]">
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">LinkedIn</span>
          <input
            className={field}
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/…"
            aria-label="LinkedIn URL"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">GitHub</span>
          <input
            className={field}
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/…"
            aria-label="GitHub URL"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-muted-foreground">Years exp.</span>
          <input
            type="number"
            min={0}
            max={60}
            className={field}
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            placeholder="5"
            aria-label="Years of experience"
          />
        </label>
      </div>

      <div className="space-y-2 text-sm">
        <span className="block text-muted-foreground">Specialties</span>
        <Chips options={SPECIALTIES} selected={specialties} onToggle={toggle(specialties, setSpecialties)} />
      </div>

      <div className="space-y-2 text-sm">
        <span className="block text-muted-foreground">Automation stack</span>
        <Chips options={STACK} selected={stack} onToggle={toggle(stack, setStack)} />
      </div>

      <div className="space-y-2 text-sm">
        <span className="block text-muted-foreground">Availability</span>
        <Chips
          options={AVAILABILITY}
          selected={[availability]}
          onToggle={(v) => setAvailability(v)}
        />
      </div>

      {error && <p className="text-sm text-danger-text">{error}</p>}
      {saved && !error && <p className="text-sm text-emerald-300">Saved.</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} loading={pending && active === "save"} disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
        <Button
          variant="secondary"
          onClick={togglePublish}
          loading={pending && active === "publish"}
          disabled={pending || !handle}
        >
          {isPublic ? "Unpublish" : "Publish"}
        </Button>
        <span className="text-xs text-muted-foreground">
          {isPublic ? "Your profile is live in the directory." : "Draft — only you can see it."}
        </span>
      </div>
    </div>
  );
}
