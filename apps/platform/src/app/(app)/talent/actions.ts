"use server";

import { z } from "zod";
import { createServiceClient } from "@qa-mastery/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { emitTalentEvent } from "@/lib/talent/events";
import { withinRate } from "@/lib/talent/rate-limit";
import {
  AVAILABILITY,
  DEVICE_KINDS,
  DISCIPLINES,
  ENGAGEMENTS,
  PORTFOLIO_TYPES,
  PROJECT_TYPES,
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
  linkedinUrl: z.string().trim().url().max(300).optional().or(z.literal("")),
  githubUrl: z.string().trim().url().max(300).optional().or(z.literal("")),
  yearsExperience: z.coerce.number().int().min(0).max(60).optional(),
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
  // Two independent writes: the tester profile, and the profiles.talent_role
  // flag. They touch different tables keyed on the same user, so run them
  // concurrently — one DB round-trip instead of two. The sequential version
  // tipped the save past WebKit's e2e latency budget under a live cloud DB.
  const [{ error }] = await Promise.all([
    supabase.from("talent_profiles").upsert({
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
      linkedin_url: p.linkedinUrl || null,
      github_url: p.githubUrl || null,
      years_experience: p.yearsExperience ?? null,
      updated_at: new Date().toISOString(),
    }),
    // Ensure profiles.talent_role reflects tester intent (idempotent).
    supabase.from("profiles").update({ talent_role: "tester" }).eq("id", user.id),
  ]);

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
    assetPath: z.string().trim().max(500).optional(),
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
      asset_path: i.assetPath ?? null,
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
  experience: Record<string, unknown>[];
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
  const [portfolio, devices, badges, experience] = await Promise.all([
    supabase.from("talent_portfolio_items").select("*").eq("tester_id", testerId),
    supabase.from("talent_devices").select("*").eq("tester_id", testerId),
    supabase
      .from("talent_verified_skills")
      .select("*")
      .eq("tester_id", testerId)
      .order("score", { ascending: false }),
    supabase
      .from("talent_experience")
      .select("*")
      .eq("tester_id", testerId)
      .order("start_year", { ascending: false }),
  ]);

  return {
    ok: true,
    data: {
      profile,
      portfolio: portfolio.data ?? [],
      devices: devices.data ?? [],
      badges: badges.data ?? [],
      experience: experience.data ?? [],
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

export type VerifiedSkill = { skill: string; score: number };

/** The caller's verified-skill badges (read-own; public-read RLS allows it). */
export async function getMyVerifiedSkills(): Promise<ActionResult<VerifiedSkill[]>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };
  const { data } = await supabase
    .from("talent_verified_skills")
    .select("skill, score")
    .eq("tester_id", user.id)
    .order("score", { ascending: false });
  return {
    ok: true,
    data: (data ?? []).map((r) => ({ skill: r.skill as string, score: r.score as number })),
  };
}

/** Re-derive the caller's badges from their graded labs on demand (PATH A-lite).
 *  Runs the service-role derivation for this user only; the nightly cron does
 *  everyone. Badges are never learner-writable — this just triggers the
 *  service-role re-derive. */
export async function refreshMyVerifiedSkills(): Promise<ActionResult> {
  const { user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };
  const service = createServiceClient();
  const { error } = await service.rpc("derive_verified_skills", { target: user.id });
  if (error) return { ok: false, error: "Couldn't refresh badges right now — try again" };
  return { ok: true, data: null };
}

// ── M3: directory + project posting ──────────────────────────────────────────

const PAGE = 24;

export type TesterFilters = {
  specialties?: string[];
  stack?: string[];
  availability?: string;
  verifiedOnly?: boolean;
  cursor?: string;
};

export type TesterCardData = {
  handle: string;
  headline: string | null;
  location: string | null;
  availability: string;
  specialties: string[];
  stack: string[];
  avatarPath: string | null;
  badges: { skill: string; score: number }[];
};

/** QA-native tester directory. Public profiles, filtered on the GIN-indexed
 *  array columns, ranked newest-first, keyset-paginated. Badges are fetched in
 *  one batched query (not N+1). */
export async function searchTesters(
  filters: TesterFilters = {},
): Promise<ActionResult<{ items: TesterCardData[]; nextCursor: string | null }>> {
  const supabase = await createSupabaseServerClient();

  // Apply filters while `q` is still a filter builder; order/limit at the await.
  let q = supabase
    .from("talent_profiles")
    .select("id, handle, headline, location, availability, specialties, stack, avatar_path, updated_at")
    .eq("is_public", true);

  const specialties = (filters.specialties ?? []).filter((s) => SPECIALTIES.includes(s as never));
  const stack = (filters.stack ?? []).filter((s) => STACK.includes(s as never));
  if (specialties.length) q = q.overlaps("specialties", specialties);
  if (stack.length) q = q.overlaps("stack", stack);
  if (filters.availability && AVAILABILITY.includes(filters.availability as never)) {
    q = q.eq("availability", filters.availability);
  }
  if (filters.cursor) q = q.lt("updated_at", filters.cursor);

  const { data, error } = await q.order("updated_at", { ascending: false }).limit(PAGE + 1);
  if (error) return { ok: false, error: "Couldn't load testers" };

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const page = rows.slice(0, PAGE);
  const nextCursor = rows.length > PAGE ? (page[page.length - 1]?.updated_at as string) : null;

  // Batched badge fetch for the page.
  const ids = page.map((r) => r.id as string);
  const badgesByTester = new Map<string, { skill: string; score: number }[]>();
  if (ids.length) {
    const { data: badges } = await supabase
      .from("talent_verified_skills")
      .select("tester_id, skill, score")
      .in("tester_id", ids)
      .order("score", { ascending: false });
    for (const b of badges ?? []) {
      const list = badgesByTester.get(b.tester_id as string) ?? [];
      list.push({ skill: b.skill as string, score: b.score as number });
      badgesByTester.set(b.tester_id as string, list);
    }
  }

  let items: TesterCardData[] = page.map((r) => ({
    handle: r.handle as string,
    headline: (r.headline as string) ?? null,
    location: (r.location as string) ?? null,
    availability: (r.availability as string) ?? "open",
    specialties: (r.specialties as string[]) ?? [],
    stack: (r.stack as string[]) ?? [],
    avatarPath: (r.avatar_path as string) ?? null,
    badges: (badgesByTester.get(r.id as string) ?? []).slice(0, 3),
  }));

  if (filters.verifiedOnly) items = items.filter((t) => t.badges.length > 0);

  return { ok: true, data: { items, nextCursor } };
}

const ProjectSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(8000).optional(),
  projectType: inSet(PROJECT_TYPES, "Pick a project type"),
  stack: z.array(inSet(STACK, "Unknown tool")).max(20).default([]),
  requiredTypes: z.array(inSet(SPECIALTIES, "Unknown testing type")).max(13).default([]),
  engagement: inSet(ENGAGEMENTS, "Pick an engagement"),
  budgetCents: z.coerce.number().int().min(0).max(100_000_00).optional(),
  tooling: z.array(z.string().trim().max(40)).max(20).default([]),
  ndaRequired: z.boolean().default(false),
});
export type ProjectInput = z.input<typeof ProjectSchema>;

