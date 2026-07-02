import { createServiceClient } from "@qa-mastery/db";

/**
 * Service-role client pinned to the deny-all `buggyapi` schema.
 * Server-only — every table access in this app goes through here (invariant:
 * learners never talk to the schema directly; sandbox scoping is enforced by
 * the auth middleware putting sandbox_id on every query).
 */
export function buggyapiDb() {
  return createServiceClient().schema("buggyapi");
}
