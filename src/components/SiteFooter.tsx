import { SITE } from "@/lib/utils";

export function SiteFooter() {
  return (
    <footer className="flex flex-wrap justify-between gap-3 border-t border-line px-6 py-8 text-[11px] uppercase tracking-[0.1em] text-muted sm:px-12">
      <span>© {new Date().getFullYear()} {SITE.artist}</span>
      <span>{SITE.origin}</span>
    </footer>
  );
}
