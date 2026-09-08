import type { Metadata } from "next";
import { SITE } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Iryna Izotova directly about a work or a studio visit.",
};

export default function ContactPage() {
  return (
    <div className="px-6 pb-24 pt-5 sm:px-12">
      <h1 className="m-0 font-serif text-[42px] font-normal leading-none sm:text-[74px]">
        Get in touch
      </h1>
      <p className="mt-3.5 max-w-[34ch] font-serif text-[20px] italic text-muted">
        No forms, no middlemen — write to me directly.
      </p>

      <div className="mt-14 grid gap-8 sm:grid-cols-[0.85fr_1.15fr] sm:gap-16">
        <div>
          <p className="m-0 max-w-[40ch] text-[13px] leading-[1.8] text-muted">
            If a work catches your eye, feel free to reach out. I&rsquo;m happy to
            share more photos, dimensions, and framing options, and to talk
            through shipping.
          </p>
        </div>

        <div className="flex flex-col gap-3.5 text-[14px]">
          <a
            href={`mailto:${SITE.email}`}
            className="border-b border-line pb-3 text-ink"
          >
            {SITE.email}
          </a>
          <a
            href={SITE.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="border-b border-line pb-3 text-ink"
          >
            Instagram — {SITE.instagramHandle}
          </a>
          <span className="text-[12px] tracking-[0.04em] text-muted">
            {SITE.origin}
          </span>
        </div>
      </div>
    </div>
  );
}
