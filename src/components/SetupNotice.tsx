import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Rendered only before the project has been connected to Supabase. Without it
 * an unconfigured site just looks like a gallery with no work in it, which is
 * a confusing first run.
 */
export function SetupNotice() {
  if (isSupabaseConfigured()) return null;

  return (
    <div className="border-b border-[#EBD9CF] bg-[#FBF6F3] px-6 py-3 text-[12px] leading-relaxed text-[#A85B36] sm:px-12">
      <strong className="font-medium">Supabase isn&rsquo;t connected yet.</strong>{" "}
      Copy <code className="font-mono">.env.example</code> to{" "}
      <code className="font-mono">.env.local</code>, add your project URL and
      anon key, then restart the dev server. See the README for the full setup.
    </div>
  );
}