/** Post a project (client side). Sets the role to client/both and emits the
 *  funnel event. */
export async function postProject(input: ProjectInput): Promise<ActionResult<{ id: string }>> {
  const parsed = ProjectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid project" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };

  if (!(await withinRate(user.id, "talent.project_posted")))
    return { ok: false, error: "You've posted several projects recently — try again later." };

  const p = parsed.data;
  const { data, error } = await supabase
    .from("talent_projects")
    .insert({
      owner_id: user.id,
      title: p.title,
      description: p.description ?? null,
      project_type: p.projectType,
      stack: p.stack,
      required_types: p.requiredTypes,
      engagement: p.engagement,
      budget_cents: p.budgetCents ?? null,
      tooling: p.tooling,
      nda_required: p.ndaRequired,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Couldn't post your project — try again" };

  // Reflect client intent in the role (tester → both, none → client).
  const { data: prof } = await supabase.from("profiles").select("talent_role").eq("id", user.id).single();
  const role = prof?.talent_role as string | undefined;
  const nextRole = role === "tester" || role === "both" ? "both" : "client";
  await supabase.from("profiles").update({ talent_role: nextRole }).eq("id", user.id);

  await emitTalentEvent(user.id, "talent.project_posted", {
    project_id: data.id as string,
    required_types: p.requiredTypes,
    engagement: p.engagement,
  });
  return { ok: true, data: { id: data.id as string } };
}

// ── M4: contact (consent boundary) + messaging ───────────────────────────────

/** Open (or reuse) a conversation with a tester. The caller is the client; the
 *  conversation row is the consent boundary — no message can exist without it
 *  (RLS). Idempotent per (client, tester, project). */
export async function contactTester(input: {
  handle: string;
  projectId?: string;
  from?: "directory" | "project";
}): Promise<ActionResult<{ conversationId: string }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };
  if (!(await withinRate(user.id, "talent.contact_initiated")))
    return { ok: false, error: "You're contacting a lot of testers — try again later." };

  const { data: tester } = await supabase
    .from("talent_profiles")
    .select("id")
    .eq("handle", input.handle.toLowerCase())
    .eq("is_public", true)
    .maybeSingle();
  if (!tester) return { ok: false, error: "Tester not found" };
  const testerId = tester.id as string;
  if (testerId === user.id) return { ok: false, error: "You can't contact yourself" };

  let existingQ = supabase
    .from("talent_conversations")
    .select("id")
    .eq("client_id", user.id)
    .eq("tester_id", testerId);
  existingQ = input.projectId ? existingQ.eq("project_id", input.projectId) : existingQ.is("project_id", null);
  const { data: existing } = await existingQ.maybeSingle();
  if (existing?.id) return { ok: true, data: { conversationId: existing.id as string } };

  const { data: created, error } = await supabase
    .from("talent_conversations")
    .insert({
      client_id: user.id,
      tester_id: testerId,
      project_id: input.projectId ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !created) return { ok: false, error: "Couldn't start the conversation" };

  const conversationId = created.id as string;
  await emitTalentEvent(user.id, "talent.contact_initiated", {
    conversation_id: conversationId,
    client_id: user.id,
    tester_id: testerId,
    from: input.from ?? "directory",
  });
  return { ok: true, data: { conversationId } };
}

export type ConversationSummary = {
  id: string;
  otherId: string;
  otherHandle: string | null;
  role: "client" | "tester";
  lastMessage: string | null;
  lastAt: string | null;
};

/** The caller's conversations (RLS: participant-only), newest first, with the
 *  other party's handle and last-message preview (batched, no N+1). */
export async function getConversations(): Promise<ActionResult<ConversationSummary[]>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };

  const { data: convos } = await supabase
    .from("talent_conversations")
    .select("id, client_id, tester_id, created_at")
    .or(`client_id.eq.${user.id},tester_id.eq.${user.id}`)
    .order("created_at", { ascending: false });
  const rows = (convos ?? []) as Array<Record<string, unknown>>;
  if (!rows.length) return { ok: true, data: [] };

  const convoIds = rows.map((c) => c.id as string);
  const otherIds = rows.map((c) =>
    c.client_id === user.id ? (c.tester_id as string) : (c.client_id as string),
  );

  const [{ data: profiles }, { data: msgs }] = await Promise.all([
    supabase.from("talent_profiles").select("id, handle").in("id", otherIds),
    supabase
      .from("talent_messages")
      .select("conversation_id, body, created_at")
      .in("conversation_id", convoIds)
      .order("created_at", { ascending: false }),
  ]);

  const handleById = new Map((profiles ?? []).map((p) => [p.id as string, p.handle as string]));
  const lastByConvo = new Map<string, { body: string; at: string }>();
  for (const m of msgs ?? []) {
    const cid = m.conversation_id as string;
    if (!lastByConvo.has(cid)) lastByConvo.set(cid, { body: m.body as string, at: m.created_at as string });
  }

  const items: ConversationSummary[] = rows.map((c) => {
    const otherId = c.client_id === user.id ? (c.tester_id as string) : (c.client_id as string);
    const last = lastByConvo.get(c.id as string);
    return {
      id: c.id as string,
      otherId,
      otherHandle: handleById.get(otherId) ?? null,
      role: c.client_id === user.id ? "client" : "tester",
      lastMessage: last?.body ?? null,
      lastAt: last?.at ?? null,
    };
  });
  return { ok: true, data: items };
}

