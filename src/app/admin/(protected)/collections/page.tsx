import { getCollectionsWithCounts } from "@/lib/data";
import { CollectionsManager } from "@/components/admin/CollectionsManager";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage() {
  const collections = await getCollectionsWithCounts();

  return (
    <div className="mx-auto max-w-[560px]">
      <h1 className="mb-4 font-serif text-[24px]">Collections</h1>
      <CollectionsManager collections={collections} />
    </div>
  );
}
