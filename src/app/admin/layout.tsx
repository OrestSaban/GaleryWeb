export const metadata = { title: "Admin", robots: { index: false, follow: false } };

/**
 * Bare shell shared by every /admin route, including the login page.
 * The session guard lives in `(protected)/layout.tsx`, which wraps only the
 * routes that require a signed-in artist.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#FCFCFB] text-ink">{children}</div>;
}