export type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

/** Messages in a conversation (RLS participant-only), oldest first. */
export async function getMessages(conversationId: string): Promise<ActionResult<Message[]>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };
  const { data } = await supabase
    .from("talent_messages")
    .select("id, sender_id, body, created_at, read_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return { ok: true, data: (data ?? []) as Message[] };
}

/** Emit talent.connection_made once both sides have spoken (the North-Star
 *  event). Uses the service role to read the full message set + check it hasn't
 *  already fired. */
async function maybeEmitConnection(conversationId: string, clientId: string, testerId: string) {
  const service = createServiceClient();
  const { data: existing } = await service
    .from("audit_events")
    .select("id")
    .eq("action", "talent.connection_made")
    .contains("metadata", { conversation_id: conversationId })
    .limit(1);
  if (existing && existing.length) return;

  const { data: senders } = await service
    .from("talent_messages")
    .select("sender_id")
    .eq("conversation_id", conversationId);
  const set = new Set((senders ?? []).map((s) => s.sender_id as string));
  if (set.has(clientId) && set.has(testerId)) {
    await emitTalentEvent(clientId, "talent.connection_made", { conversation_id: conversationId });
  }
}

/** Send a message (RLS: participant + sender = self). Emits message_sent and,
 *  when this crosses both-sides-have-spoken, connection_made. */
