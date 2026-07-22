import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS. Server-side only (grading, sandbox
 * provisioning, curriculum sync). Importing this anywhere a client bundle can
 * reach is a launch-blocking bug; CI greps built bundles for the key name.
 */
export function createServiceClient(
  url: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL,
  serviceRoleKey: string | undefined = process.env.SUPABASE_SERVICE_ROLE_KEY,
): SupabaseClient {
  if (!url || !serviceRoleKey) {
    // TEMPORARY diagnostic (2026-07-22, remove once CI E2E env-missing bug
    // is root-caused — see docs/known-issues/e2e-service-client-env-missing.md).
    throw new Error(
      "createServiceClient requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY " +
        `[diag pid=${process.pid} NODE_ENV=${process.env.NODE_ENV} ` +
        `url=${url === undefined ? "undefined" : JSON.stringify(url)} ` +
        `keyPresent=${Boolean(serviceRoleKey)} keyLen=${serviceRoleKey?.length ?? 0} ` +
        `envKeyCount=${Object.keys(process.env).length} ` +
        `hasNextPublicUrlKey=${"NEXT_PUBLIC_SUPABASE_URL" in process.env} ` +
        `hasServiceKeyKey=${"SUPABASE_SERVICE_ROLE_KEY" in process.env}]`,
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
