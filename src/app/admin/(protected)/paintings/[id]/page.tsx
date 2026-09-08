import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminCollections, getPainting } from "@/lib/data";
import { PaintingForm } from "@/components/admin/PaintingForm";

export const dynamic = "force-dynamic";

export default async function EditPaintingPage({
  params,
}: {
  params: { id: string };
}) {
  const [painting, collections] = await Promise.all([
    getPainting(params.id),
    getAdminCollections(),
  ]);

  if (!painting) notFound();

  return (
    <>
      <Link
        href="/admin/paintings"
        className="mb-4 inline-block text-[11px] uppercase tracking-[0.16em] text-muted"
      >
        ← All paintings
      </Link>
      <PaintingForm collections={collections} painting={painting} />
    </>
  );
}
