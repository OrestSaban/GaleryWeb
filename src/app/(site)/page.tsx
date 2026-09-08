import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { PaintingCard } from "@/components/PaintingCard";
import { getFeaturedPaintings } from "@/lib/data";
import { SITE } from "@/lib/utils";

export const revalidate = 60;

const ABOUT = `I began with sculpture and art history, and I still love them, though for now I have neither the space nor the materials. My early work was dense and decorative — the kind you can disappear into for an afternoon — and over time it settled into two ways of working: soft watercolours in pastel tones, where I scatter salt into the wash for texture, and geometric pieces with clean lines and never more than three colours. Swallows keep finding their way into both.`;
const ABOUT_2 = `Art school, then college. Ivano-Frankivsk, now Prague. Looking often at Anna Wericky, Arthur Hostovsky, and a little Dalí.`;

export default async function HomePage() {
  const featured = await getFeaturedPaintings(3);

  return (
    <div>
      {/*
        The edge label's containing block deliberately stops before the contact
        strip: a sticky element can only travel within its containing block, so
        ending this wrapper here is what makes the label come to rest above the
        contact section and footer instead of riding over them.
      */}
      <div className="relative">
        {/* Vertical edge name — desktop only */}
        {/* bottom-16 keeps the label from coming to rest flush against the
            contact section's top border — it stops 64px short of it. */}
        <div className="pointer-events-none absolute bottom-16 left-0 top-0 hidden w-[72px] lg:block">
          <div className="sticky top-[420px] h-0">
            {/*
            Rotated -90deg about its top-left corner, so horizontally it takes
            up its line-height (~15px), not its width, starting at `left`.
            At left-9 (36px) it ran to ~51px and collided with content, which
            starts at the 48px page gutter. left-4 leaves a clear channel.
          */}
            <span className="absolute left-4 top-0 block origin-top-left -rotate-90 whitespace-nowrap text-[10px] uppercase tracking-[0.42em] text-[#B6AE9F]">
              Ірина Ізотова — Iryna Izotova
            </span>
          </div>
        </div>

        {/* Hero */}
        <section className="px-6 pb-0 pt-2 sm:px-12">
          <div className="hero-frame relative w-full animate-softIn">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "repeating-linear-gradient(112deg, #EDE9E1 0 9px, #F4F1EA 9px 18px)",
              }}
            />
            {featured[0]?.image_url && (
              <Image
                src={featured[0].image_url}
                alt={featured[0].title}
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1136px"
                className="object-cover"
              />
            )}
          </div>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <h1 className="m-0 max-w-[15ch] font-serif text-[42px] font-normal leading-[1.02] tracking-[-0.01em] sm:text-[74px]">
              {SITE.artist}
            </h1>
            <p className="m-0 max-w-[30ch] font-serif text-[19px] italic leading-[1.35] text-ink-soft sm:text-[24px]">
              Soft watercolours, quiet geometry, and swallows in both.
            </p>
          </div>
        </section>

        {/* Divider */}
        <div className="flex items-center gap-3.5 px-6 py-14 sm:px-12">
          <div className="h-px flex-1 bg-line" />
          <div className="h-1.5 w-1.5 rotate-45 bg-accent" />
          <div className="h-px flex-1 bg-line" />
        </div>

        {/* About */}
        <Reveal
          as="section"
          className="grid items-start gap-8 px-6 pb-24 sm:grid-cols-[0.85fr_1.15fr] sm:gap-16 sm:px-12"
        >
          <div className="relative h-[300px] w-full overflow-hidden sm:h-[420px]">
            <Image
              src="/artist_photo.jpeg"
              alt="Iryna Izotova"
              fill
              className="object-cover object-center"
              sizes="(max-width: 640px) 100vw, 45vw"
            />
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.24em] text-blue">
              About the artist
            </div>
            <p className="mt-[18px] max-w-[46ch] font-serif text-[21px] leading-[1.5] text-ink sm:text-[26px]">
              {ABOUT}
            </p>
            <p className="mt-[22px] max-w-[52ch] text-[13px] leading-[1.75] text-muted">
              {ABOUT_2}
            </p>
          </div>
        </Reveal>

        {/* Featured */}
        <section className="px-6 pb-24 sm:px-12">
          <Reveal className="mb-8 flex items-baseline justify-between gap-4">
            <h2 className="m-0 font-serif text-[28px] font-normal sm:text-[38px]">
              Featured works
            </h2>
            <span className="text-[11px] uppercase tracking-[0.16em] text-muted">
              2024 — 2026
            </span>
          </Reveal>
          {featured.length === 0 ? (
            <p className="font-serif text-[20px] italic text-muted">
              Works will appear here once they&rsquo;re added in the studio.
            </p>
          ) : (
            <div className="grid gap-9 sm:grid-cols-3 sm:gap-10">
              {/* 120ms between neighbours, per interaction spec 02 */}
              {featured.map((p, i) => (
                <Reveal key={p.id} delay={i * 120}>
                  <PaintingCard painting={p} showYear />
                </Reveal>
              ))}
            </div>
          )}

          {featured.length > 0 && (
            <Reveal className="mt-14 flex justify-center">
              <Link
                href="/gallery"
                className="border-b border-accent pb-[3px] text-[12px] uppercase tracking-[0.12em]"
              >
                See all works
              </Link>
            </Reveal>
          )}
        </section>
      </div>

      {/* Contact strip */}
      <Reveal
        as="section"
        className="border-t border-line bg-panel px-6 pb-20 pt-[70px] sm:px-12"
      >
        <div className="grid gap-8 sm:grid-cols-[0.85fr_1.15fr] sm:gap-16">
          <div>
            <h2 className="m-0 mb-3.5 font-serif text-[28px] font-normal sm:text-[38px]">
              Get in touch
            </h2>
            <p className="m-0 max-w-[40ch] text-[13px] leading-[1.8] text-muted">
              If a work catches your eye, feel free to reach out. I am happy to
              share more photos, details, and talk through options together.
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
              Based in Prague. Contact for more information.
            </span>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
