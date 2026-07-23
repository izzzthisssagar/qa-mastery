#!/usr/bin/env node
// Fails CI if a table declared in supabase/migrations has no matching RLS
// test in packages/db/test — see CLAUDE.md testing bar ("RLS regression
// tests for every table") and ticket P1-7.
//
// "Covered" means the table name shows up in a `.from("table")` call (or
// `.schema("schema").from("table")` for non-public schemas) in one of the
// vitest files vitest picks up under `pnpm --filter @qa-mastery/db
// test:rls`. That's a presence check, not a correctness check — it can't
// tell you the test asserts the right thing, only that *something* runs
// against that table.

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = "supabase/migrations";
const TEST_DIR = "packages/db/test";

// Tables that predate this gate (P1-7, 2026-07) and don't yet have a
// dedicated RLS test. This list only shrinks — do NOT add a newly created
// table here; write the test instead (see any *-rls.test.ts for the
// pattern). Follow-up: backfill these (tracked outside this ticket).
export const LEGACY_UNTESTED_TABLES = [
  "buggyapi.ba_api_keys",
  "buggyapi.ba_auth_codes",
  "buggyapi.ba_bug_manifest",
  "buggyapi.ba_oauth_clients",
  "buggyapi.ba_oauth_tokens",
  "buggyapi.ba_projects",
  "buggyapi.ba_rate_counters",
  "buggyapi.ba_sandbox_state",
  "buggyapi.ba_sessions",
  "buggyapi.ba_tickets",
  "buggyapi.ba_uploads",
  "buggyapi.ba_users",
  "buggyshop.bs_cart_items",
  "buggyshop.bs_carts",
  "buggyshop.bs_order_items",
  "buggyshop.bs_orders",
  "buggyshop.bs_products",
  "buggyshop.bs_reviews",
  "buggyshop.bs_sandbox_state",
  "buggyshop.bs_sessions",
  "buggyshop.bs_users",
  "public.community_comments",
  "public.community_likes",
  "public.community_post_tags",
  "public.community_reports",
  "public.community_tags",
  "public.entitlements",
  "public.feedback",
  "public.help_agent_memories",
  "public.help_agent_messages",
  "public.help_agent_profiles",
  "public.lesson_chunks",
  "public.profiles",
  "public.review_queue",
  "public.sandboxes",
  "public.talent_applications",
  "public.talent_devices",
  "public.talent_experience",
  "public.talent_projects",
  "public.talent_shortlists",
  "public.talent_sync_state",
  "public.talent_verified_skills",
  "public.test_cases",
];

const CREATE_TABLE_RE = /create\s+table(?:\s+if\s+not\s+exists)?\s+([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+)/gi;
const FROM_CALL_RE = /(?:\.schema\(["'](\w+)["']\)\s*)?\.from\(["'](\w+)["']\)/g;

export function extractDeclaredTables(sqlFiles) {
  const declared = new Set();
  for (const { content } of sqlFiles) {
    for (const match of content.matchAll(CREATE_TABLE_RE)) {
      declared.add(match[1].toLowerCase());
    }
  }
  return declared;
}

export function extractCoveredTables(testFiles) {
  const covered = new Set();
  for (const { content } of testFiles) {
    for (const match of content.matchAll(FROM_CALL_RE)) {
      const schema = match[1] || "public";
      covered.add(`${schema}.${match[2]}`);
    }
  }
  return covered;
}

export function findUncoveredTables(declared, covered, exempt = new Set()) {
  return [...declared].filter((table) => !covered.has(table) && !exempt.has(table)).sort();
}

export function findStaleExemptions(declared, exempt) {
  return [...exempt].filter((table) => !declared.has(table)).sort();
}

function readDirContents(dir, extension) {
  return readdirSync(dir)
    .filter((name) => name.endsWith(extension))
    .map((name) => ({ name, content: readFileSync(join(dir, name), "utf8") }));
}

function main() {
  const declared = extractDeclaredTables(readDirContents(MIGRATIONS_DIR, ".sql"));
  const covered = extractCoveredTables(readDirContents(TEST_DIR, ".test.ts"));
  const exempt = new Set(LEGACY_UNTESTED_TABLES);

  const stale = findStaleExemptions(declared, exempt);
  const missing = findUncoveredTables(declared, covered, exempt);

  if (stale.length > 0) {
    console.error("These LEGACY_UNTESTED_TABLES entries no longer exist in supabase/migrations — remove them from scripts/check-rls-coverage.mjs:");
    for (const table of stale) console.error(`  ${table}`);
  }

  if (missing.length > 0) {
    console.error(`\n${missing.length} table(s) declared in supabase/migrations have no RLS test:`);
    for (const table of missing) console.error(`  ${table}`);
    console.error('\nAdd a `.from("table")` (or `.schema("schema").from("table")`) assertion in packages/db/test/*.test.ts — see CLAUDE.md testing bar.');
  }

  if (stale.length > 0 || missing.length > 0) {
    process.exitCode = 1;
    return;
  }

  console.log(
    `RLS coverage OK — ${covered.size} of ${declared.size} tables have a direct test (${exempt.size} pre-existing exemptions).`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
