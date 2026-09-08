/**
 * Env checks shared by all three Supabase clients. Kept in its own module so
 * importing the message from a Client Component doesn't drag supabase-js into
 * the browser bundle.
 *
 * These are `NEXT_PUBLIC_*`, so Next inlines them at build time and the checks
 * work identically on the server and in the browser.
 */
export const SUPABASE_ENV_MISSING =
  "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. " +
  "Copy .env.example to .env.local and fill in your Supabase project values.";

/** True when the project has not been pointed at a Supabase instance yet. */
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