export async function sendMessage(
  conversationId: string,
  body: string,
): Promise<ActionResult<{ id: string }>> {
  const trimmed = body.trim();
  if (trimmed.length < 1 || trimmed.length > 8000) {
    return { ok: false, error: "Message must be 1–8000 characters" };
  }
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };
  if (!(await withinRate(user.id, "talent.message_sent")))
    return { ok: false, error: "Slow down a moment — you've sent a lot of messages." };

  const { data: convo } = await supabase
    .from("talent_conversations")
    .select("client_id, tester_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!convo) return { ok: false, error: "Conversation not found" };

  const { data: msg, error } = await supabase
    .from("talent_messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, body: trimmed })
    .select("id")
    .single();
  if (error || !msg) return { ok: false, error: "Couldn't send your message" };

  const senderRole = convo.client_id === user.id ? "client" : "tester";
  await emitTalentEvent(user.id, "talent.message_sent", {
    conversation_id: conversationId,
    sender_role: senderRole,
  });
  await maybeEmitConnection(conversationId, convo.client_id as string, convo.tester_id as string);

  return { ok: true, data: { id: msg.id as string } };
}

/** Mark the other party's messages in a conversation as read (scoped RPC). */
export async function markRead(conversationId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };
  const { error } = await supabase.rpc("talent_mark_read", { conv: conversationId });
  return error ? { ok: false, error: "Couldn't update read status" } : { ok: true, data: null };
}

// ── M5: applications + moderation ────────────────────────────────────────────

export type ProjectCardData = {
  id: string;
  title: string;
  project_type: string;
  required_types: string[];
  engagement: string;
  nda_required: boolean;
  created_at: string;
};

