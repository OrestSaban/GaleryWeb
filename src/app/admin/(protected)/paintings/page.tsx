import Link from "next/link";
import { getAllPaintings, getAdminCollections } from "@/lib/data";
import { PaintingsTable } from "@/components/admin/PaintingsTable";

export const dynamic = "force-dynamic";

export default async function AdminPaintingsPage() {
  const [paintings, collections] = await Promise.all([
    getAllPaintings(),
    getAdminCollections(),
  ]);

  const visible = paintings.filter((p) => p.is_visible).length;

  const stats = [
    { k: "Paintings", v: paintings.length },
    { k: "Visible", v: visible },
    { k: "Collections", v: collections.length },
  ];

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="grid grid-cols-3 gap-2.5">
        {stats.map((s) => (
          <div key={s.k} className="border border-line bg-white px-4 py-3.5">
            <div className="text-[9px] uppercase tracking-[0.2em] text-muted">
              {s.k}
            </div>
            <div className="mt-1.5 text-[24px]">{s.v}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 border border-line bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
          <div className="text-[13px] font-medium">Paintings</div>
          <Link
            href="/admin/paintings/new"
            className="bg-ink px-3.5 py-2 text-[11px] uppercase tracking-[0.1em] text-surface"
          >
            + Add painting
          </Link>
        </div>

        {paintings.length === 0 ? (
          <p className="px-4 py-10 text-[13px] text-muted">
            No paintings yet.{" "}
            <Link href="/admin/paintings/new" className="text-blue">
              Add the first one →
            </Link>
          </p>
        ) : (
          <PaintingsTable paintings={paintings} />
        )}
      </div>
    </div>
  );
}
