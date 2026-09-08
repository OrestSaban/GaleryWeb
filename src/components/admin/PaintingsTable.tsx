"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  deletePainting,
  reorderPainting,
  togglePaintingVisibility,
} from "@/app/admin/actions";
import type { PaintingWithCollection } from "@/lib/types";

export function PaintingsTable({
  paintings,
}: {
  paintings: PaintingWithCollection[];
}) {
  // Local copy so visibility toggles / deletes feel instant (optimistic).
  const [rows, setRows] = useState(paintings);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Re-sync from the server whenever a revalidate delivers fresh rows.
  const signature = rowsSignature(paintings);
  useEffect(() => {
    setRows(paintings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  function toggle(id: string, current: boolean) {
    setError(null);
    setRows((r) =>
      r.map((p) => (p.id === id ? { ...p, is_visible: !current } : p)),
    );
    startTransition(async () => {
      const res = await togglePaintingVisibility(id, !current);
      if (!res.ok) {
        setError(res.error);
        setRows((r) =>
          r.map((p) => (p.id === id ? { ...p, is_visible: current } : p)),
        );
      }
    });
  }

  function remove(id: string, title: string) {
    if (!window.confirm(`Delete “${title}”? This removes the image too.`)) return;
    setError(null);
    const snapshot = rows;
    setRows((r) => r.filter((p) => p.id !== id));
    startTransition(async () => {
      const res = await deletePainting(id);
      if (!res.ok) {
        setError(res.error);
        setRows(snapshot);
      }
    });
  }

  function move(id: string, direction: "up" | "down") {
    setError(null);
    startTransition(async () => {
      const res = await reorderPainting(id, direction);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div>
      {error && (
        <p className="border-b border-line bg-[#FBF6F3] px-4 py-2.5 text-[12px] text-accent-deep">
          {error}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-[13px]">
          <thead>
            <tr className="text-[9px] uppercase tracking-[0.18em] text-muted">
              <th className="border-b border-line px-4 py-2.5 text-left font-normal">
                Work
              </th>
              <th className="border-b border-line px-3 py-2.5 text-left font-normal">
                Collection
              </th>
              <th className="border-b border-line px-3 py-2.5 text-left font-normal">
                Price
              </th>
              <th className="border-b border-line px-3 py-2.5 text-left font-normal">
                Order
              </th>
              <th className="border-b border-line px-3 py-2.5 text-left font-normal">
                Visible
              </th>
              <th className="border-b border-line px-4 py-2.5 text-right font-normal">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="border-b border-line/60 px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-[26px] w-[34px] flex-none overflow-hidden bg-[#ECE8E0]">
                      {p.image_url && (
                        <Image
                          src={p.image_url}
                          alt=""
                          fill
                          sizes="34px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <div>{p.title}</div>
                      <div className="text-[11px] text-muted">
                        {[p.year, p.dimensions].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="border-b border-line/60 px-3 py-2.5 text-muted">
                  {p.collection?.name ?? "—"}
                </td>
                <td className="border-b border-line/60 px-3 py-2.5">
                  {p.price ?? "—"}
                </td>
                <td className="border-b border-line/60 px-3 py-2.5">
                  <div className="flex gap-1">
                    <button
                      onClick={() => move(p.id, "up")}
                      className="border border-line px-1.5 leading-none text-muted hover:text-ink"
                      title="Move up within collection"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(p.id, "down")}
                      className="border border-line px-1.5 leading-none text-muted hover:text-ink"
                      title="Move down within collection"
                    >
                      ↓
                    </button>
                  </div>
                </td>
                <td className="border-b border-line/60 px-3 py-2.5">
                  <button
                    onClick={() => toggle(p.id, p.is_visible)}
                    className={`border px-2.5 py-[5px] text-[11px] ${
                      p.is_visible
                        ? "border-[#D5E0EA] bg-[#F2F5F8] text-[#4A6C8C]"
                        : "border-[#EBD9CF] bg-[#FBF6F3] text-[#A85B36]"
                    }`}
                  >
                    {p.is_visible ? "Visible" : "Hidden"}
                  </button>
                </td>
                <td className="whitespace-nowrap border-b border-line/60 px-4 py-2.5 text-right">
                  <Link
                    href={`/admin/paintings/${p.id}`}
                    className="text-[12px] text-blue"
                  >
                    Edit
                  </Link>
                  <span className="mx-2 text-line-warm">/</span>
                  <button
                    onClick={() => remove(p.id, p.title)}
                    className="text-[12px] text-accent-deep"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Covers every field the table renders — an earlier version tracked only
 * id/visibility/sort_order, so a revalidation that changed just a title or
 * price would leave the local optimistic copy showing stale text.
 */
function rowsSignature(rows: PaintingWithCollection[]) {
  return rows
    .map((r) =>
      [
        r.id,
        r.is_visible ? 1 : 0,
        r.sort_order,
        r.title,
        r.price ?? "",
        r.year ?? "",
        r.dimensions ?? "",
        r.collection?.name ?? "",
        r.image_url ?? "",
      ].join("\u0000"),
    )
    .join("|");
}