/** Open projects for testers to browse, keyset-paginated newest-first. */
export async function getOpenProjects(
  cursor?: string,
): Promise<ActionResult<{ items: ProjectCardData[]; nextCursor: string | null }>> {
  const supabase = await createSupabaseServerClient();
  let q = supabase
    .from("talent_projects")
    .select("id, title, project_type, required_types, engagement, nda_required, created_at")
    .eq("status", "open");
  if (cursor) q = q.lt("created_at", cursor);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(PAGE + 1);
  if (error) return { ok: false, error: "Couldn't load projects" };
  const rows = (data ?? []) as ProjectCardData[];
  const page = rows.slice(0, PAGE);
  const nextCursor = rows.length > PAGE ? page[page.length - 1].created_at : null;
  return { ok: true, data: { items: page, nextCursor } };
}

export type ProjectDetail = {
  project: Record<string, unknown>;
  applications: Record<string, unknown>[];
  isOwner: boolean;
  myApplication: Record<string, unknown> | null;
};

/** A project + its applications. RLS scopes what's visible: the owner sees all
 *  applications; a tester sees only their own. */
export async function getProject(id: string): Promise<ActionResult<ProjectDetail>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };
  const { data: project } = await supabase.from("talent_projects").select("*").eq("id", id).maybeSingle();
  if (!project) return { ok: false, error: "Project not found" };

  const isOwner = project.owner_id === user.id;
  const { data: applications } = await supabase
    .from("talent_applications")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });
  const apps = (applications ?? []) as Array<Record<string, unknown>>;
  const myApplication = apps.find((a) => a.tester_id === user.id) ?? null;

  return { ok: true, data: { project, applications: isOwner ? apps : [], isOwner, myApplication } };
}

/** Tester applies to a project (RLS: tester submits own; unique per project). */
export async function applyToProject(
  projectId: string,
  note?: string,
): Promise<ActionResult<{ id: string }>> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };
  if (!(await withinRate(user.id, "talent.application_submitted")))
    return { ok: false, error: "You've applied to a lot of projects — try again later." };

  const trimmedNote = (note ?? "").trim().slice(0, 2000) || null;
  const { data, error } = await supabase
    .from("talent_applications")
    .insert({ project_id: projectId, tester_id: user.id, note: trimmedNote })
    .select("id")
    .single();
  if (error || !data) {
    if (error?.code === "23505") return { ok: false, error: "You've already applied to this project" };
    return { ok: false, error: "Couldn't submit your application" };
  }
  await emitTalentEvent(user.id, "talent.application_submitted", {
    project_id: projectId,
    tester_id: user.id,
  });
  return { ok: true, data: { id: data.id as string } };
}

/** Project owner moves an application through its lifecycle (RLS: owner only). */
export async function setApplicationStatus(
  applicationId: string,
  status: string,
): Promise<ActionResult> {
  const parsed = z.enum(["applied", "shortlisted", "declined", "hired"]).safeParse(status);
  if (!parsed.success) return { ok: false, error: "Invalid status" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };

  const { data: app } = await supabase
    .from("talent_applications")
    .select("project_id, tester_id")
    .eq("id", applicationId)
    .maybeSingle();
  const { error } = await supabase
    .from("talent_applications")
    .update({ status: parsed.data })
    .eq("id", applicationId);
  if (error) return { ok: false, error: "Couldn't update the application" };

  if (parsed.data === "hired" && app) {
    await emitTalentEvent(user.id, "talent.hire_marked", {
      project_id: app.project_id as string,
      tester_id: app.tester_id as string,
    });
  }
  return { ok: true, data: null };
}

/** Report a profile/project/message for moderation (insert-own; service-role
 *  triage). */
export async function reportContent(
  targetType: string,
  targetId: string,
  reason: string,
): Promise<ActionResult> {
  const tt = z.enum(["profile", "project", "message"]).safeParse(targetType);
  if (!tt.success) return { ok: false, error: "Invalid report target" };
  const trimmed = reason.trim();
  if (trimmed.length < 1 || trimmed.length > 2000) return { ok: false, error: "Add a short reason" };

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };
  if (!(await withinRate(user.id, "talent.reported")))
    return { ok: false, error: "You've filed several reports recently." };

  const { error } = await supabase.from("talent_reports").insert({
    reporter_id: user.id,
    target_type: tt.data,
    target_id: targetId,
    reason: trimmed,
  });
  if (error) return { ok: false, error: "Couldn't file the report" };
  await emitTalentEvent(user.id, "talent.reported", { target_type: tt.data, target_id: targetId });
  return { ok: true, data: null };
}

