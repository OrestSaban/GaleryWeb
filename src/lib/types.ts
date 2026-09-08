export type Collection = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type Painting = {
  id: string;
  title: string;
  collection_id: string | null;
  medium: string | null;
  dimensions: string | null;
  year: number | null;
  price: string | null;
  image_url: string | null;
  is_available: boolean;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
};

export type PaintingWithCollection = Painting & {
  collection: Pick<Collection, "id" | "name" | "slug"> | null;
};

export type CollectionWithCount = Collection & { painting_count: number };
