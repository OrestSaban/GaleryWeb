import Link from "next/link";
import { SITE } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="flex items-baseline justify-between gap-4 px-6 pb-6 pt-6 sm:px-12 sm:pt-7">
      {/* The wordmark links home. The nested divs set their own colours, so the
          hover feedback has to be pushed down from the group. */}
      <Link href="/" className="group" aria-label={`${SITE.artist} — home`}>
        <div className="font-serif text-[22px] font-medium leading-none tracking-[0.02em] text-ink transition-colors duration-300 group-hover:text-accent-deep">
          {SITE.artist}
        </div>
        <div className="mt-1.5 text-[9px] uppercase tracking-[0.24em] text-muted transition-colors duration-300 group-hover:text-ink-soft">
          {SITE.strapline}
        </div>
      </Link>
      <nav className="flex gap-5 text-[12px] uppercase tracking-[0.1em] text-ink-soft sm:gap-[22px]">
        <Link href="/" className="text-ink-soft hover:text-accent-deep">
          Home
        </Link>
        <Link href="/gallery" className="text-ink-soft hover:text-accent-deep">
          Gallery
        </Link>
        <Link href="/contact" className="text-ink-soft hover:text-accent-deep">
          Contact
        </Link>
      </nav>
    </header>
  );
}
