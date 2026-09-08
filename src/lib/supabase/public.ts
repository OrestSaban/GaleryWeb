import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./env";

/**
 * Anonymous, cookie-less Supabase client for public page reads.
 *
 * The cookie-based server client calls `cookies()`, which opts the whole route
 * into dynamic rendering — that silently made `export const revalidate` a
 * no-op and put a live query on every visitor's request. Public pages carry no
 * session, so they read through this client instead and stay cacheable (ISR),
 * with `revalidatePath` from the admin actions purging them on edit.
 *
 * Returns `null` rather than throwing when the env vars are absent: the
 * supabase-js constructor throws synchronously ("supabaseUrl is required"),
 * which would 500 the public pages before any query — and before the read
 * helpers get a chance to fall back to an empty gallery.
 */
export function createPublicClient() {
  if (!isSupabaseConfigured()) return null;

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
