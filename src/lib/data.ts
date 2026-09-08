import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { SUPABASE_ENV_MISSING } from "@/lib/supabase/env";
import type { Collection, Painting, PaintingWithCollection } from "@/lib/types";

const PAINTING_SELECT =
  "id,title,collection_id,medium,dimensions,year,price,image_url,is_available,is_visible,sort_order,created_at,collection:collections(id,name,slug)";

/**
 * Public reads degrade to an empty result so a transient Supabase blip renders
 * an empty gallery rather than a 500. Admin reads deliberately do NOT do this:
 * an empty list there is indistinguishable from "nothing exists yet" and would
 * silently break the editor (see `getAdminCollections`).
 */
function softFail<T>(context: string, error: unknown, fallback: T): T {
  console.error(`[data] ${context}:`, error);
  return fallback;
}

// --- Public reads (anonymous, cacheable) ------------------------------------

/** All collections, alphabetical. */
export const getCollections = cache(async (): Promise<Collection[]> => {
  const db = createPublicClient();
  if (!db) return softFail("getCollections", SUPABASE_ENV_MISSING, [] as Collection[]);

  const { data, error } = await db
    .from("collections")
    .select("*")
    .order("name", { ascending: true });
  if (error) return softFail("getCollections", error, [] as Collection[]);
  return data ?? [];
});

/** Visible paintings, in the artist's order. RLS also enforces `is_visible`. */
export const getVisiblePaintings = cache(
  async (): Promise<PaintingWithCollection[]> => {
    const empty = [] as PaintingWithCollection[];
    const db = createPublicClient();
    if (!db) return softFail("getVisiblePaintings", SUPABASE_ENV_MISSING, empty);

    const { data, error } = await db
      .from("paintings")
      .select(PAINTING_SELECT)
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) return softFail("getVisiblePaintings", error, empty);
    return (data ?? []) as unknown as PaintingWithCollection[];
  },
);

/** A single visible painting, or null. Fetches one row, not the whole table. */
export const getVisiblePainting = cache(
  async (id: string): Promise<PaintingWithCollection | null> => {
    const db = createPublicClient();
    if (!db) return softFail("getVisiblePainting", SUPABASE_ENV_MISSING, null);

    const { data, error } = await db
      .from("paintings")
      .select(PAINTING_SELECT)
      .eq("id", id)
      .eq("is_visible", true)
      .maybeSingle();
    if (error) return softFail("getVisiblePainting", error, null);
    return (data as unknown as PaintingWithCollection) ?? null;
  },
);

/**
 * Just enough of the visible works to render prev/next links, in gallery order.
 * Avoids pulling every row (and its join) to place one painting in a sequence.
 */
export const getPaintingNavigation = cache(
  async (): Promise<Array<Pick<Painting, "id" | "title">>> => {
    const db = createPublicClient();
    if (!db) return softFail("getPaintingNavigation", SUPABASE_ENV_MISSING, []);

    const { data, error } = await db
      .from("paintings")
      .select("id,title")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) return softFail("getPaintingNavigation", error, []);
    return data ?? [];
  },
);

/** Featured works for the homepage. */
export async function getFeaturedPaintings(limit = 3): Promise<PaintingWithCollection[]> {
  const all = await getVisiblePaintings();
  return all.slice(0, limit);
}

// --- Admin reads (authenticated; throw so failures surface) -----------------

/**
 * Collections for the admin editor. Unlike `getCollections` this rethrows:
 * returning [] would render an empty collection <select>, which then fails
 * validation with "Choose a collection." and traps the artist on the form.
 */
export async function getAdminCollections(): Promise<Collection[]> {
  const { data, error } = await createClient()
    .from("collections")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getAllPaintings(): Promise<PaintingWithCollection[]> {
  const { data, error } = await createClient()
    .from("paintings")
    .select(PAINTING_SELECT)
    // Group by collection so the ↑/↓ controls, which reorder within a
    // collection, move rows against their actual neighbours.
    .order("collection_id", { ascending: true, nullsFirst: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PaintingWithCollection[];
}

export async function getPainting(id: string): Promise<Painting | null> {
  const { data, error } = await createClient()
    .from("paintings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Painting) ?? null;
}

export async function getCollectionsWithCounts() {
  const supabase = createClient();
  const collections = await getAdminCollections();

  const { data, error } = await supabase.from("paintings").select("collection_id");
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    if (row.collection_id) {
      counts.set(row.collection_id, (counts.get(row.collection_id) ?? 0) + 1);
    }
  }
  return collections.map((c) => ({ ...c, painting_count: counts.get(c.id) ?? 0 }));
}
