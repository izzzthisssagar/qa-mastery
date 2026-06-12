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
    throw new Error(
      "createServiceClient requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
