import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

/**
 * Creates an administrative Supabase client using the Service Role Key.
 *
 * CRITICAL SECURITY ARCHITECTURE:
 * - The service role key bypasses Row Level Security (RLS) policies.
 * - It MUST NEVER be prefixed with `NEXT_PUBLIC_` in .env files.
 * - It MUST NEVER be imported, called, or leaked into client components or the browser bundle.
 * - This function enforces an explicit runtime boundary assertion.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "FATAL SECURITY VIOLATION: createAdminClient() was called in a client browser context! " +
      "The Supabase Service Role key must strictly remain confidential on the server."
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. " +
      "Verify that it is present in .env.local without a NEXT_PUBLIC_ prefix."
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
