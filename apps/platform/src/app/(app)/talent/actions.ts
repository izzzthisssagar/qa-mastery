"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { emitTalentEvent } from "@/lib/talent/events";
import {
  AVAILABILITY,
  DEVICE_KINDS,
  DISCIPLINES,
  PORTFOLIO_TYPES,
  SPECIALTIES,
  STACK,
} from "@/lib/talent/taxonomy";

/**
 * Talent marketplace Server Actions (M1 — tester profile + portfolio). Every
 * mutation re-checks auth (the layout boundary is optimistic only, per
 * CLAUDE.md) and writes through the request-scoped RLS client, so the database
 * policies in 20260621000017_talent.sql are the real security boundary. Taxonomy
 * fields are allow-list validated here to keep directory filters precise.
 */

export type ActionResult<T = null> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const inSet = (set: readonly string[], msg: string) =>
  z.string().refine((v) => set.includes(v), msg);

const ProfileSchema = z.object({
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{3,32}$/, "Handle: 3–32 chars, lowercase letters/numbers/dashes"),
  headline: z.string().trim().max(120).optional(),
  bio: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(120).optional(),
  timezone: z.string().trim().max(64).optional(),
  langs: z.array(z.string().trim().max(40)).max(10).default([]),
  discipline: inSet(DISCIPLINES, "Invalid discipline").default("both"),
  specialties: z.array(inSet(SPECIALTIES, "Unknown specialty")).max(13).default([]),
  stack: z.array(inSet(STACK, "Unknown tool")).max(20).default([]),
  rateCents: z.coerce.number().int().min(0).max(100_000_00).optional(),
});

export type ProfileInput = z.input<typeof ProfileSchema>;

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Create or update the caller's tester profile (RLS: owner-only). */
export async function upsertTesterProfile(input: ProfileInput): Promise<ActionResult> {
  const parsed = ProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid profile" };
  }
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };

  const p = parsed.data;
  const { error } = await supabase.from("talent_profiles").upsert({
    id: user.id,
    handle: p.handle,
    headline: p.headline ?? null,
    bio: p.bio ?? null,
    location: p.location ?? null,
    timezone: p.timezone ?? null,
    langs: p.langs,
    discipline: p.discipline,
    specialties: p.specialties,
    stack: p.stack,
    rate_cents: p.rateCents ?? null,
    updated_at: new Date().toISOString(),
  });

  // Ensure profiles.talent_role reflects tester intent (idempotent).
  await supabase.from("profiles").update({ talent_role: "tester" }).eq("id", user.id);

  if (error) {
    if (error.code === "23505") return { ok: false, error: "That handle is taken" };
    return { ok: false, error: "Couldn't save your profile — try again" };
  }
  return { ok: true, data: null };
}

export async function setAvailability(value: string): Promise<ActionResult> {
  const parsed = inSet(AVAILABILITY, "Invalid availability").safeParse(value);
  if (!parsed.success) return { ok: false, error: "Invalid availability" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };
  const { error } = await supabase
    .from("talent_profiles")
    .update({ availability: parsed.data })
    .eq("id", user.id);
  return error ? { ok: false, error: "Couldn't update availability" } : { ok: true, data: null };
}

const DeviceSchema = z.object({
  kind: inSet(DEVICE_KINDS, "Invalid device kind"),
  device: z.string().trim().min(1).max(80),
  os: z.string().trim().max(40).optional(),
  osVersion: z.string().trim().max(40).optional(),
  browser: z.string().trim().max(40).optional(),
});
export type DeviceInput = z.input<typeof DeviceSchema>;

