import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-base px-6 text-center">
      <div className="font-serif text-[64px] leading-none text-ink">404</div>
      <p className="font-serif text-[20px] italic text-muted">
        This page has wandered off.
      </p>
      <Link
        href="/"
        className="border-b border-accent pb-[3px] text-[12px] uppercase tracking-[0.12em]"
      >
        Back home
      </Link>
    </div>
  );
}
