import Link from "next/link";
import { getAdminCollections } from "@/lib/data";
import { PaintingForm } from "@/components/admin/PaintingForm";

export const dynamic = "force-dynamic";

export default async function NewPaintingPage() {
  const collections = await getAdminCollections();

  if (collections.length === 0) {
    return (
      <div className="mx-auto max-w-[640px] border border-line bg-white p-6 text-[13px] text-muted">
        Create a collection first —{" "}
        <Link href="/admin/collections" className="text-blue">
          Manage collections →
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link
        href="/admin/paintings"
        className="mb-4 inline-block text-[11px] uppercase tracking-[0.16em] text-muted"
      >
        ← All paintings
      </Link>
      <PaintingForm collections={collections} />
    </>
  );
}
