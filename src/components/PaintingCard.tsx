import Link from "next/link";
import { FadeInImage } from "./FadeInImage";
import { aspectRatio } from "@/lib/imageSize";
import type { PaintingWithCollection } from "@/lib/types";

/**
 * Gallery / featured card: image, title, collection, price, availability dot.
 * Hover lifts the card 6px with a soft shadow (see globals + group classes).
 */
export function PaintingCard({
  painting,
  showYear = false,
}: {
  painting: PaintingWithCollection;
  showYear?: boolean;
}) {
  const { id, title, price, image_url, is_available, year, collection } =
    painting;
  const ratio = aspectRatio(painting.image_width, painting.image_height);

  return (
    <Link
      href={`/gallery/${id}`}
      className="group block transition-transform duration-[420ms] ease-[cubic-bezier(.2,.7,.3,1)] hover:-translate-y-1.5"
    >
      {/*
        The frame takes the work's own proportions, so a landscape piece stays
        landscape instead of being cropped into a portrait box — which is also
        what gives the column layout its real masonry rhythm. Rows saved before
        dimensions were recorded fall back to the old fixed frame, and use
        `contain` so nothing gets cut off there either.
      */}
      <div
        data-flower-target
        style={ratio ? { aspectRatio: String(ratio) } : undefined}
        className={`relative w-full overflow-hidden shadow-[0_2px_8px_-4px_rgba(30,28,25,0.18)] transition-shadow duration-[420ms] group-hover:shadow-[0_24px_44px_-26px_rgba(30,28,25,0.4)] ${
          ratio ? "" : "aspect-[4/5]"
        }`}
      >
        {image_url ? (
          <FadeInImage
            src={image_url}
            alt={title}
            fill
            fit={ratio ? "cover" : "contain"}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.1em] text-faint"
            style={{
              background:
                "repeating-linear-gradient(112deg, #EDE9E1 0 9px, #F4F1EA 9px 18px)",
            }}
          >
            No image
          </span>
        )}
      </div>

      <div className="mt-3.5 flex justify-between gap-3">
        <div className="min-w-0">
          <div className="font-serif text-[19px] leading-tight text-ink">
            {title}
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-blue">
            <span className="truncate">
              {collection?.name ?? "Uncategorised"}
              {showYear && year ? ` · ${year}` : ""}
            </span>
            {!is_available && (
              <span className="whitespace-nowrap text-muted">— sold</span>
            )}
          </div>
        </div>
        <div className="flex items-start gap-2 whitespace-nowrap text-[13px] text-ink-soft">
          <span
            aria-hidden
            className={`mt-1.5 inline-block h-1.5 w-1.5 rounded-full ${
              is_available ? "bg-accent" : "bg-line-warm"
            }`}
          />
          {price ?? "—"}
        </div>
      </div>
    </Link>
  );
}