/** Save the caller's uploaded avatar path (the file already lives in the public
 *  talent-avatars bucket under their own folder; storage RLS owns that write). */
export async function setAvatarPath(path: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };
  if (!path.startsWith(`${user.id}/`)) return { ok: false, error: "Invalid avatar path" };
  const { error } = await supabase
    .from("talent_profiles")
    .update({ avatar_path: path })
    .eq("id", user.id);
  return error ? { ok: false, error: "Couldn't save your photo" } : { ok: true, data: null };
}

const PORTFOLIO_BUCKET = "talent-portfolio";

/** Mint a short-lived signed URL for a portfolio item's attached file. The RLS
 *  read on talent_portfolio_items gates visibility (NDA items return nothing to
 *  non-owners); the service role then signs the private object. */
export async function getPortfolioSignedUrl(
  itemId: string,
): Promise<ActionResult<{ url: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: item } = await supabase
    .from("talent_portfolio_items")
    .select("asset_path")
    .eq("id", itemId)
    .maybeSingle();
  const path = (item?.asset_path as string | null) ?? null;
  if (!path) return { ok: false, error: "Not available" };

  const service = createServiceClient();
  const { data, error } = await service.storage.from(PORTFOLIO_BUCKET).createSignedUrl(path, 120);
  if (error || !data) return { ok: false, error: "Couldn't generate a download link" };
  return { ok: true, data: { url: data.signedUrl } };
}

// ── Experience, CV & social links (the experienced-pro path) ─────────────────

const ExperienceSchema = z.object({
  company: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(120),
  startYear: z.coerce.number().int().min(1980).max(2100),
  endYear: z.coerce.number().int().min(1980).max(2100).optional(),
  summary: z.string().trim().max(2000).optional(),
});
export type ExperienceInput = z.input<typeof ExperienceSchema>;

export async function addExperience(
  input: ExperienceInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = ExperienceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };
  const e = parsed.data;
  const { data, error } = await supabase
    .from("talent_experience")
    .insert({
      tester_id: user.id,
      company: e.company,
      role: e.role,
      start_year: e.startYear,
      end_year: e.endYear ?? null,
      summary: e.summary ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Couldn't add the role" };
  return { ok: true, data: { id: data.id as string } };
}

export async function removeExperience(id: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };
  const { error } = await supabase
    .from("talent_experience")
    .delete()
    .eq("id", id)
    .eq("tester_id", user.id);
  return error ? { ok: false, error: "Couldn't remove the role" } : { ok: true, data: null };
}

/** Save the caller's uploaded CV path (file already in the private portfolio
 *  bucket under their own folder; storage RLS owns that write). */
export async function setCvPath(path: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Please sign in" };
  if (!path.startsWith(`${user.id}/`)) return { ok: false, error: "Invalid CV path" };
  const { error } = await supabase
    .from("talent_profiles")
    .update({ cv_path: path })
    .eq("id", user.id);
  return error ? { ok: false, error: "Couldn't save your CV" } : { ok: true, data: null };
}

/** Signed URL for a public tester's CV (private bucket → service-role signed). */
export async function getCvSignedUrl(handle: string): Promise<ActionResult<{ url: string }>> {
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("talent_public_profile")
    .select("cv_path")
    .eq("handle", handle.toLowerCase())
    .maybeSingle();
  const path = (profile?.cv_path as string | null) ?? null;
  if (!path) return { ok: false, error: "No CV available" };
  const service = createServiceClient();
  const { data, error } = await service.storage.from(PORTFOLIO_BUCKET).createSignedUrl(path, 120);
  if (error || !data) return { ok: false, error: "Couldn't generate a download link" };
  return { ok: true, data: { url: data.signedUrl } };
}
