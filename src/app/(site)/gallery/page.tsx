import type { Metadata } from "next";
import { GalleryGrid } from "@/components/GalleryGrid";
import { getCollections, getVisiblePaintings } from "@/lib/data";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Works",
  description: "The full collection of available works by Iryna Izotova.",
};

export default async function GalleryPage() {
  const [paintings, collections] = await Promise.all([
    getVisiblePaintings(),
    getCollections(),
  ]);

  return (
    <div className="px-6 pb-24 pt-5 sm:px-12">
      <h1 className="m-0 font-serif text-[42px] font-normal leading-none sm:text-[74px]">
        Works
      </h1>
      <GalleryGrid paintings={paintings} collections={collections} />
    </div>
  );
}
