"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ENV_MISSING } from "./env";

/**
 * Supabase client for use in Client Components (browser).
 * Reads the logged-in admin session from cookies set by `@supabase/ssr`.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // supabase-js would otherwise throw a bare "supabaseUrl is required".
  if (!url || !anonKey) throw new Error(SUPABASE_ENV_MISSING);

  return createBrowserClient(url, anonKey);
}
