"use client";

import { useMemo, useState } from "react";
import { PaintingCard } from "./PaintingCard";
import { Reveal } from "./Reveal";
import type { Collection, PaintingWithCollection } from "@/lib/types";

/**
 * Full gallery grid with client-side collection filtering (no page reload).
 * Masonry via CSS multi-column, matching the design canvas.
 */
export function GalleryGrid({
  paintings,
  collections,
}: {
  paintings: PaintingWithCollection[];
  collections: Collection[];
}) {
  const [active, setActive] = useState<string>("all");

  const usedCollectionIds = useMemo(
    () => new Set(paintings.map((p) => p.collection_id)),
    [paintings],
  );
  const filters = [
    { id: "all", name: "All" },
    ...collections.filter((c) => usedCollectionIds.has(c.id)),
  ];

  const shown =
    active === "all"
      ? paintings
      : paintings.filter((p) => p.collection_id === active);

  const countLabel =
    `${shown.length} ${shown.length === 1 ? "work" : "works"}` +
    (active === "all"
      ? " available"
      : ` in ${filters.find((f) => f.id === active)?.name.toLowerCase() ?? ""}`);

  return (
    <div>
      <p className="mt-3.5 font-serif text-[20px] italic text-muted">{countLabel}</p>

      <div className="mt-10 flex items-center justify-between gap-4 border-b border-line pb-5">
        <div
          data-hscroll
          className="-mx-6 flex gap-2.5 overflow-x-auto px-6 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        >
          {filters.map((f) => {
            const on = active === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActive(f.id)}
                aria-pressed={on}
                className={`flex-none rounded-full border px-[18px] py-[9px] text-[12px] uppercase tracking-[0.12em] transition-colors ${
                  on
                    ? "border-accent bg-accent text-[#22201C]"
                    : "border-line-warm bg-transparent text-ink-soft hover:border-muted"
                }`}
              >
                {f.name}
              </button>
            );
          })}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="mt-16 font-serif text-[22px] italic text-muted">
          Nothing here yet.
        </p>
      ) : (
        <div className="mt-11 [column-gap:2.5rem] sm:columns-2 lg:columns-3">
          {shown.map((p, i) => (
            // Stagger across a row (not the whole list) so cards further down
            // don't inherit an ever-growing delay when scrolled into view.
            <Reveal
              key={p.id}
              delay={(i % 3) * 120}
              className="mb-[52px] break-inside-avoid"
            >
              <PaintingCard painting={p} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
