import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/utils";
import { signOut } from "../actions";

// The admin panel is per-session; never attempt to render it statically.
export const dynamic = "force-dynamic";

/**
 * Next signals control flow by throwing: `redirect()`, `notFound()`, and the
 * dynamic-rendering probe all surface as errors carrying a `digest`. Swallowing
 * those in a catch-all breaks the framework, so they must be re-thrown.
 */
function isNextControlFlowError(err: unknown): boolean {
  const digest = (err as { digest?: unknown } | null | undefined)?.digest;
  return (
    typeof digest === "string" &&
    (digest === "DYNAMIC_SERVER_USAGE" ||
      digest === "NEXT_NOT_FOUND" ||
      digest.startsWith("NEXT_REDIRECT"))
  );
}

/**
 * Session guard for every admin route except /admin/login (which sits outside
 * this route group). This is a second, independent check rather than a nicety:
 * `middleware.ts` short-circuits when the Supabase env vars are missing, and
 * middleware has silently stopped running before now, so the layout must fail
 * closed on its own.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = null;
  try {
    // Client construction is inside the try too: it throws outright when the
    // Supabase env vars are absent, which is exactly the case where middleware
    // has already short-circuited and this guard is the only one left.
    const { data } = await createClient().auth.getUser();
    user = data.user;
  } catch (err) {
    if (isNextControlFlowError(err)) throw err;
    // Unreachable or unconfigured Supabase — treat as signed out.
    console.error("[admin] auth.getUser failed:", err);
  }

  if (!user) redirect("/admin/login");

  return (
    <>
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-[18px] sm:px-9">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-[18px]">{SITE.artist}</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-3.5 text-[12px] text-muted">
          <Link href="/admin/paintings" className="text-blue">
            Paintings
          </Link>
          <span className="text-line-warm">|</span>
          <Link href="/admin/collections" className="text-blue">
            Collections
          </Link>
          <span className="text-line-warm">|</span>
          <Link href="/" className="text-blue" target="_blank">
            View site ↗
          </Link>
          <span className="text-line-warm">|</span>
          <span className="hidden sm:inline">{user.email}</span>
          <form action={signOut}>
            <button type="submit" className="text-accent-deep">
              Sign out
            </button>
          </form>
        </div>
      </div>
      <div className="px-5 pb-16 pt-7 sm:px-9">{children}</div>
    </>
  );
}
