import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FadeInImage } from "@/components/FadeInImage";
import { getPaintingNavigation, getVisiblePainting } from "@/lib/data";
import { SITE, mailtoPainting } from "@/lib/utils";
import { aspectRatio } from "@/lib/imageSize";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const p = await getVisiblePainting(params.id);
  if (!p) return { title: "Work not found" };
  return {
    title: p.title,
    description: [p.medium, p.dimensions, p.year].filter(Boolean).join(" · "),
    openGraph: { images: p.image_url ? [{ url: p.image_url }] : [] },
  };
}

export default async function PaintingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // `getVisiblePainting` is React-cached, so the call in generateMetadata above
  // and this one share a single query.
  const [painting, navigation] = await Promise.all([
    getVisiblePainting(params.id),
    getPaintingNavigation(),
  ]);
  if (!painting) notFound();

  const ratio = aspectRatio(painting.image_width, painting.image_height);

  const index = navigation.findIndex((p) => p.id === painting.id);
  const prev =
    index === -1
      ? null
      : navigation[(index - 1 + navigation.length) % navigation.length];
  const next =
    index === -1 ? null : navigation[(index + 1) % navigation.length];

  const specs = [
    painting.year ? { k: "Year", v: String(painting.year) } : null,
    painting.medium ? { k: "Medium", v: painting.medium } : null,
    painting.dimensions ? { k: "Dimensions", v: painting.dimensions } : null,
    painting.collection
      ? { k: "Collection", v: painting.collection.name }
      : null,
  ].filter(Boolean) as { k: string; v: string }[];

  return (
    <div className="px-6 pb-24 pt-2 sm:px-12">
      <Link
        href="/gallery"
        className="text-[11px] uppercase tracking-[0.16em] text-muted"
      >
        ← Back to works
      </Link>

      <div className="mt-7 grid items-start gap-8 sm:grid-cols-[1.35fr_1fr] sm:gap-16">
        {/*
          The frame matches the work's own proportions, so nothing is cropped
          and nothing is letterboxed. `max-width` caps the *width* — not the
          height — at whatever keeps a tall work inside 80vh, which preserves
          the ratio instead of squashing it back into a fixed box.
        */}
        <div
          className="mx-auto w-full"
          style={ratio ? { maxWidth: `calc(80vh * ${ratio})` } : undefined}
        >
          <div
            className={`relative w-full ${ratio ? "" : "aspect-[4/5]"}`}
            style={ratio ? { aspectRatio: String(ratio) } : undefined}
          >
            {painting.image_url ? (
              <FadeInImage
                src={painting.image_url}
                alt={painting.title}
                fit={ratio ? "cover" : "contain"}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 640px"
              />
            ) : (
              <div
                className="h-full w-full"
                style={{
                  background:
                    "repeating-linear-gradient(112deg, #EDE9E1 0 9px, #F4F1EA 9px 18px)",
                }}
              />
            )}
          </div>
        </div>

        {/*
          `min-w-0` overrides a grid item's automatic min-content floor. Without
          it a single long unbroken value — a pasted medium, say — widens this
          column past its 1fr share and squeezes the image next to it.
        */}
        <div className="min-w-0">
          <h1 className="m-0 break-words font-serif text-[32px] font-normal leading-[1.08] sm:text-[46px]">
            {painting.title}
          </h1>
          {painting.collection && (
            <div className="mt-3 break-words text-[11px] uppercase tracking-[0.18em] text-accent-deep">
              {painting.collection.name}
            </div>
          )}

          <div className="my-[30px] flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <div className="h-[5px] w-[5px] rotate-45 bg-blue" />
            <div className="h-px flex-1 bg-line" />
          </div>

          {/*
            `whitespace-pre-line` keeps the blank lines the artist typed: this
            is a story field, and without it every paragraph runs together.
          */}
          {painting.description && (
            <p className="mb-[30px] whitespace-pre-line break-words text-[14px] leading-[1.8] text-ink-soft">
              {painting.description}
            </p>
          )}

          {specs.length > 0 && (
            <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-[22px]">
              {specs.map((s) => (
                <div key={s.k} className="min-w-0">
                  <dt className="text-[9px] uppercase tracking-[0.22em] text-muted">
                    {s.k}
                  </dt>
                  <dd className="m-0 mt-[7px] break-words text-[14px] text-ink">
                    {s.v}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-[34px] border-t border-line pt-[26px]">
            <div className="font-serif text-[30px]">
              {painting.price ?? "Price on request"}
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[11px] tracking-[0.06em] text-muted">
              <span
                aria-hidden
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  painting.is_available ? "bg-accent" : "bg-line-warm"
                }`}
              />
              {painting.is_available
                ? "Available — unframed, on paper. Shipping quoted separately."
                : "Not available."}
            </div>
          </div>

          <div className="mt-[34px] flex flex-wrap gap-3">
            <a
              href={mailtoPainting(painting.title)}
              className="bg-accent px-[26px] py-[15px] text-[12px] uppercase tracking-[0.14em] text-[#22201C]"
            >
              Interested? Contact me
            </a>
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="border border-line-warm px-[26px] py-[15px] text-[12px] uppercase tracking-[0.14em] text-ink-soft"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>

      {prev && next && navigation.length > 1 && (
        <div className="mt-20 flex justify-between gap-5 border-t border-line pt-[26px]">
          <Link href={`/gallery/${prev.id}`} className="text-ink-soft">
            <span className="block text-[9px] uppercase tracking-[0.22em] text-muted">
              Previous
            </span>
            <span className="mt-1.5 block font-serif text-[20px]">
              {prev.title}
            </span>
          </Link>
          <Link
            href={`/gallery/${next.id}`}
            className="text-right text-ink-soft"
          >
            <span className="block text-[9px] uppercase tracking-[0.22em] text-muted">
              Next
            </span>
            <span className="mt-1.5 block font-serif text-[20px]">
              {next.title}
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
