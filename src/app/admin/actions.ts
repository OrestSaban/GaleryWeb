"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { storagePathFromPublicUrl } from "@/lib/utils";
import { slugify } from "@/lib/slug";

type SupabaseServerClient = ReturnType<typeof createClient>;

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return supabase;
}

/**
 * A slug that is free on the UNIQUE index. `slugify` can still return "" (a
 * name made only of punctuation or CJK) and two different names can normalise
 * to the same slug ("Still Life" / "Still-Life"), so suffix until it's free.
 */
async function uniqueSlug(
  supabase: SupabaseServerClient,
  name: string,
  excludeId?: string,
) {
  const base = slugify(name) || "collection";

  const { data } = await supabase
    .from("collections")
    .select("id,slug")
    .like("slug", `${base}%`); // base is [a-z0-9-] only, so no LIKE wildcards to escape

  const taken = new Set(
    (data ?? []).filter((r) => r.id !== excludeId).map((r) => r.slug),
  );

  if (!taken.has(base)) return base;
  for (let i = 2; i < 500; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

function str(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

function revalidateEverything() {
  revalidatePath("/", "layout");
  revalidatePath("/gallery");
  revalidatePath("/admin/paintings");
  revalidatePath("/admin/collections");
}

// --- Paintings --------------------------------------------------------------

export async function createPainting(formData: FormData): Promise<ActionResult> {
  const supabase = await requireUser();

  const title = str(formData.get("title"));
  const image_url = str(formData.get("image_url"));
  const collection_id = str(formData.get("collection_id"));

  if (!title) return { ok: false, error: "Title is required." };
  if (!image_url) return { ok: false, error: "An image is required." };
  if (!collection_id) return { ok: false, error: "Choose a collection." };

  const yearRaw = str(formData.get("year"));
  const year = yearRaw ? Number.parseInt(yearRaw, 10) : null;
  if (yearRaw && Number.isNaN(year)) return { ok: false, error: "Year must be a number." };

  const { error } = await supabase.from("paintings").insert({
    title,
    collection_id,
    medium: str(formData.get("medium")),
    dimensions: str(formData.get("dimensions")),
    year,
    price: str(formData.get("price")),
    image_url,
    is_available: formData.get("is_available") === "on",
    is_visible: formData.get("is_visible") === "on",
    sort_order: Number.parseInt(str(formData.get("sort_order")) ?? "0", 10) || 0,
  });

  if (error) return { ok: false, error: error.message };
  revalidateEverything();
  redirect("/admin/paintings");
}

export async function updatePainting(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await requireUser();

  const title = str(formData.get("title"));
  const collection_id = str(formData.get("collection_id"));
  if (!title) return { ok: false, error: "Title is required." };
  if (!collection_id) return { ok: false, error: "Choose a collection." };

  const yearRaw = str(formData.get("year"));
  const year = yearRaw ? Number.parseInt(yearRaw, 10) : null;
  if (yearRaw && Number.isNaN(year)) return { ok: false, error: "Year must be a number." };

  const nextImage = str(formData.get("image_url"));
  const prevImage = str(formData.get("previous_image_url"));

  const { error } = await supabase
    .from("paintings")
    .update({
      title,
      collection_id,
      medium: str(formData.get("medium")),
      dimensions: str(formData.get("dimensions")),
      year,
      price: str(formData.get("price")),
      ...(nextImage ? { image_url: nextImage } : {}),
      is_available: formData.get("is_available") === "on",
      is_visible: formData.get("is_visible") === "on",
      sort_order: Number.parseInt(str(formData.get("sort_order")) ?? "0", 10) || 0,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  // If the image was replaced, remove the old object from Storage.
  if (nextImage && prevImage && nextImage !== prevImage) {
    const oldPath = storagePathFromPublicUrl(prevImage);
    if (oldPath) await supabase.storage.from("paintings").remove([oldPath]);
  }

  revalidateEverything();
  redirect("/admin/paintings");
}

export async function togglePaintingVisibility(
  id: string,
  nextVisible: boolean,
): Promise<ActionResult> {
  const supabase = await requireUser();
  const { error } = await supabase
    .from("paintings")
    .update({ is_visible: nextVisible })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateEverything();
  return { ok: true };
}

export async function deletePainting(id: string): Promise<ActionResult> {
  const supabase = await requireUser();

  const { data: row } = await supabase
    .from("paintings")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("paintings").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  const path = storagePathFromPublicUrl(row?.image_url ?? null);
  if (path) await supabase.storage.from("paintings").remove([path]);

  revalidateEverything();
  return { ok: true };
}

export async function reorderPainting(
  id: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  const supabase = await requireUser();

  const { data: current } = await supabase
    .from("paintings")
    .select("id,collection_id,sort_order,created_at")
    .eq("id", id)
    .maybeSingle();
  if (!current) return { ok: false, error: "Painting not found." };

  // `collection_id` is nullable (collections are `on delete set null`), and
  // PostgREST renders `eq.null` as `= NULL`, which never matches — use `is`.
  const siblingsQuery = supabase
    .from("paintings")
    .select("id,sort_order,created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const { data: siblings } = await (current.collection_id === null
    ? siblingsQuery.is("collection_id", null)
    : siblingsQuery.eq("collection_id", current.collection_id));

  const ordered = siblings ?? [];
  const idx = ordered.findIndex((p) => p.id === id);
  const targetIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || targetIdx < 0 || targetIdx >= ordered.length) {
    return { ok: true };
  }

  const moved = [...ordered];
  moved.splice(targetIdx, 0, ...moved.splice(idx, 1));

  /*
   * Assign positional indices rather than swapping the two stored values.
   * Every painting is created with sort_order = 0, so a swap would write
   * 0 over 0 and nothing would ever move. Writing indices also repairs any
   * collection whose rows are still all-zero, on the first move.
   */
  const writes = moved
    .map((p, position) => ({ id: p.id, sort_order: position }))
    .filter((w) => {
      const before = ordered.find((p) => p.id === w.id);
      return before?.sort_order !== w.sort_order;
    });

  const results = await Promise.all(
    writes.map((w) =>
      supabase.from("paintings").update({ sort_order: w.sort_order }).eq("id", w.id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { ok: false, error: failed.error.message };

  revalidateEverything();
  return { ok: true };
}

// --- Collections ----------------------------------------------------------

export async function createCollection(name: string): Promise<ActionResult> {
  const supabase = await requireUser();
  const clean = name.trim();
  if (!clean) return { ok: false, error: "Name is required." };

  const { error } = await supabase
    .from("collections")
    .insert({ name: clean, slug: await uniqueSlug(supabase, clean) });
  if (error) return { ok: false, error: error.message };
  revalidateEverything();
  return { ok: true };
}

export async function renameCollection(
  id: string,
  name: string,
): Promise<ActionResult> {
  const supabase = await requireUser();
  const clean = name.trim();
  if (!clean) return { ok: false, error: "Name is required." };

  const { error } = await supabase
    .from("collections")
    .update({ name: clean, slug: await uniqueSlug(supabase, clean, id) })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateEverything();
  return { ok: true };
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  const supabase = await requireUser();

  const { count } = await supabase
    .from("paintings")
    .select("id", { count: "exact", head: true })
    .eq("collection_id", id);

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: `That collection still has ${count} painting${count === 1 ? "" : "s"}. Move or delete them first.`,
    };
  }

  const { error } = await supabase.from("collections").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateEverything();
  return { ok: true };
}

// --- Auth ---------------------------------------------------------------------

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