export async function addDevice(input: DeviceInput): Promise<ActionResult<{ id: string }>> {
  const parsed = DeviceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid device" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };
  const d = parsed.data;
  const { data, error } = await supabase
    .from("talent_devices")
    .insert({
      tester_id: user.id,
      kind: d.kind,
      device: d.device,
      os: d.os ?? null,
      os_version: d.osVersion ?? null,
      browser: d.browser ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Couldn't add device" };
  return { ok: true, data: { id: data.id as string } };
}

export async function removeDevice(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };
  // RLS scopes the delete to the owner; the tester_id filter is defence-in-depth.
  const { error } = await supabase
    .from("talent_devices")
    .delete()
    .eq("id", id)
    .eq("tester_id", user.id);
  return error ? { ok: false, error: "Couldn't remove device" } : { ok: true, data: null };
}

const PortfolioSchema = z
  .object({
    type: inSet(PORTFOLIO_TYPES, "Invalid type"),
    title: z.string().trim().min(1).max(160),
    body: z.string().trim().max(8000).optional(),
    repoUrl: z.string().trim().url().max(500).optional(),
    sourceTable: z.enum(["bug_reports", "test_cases", "capstone_submissions"]).optional(),
    sourceId: z.string().uuid().optional(),
    isNda: z.boolean().default(false),
  })
  .refine((v) => (v.sourceId == null) === (v.sourceTable == null), {
    message: "Linked artifacts need both a source table and id",
  });
export type PortfolioInput = z.input<typeof PortfolioSchema>;

export async function addPortfolioItem(
  input: PortfolioInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = PortfolioSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid item" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };
  const i = parsed.data;
  const { data, error } = await supabase
    .from("talent_portfolio_items")
    .insert({
      tester_id: user.id,
      type: i.type,
      title: i.title,
      body: i.body ?? null,
      repo_url: i.repoUrl ?? null,
      source_table: i.sourceTable ?? null,
      source_id: i.sourceId ?? null,
      is_nda: i.isNda,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Couldn't add portfolio item" };
  return { ok: true, data: { id: data.id as string } };
}

/** Publish (or unpublish) the profile. Publishing requires a minimum of signal
 *  so the directory never shows an empty card; emits the North-Star funnel
 *  event. */
export async function publishProfile(isPublic: boolean): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };

  if (isPublic) {
    const { data: profile } = await supabase
      .from("talent_profiles")
      .select("specialties")
      .eq("id", user.id)
      .single();
    const specialties = (profile?.specialties as string[] | null) ?? [];
    if (specialties.length === 0) {
      return { ok: false, error: "Add at least one specialty before publishing" };
    }
  }

  const { error } = await supabase
    .from("talent_profiles")
    .update({ is_public: isPublic })
    .eq("id", user.id);
  if (error) return { ok: false, error: "Couldn't update your profile" };

  if (isPublic) {
    const [{ count: devices }, { count: portfolio }, { data: prof }] = await Promise.all([
      supabase.from("talent_devices").select("id", { count: "exact", head: true }).eq("tester_id", user.id),
      supabase
        .from("talent_portfolio_items")
        .select("id", { count: "exact", head: true })
        .eq("tester_id", user.id),
      supabase.from("talent_profiles").select("specialties").eq("id", user.id).single(),
    ]);
    await emitTalentEvent(user.id, "talent.profile_published", {
      tester_id: user.id,
      specialties_count: ((prof?.specialties as string[] | null) ?? []).length,
      devices_count: devices ?? 0,
      portfolio_count: portfolio ?? 0,
    });
  }
  return { ok: true, data: null };
}

export type PublicProfile = {
  profile: Record<string, unknown>;
  portfolio: Record<string, unknown>[];
  devices: Record<string, unknown>[];
  badges: Record<string, unknown>[];
};

/** Public tester profile by handle. Reads the PII-safe view + related rows in
 *  parallel; RLS filters NDA items and non-public profiles automatically. */
export async function getPublicProfile(handle: string): Promise<ActionResult<PublicProfile>> {
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("talent_public_profile")
    .select("*")
    .eq("handle", handle.toLowerCase())
    .maybeSingle();
  if (!profile) return { ok: false, error: "Profile not found" };

  const testerId = profile.id as string;
  const [portfolio, devices, badges] = await Promise.all([
    supabase.from("talent_portfolio_items").select("*").eq("tester_id", testerId),
    supabase.from("talent_devices").select("*").eq("tester_id", testerId),
    supabase
      .from("talent_verified_skills")
      .select("*")
      .eq("tester_id", testerId)
      .order("score", { ascending: false }),
  ]);

  return {
    ok: true,
    data: {
      profile,
      portfolio: portfolio.data ?? [],
      devices: devices.data ?? [],
      badges: badges.data ?? [],
    },
  };
}

/** Onboarding role chooser. Sets profiles.talent_role and records the funnel
 *  event. */
export async function selectRole(role: string): Promise<ActionResult> {
  const parsed = z.enum(["tester", "client", "both"]).safeParse(role);
  if (!parsed.success) return { ok: false, error: "Pick a role" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };

  const { error } = await supabase
    .from("profiles")
    .update({ talent_role: parsed.data })
    .eq("id", user.id);
  if (error) return { ok: false, error: "Couldn't save your choice — try again" };

  await emitTalentEvent(user.id, "talent.role_selected", { role: parsed.data });
  return { ok: true, data: null };
}

export type ReusableArtifact = {
  source_table: "bug_reports" | "test_cases";
  source_id: string;
  title: string;
  meta: string;
};

/** The caller's existing learning-side artifacts that can be linked into the
 *  portfolio (Arch ADR-003 — reuse, don't duplicate). RLS read-own applies. */
export async function getReusableArtifacts(): Promise<ActionResult<ReusableArtifact[]>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };

  const [bugs, cases] = await Promise.all([
    supabase
      .from("bug_reports")
      .select("id, title, severity, created_at")
      .order("created_at", { ascending: false })
      .limit(25),
    supabase
      .from("test_cases")
      .select("id, title, priority, created_at")
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  const items: ReusableArtifact[] = [
    ...(bugs.data ?? []).map((b) => ({
      source_table: "bug_reports" as const,
      source_id: b.id as string,
      title: b.title as string,
      meta: `bug · ${b.severity as string}`,
    })),
    ...(cases.data ?? []).map((c) => ({
      source_table: "test_cases" as const,
      source_id: c.id as string,
      title: c.title as string,
      meta: `test case · ${c.priority as string}`,
    })),
  ];
  return { ok: true, data: items };
}
