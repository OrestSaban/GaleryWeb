"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { createPainting, updatePainting } from "@/app/admin/actions";
import { readImageSize, readImageSizeFromUrl, type ImageSize } from "@/lib/imageSize";
import { FIELD_MAX } from "@/lib/utils";
import type { Collection, Painting } from "@/lib/types";

type Props = {
  collections: Collection[];
  painting?: Painting | null;
};

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export function PaintingForm({ collections, painting }: Props) {
  const isEdit = Boolean(painting);
  const [imageUrl, setImageUrl] = useState<string | null>(painting?.image_url ?? null);
  const [imageSize, setImageSize] = useState<ImageSize | null>(
    painting?.image_width && painting?.image_height
      ? { width: painting.image_width, height: painting.image_height }
      : null,
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  /*
   * Files upload as soon as they're picked, so an upload that never gets saved
   * — replaced before submitting, abandoned after a validation error, or left
   * behind by navigating away — would sit in the bucket forever with nothing
   * referencing it. Track the not-yet-persisted object and clean it up.
   * `savingRef` stops the unmount cleanup from deleting the image we just
   * saved, since a successful action redirects (and so unmounts) this form.
   */
  const pendingPathRef = useRef<string | null>(null);
  const savingRef = useRef(false);

  async function discardPendingUpload() {
    const path = pendingPathRef.current;
    if (!path) return;
    pendingPathRef.current = null;
    await createClient().storage.from("paintings").remove([path]);
  }

  /*
   * Backfill for works saved before dimensions were recorded: read the size
   * off the stored image so opening the editor and hitting save is enough to
   * fill it in. Runs once, only when the row is actually missing them.
   */
  const needsBackfill = Boolean(imageUrl) && imageSize === null;
  useEffect(() => {
    if (!needsBackfill || !imageUrl) return;
    let cancelled = false;
    readImageSizeFromUrl(imageUrl).then((size) => {
      if (!cancelled && size) setImageSize(size);
    });
    return () => {
      cancelled = true;
    };
  }, [needsBackfill, imageUrl]);

  useEffect(() => {
    return () => {
      if (!savingRef.current && pendingPathRef.current) {
        // Fire-and-forget: the component is going away either way.
        void createClient()
          .storage.from("paintings")
          .remove([pendingPathRef.current]);
      }
    };
  }, []);

  async function onPickFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG or PNG).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image is larger than 10 MB.");
      return;
    }

    setUploading(true);

    // Read the natural size before uploading: the gallery needs it to lay the
    // work out at its real proportions instead of cropping it to a fixed frame.
    const size = await readImageSize(file);

    // Drop the previous unsaved upload before replacing it.
    await discardPendingUpload();

    const supabase = createClient();
    const dot = file.name.lastIndexOf(".");
    const ext =
      dot > 0 ? file.name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
    const path = `${crypto.randomUUID()}.${ext || "jpg"}`;

    const { error: upErr } = await supabase.storage
      .from("paintings")
      .upload(path, file, { cacheControl: "31536000", upsert: false });

    if (upErr) {
      setError(`Upload failed: ${upErr.message}`);
      setUploading(false);
      return;
    }

    pendingPathRef.current = path;
    const { data } = supabase.storage.from("paintings").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setImageSize(size);
    setUploading(false);
  }

  function onSubmit(formData: FormData) {
    setError(null);
    if (!imageUrl) {
      setError("An image is required.");
      return;
    }
    formData.set("image_url", imageUrl);
    if (imageSize) {
      formData.set("image_width", String(imageSize.width));
      formData.set("image_height", String(imageSize.height));
    }
    if (painting?.image_url) formData.set("previous_image_url", painting.image_url);

    savingRef.current = true;
    startTransition(async () => {
      const res = isEdit
        ? await updatePainting(painting!.id, formData)
        : await createPainting(formData);
      // On success the action redirects and this component unmounts; we only
      // reach here when it returned a validation/DB error.
      if (res && !res.ok) {
        savingRef.current = false;
        setError(res.error);
      }
    });
  }

  return (
    <form action={onSubmit} className="mx-auto max-w-[640px]">
      <div className="border border-line bg-white p-4">
        <div className="mb-1 text-[13px] font-medium">
          {isEdit ? "Edit painting" : "Add painting"}
        </div>

        {/* Image */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) onPickFile(f);
          }}
          className="relative mt-3.5 flex min-h-[160px] flex-col items-center justify-center gap-1.5 border border-dashed border-line-warm bg-[#FBFAF7] p-4 text-center"
        >
          {imageUrl ? (
            <>
              <div className="relative h-40 w-full max-w-[280px]">
                <Image
                  src={imageUrl}
                  alt="Selected"
                  fill
                  sizes="280px"
                  className="object-contain"
                />
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-1 text-[11px] uppercase tracking-[0.1em] text-blue"
              >
                Replace image
              </button>
            </>
          ) : (
            <>
              <span className="text-[12px] text-muted">
                {uploading ? "Uploading…" : "Drop image or browse"}
              </span>
              <span className="font-mono text-[10px] text-muted">
                JPG / PNG · up to 10 MB
              </span>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-1.5 border border-line px-3 py-1.5 text-[11px] uppercase tracking-[0.1em]"
              >
                Browse
              </button>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              // Clear the input so re-picking the same file after a failed
              // upload still fires a change event.
              e.target.value = "";
              if (f) onPickFile(f);
            }}
          />
        </div>

        {/* Fields */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Title" name="title" required span={2} maxLength={FIELD_MAX.title} defaultValue={painting?.title} placeholder="Swallows, Late April" />

          <label className="block">
            <span className="mb-1.5 block text-[9px] uppercase tracking-[0.18em] text-muted">
              Collection <span className="text-accent-deep">*</span>
            </span>
            <select
              name="collection_id"
              required
              defaultValue={painting?.collection_id ?? ""}
              className="w-full border border-line bg-white px-2.5 py-2 text-[13px] outline-none focus:border-blue"
            >
              <option value="" disabled>
                Choose…
              </option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <Field label="Year" name="year" type="number" defaultValue={painting?.year ?? ""} placeholder="2026" />
          <Field label="Medium" name="medium" maxLength={FIELD_MAX.medium} defaultValue={painting?.medium ?? ""} placeholder="Watercolour on paper" />
          <Field label="Dimensions" name="dimensions" maxLength={FIELD_MAX.dimensions} defaultValue={painting?.dimensions ?? ""} placeholder="40 × 30 cm" />
          <Field label="Price" name="price" span={2} maxLength={FIELD_MAX.price} defaultValue={painting?.price ?? ""} placeholder="€450 · price TBC · not for sale" />
          <Field label="Sort order" name="sort_order" type="number" defaultValue={painting?.sort_order ?? 0} placeholder="0" />

          <label className="col-span-2 block">
            <span className="mb-1.5 block text-[9px] uppercase tracking-[0.18em] text-muted">
              Description
            </span>
            <textarea
              name="description"
              rows={4}
              maxLength={FIELD_MAX.description}
              defaultValue={painting?.description ?? ""}
              placeholder="The story behind this work, materials used, inspiration…"
              className="w-full resize-y border border-line bg-white px-2.5 py-2 text-[13px] outline-none focus:border-blue"
            />
          </label>
        </div>

        {/* Toggles */}
        <div className="mt-4 flex flex-col gap-2.5 border-t border-line pt-3.5">
          <label className="flex items-center justify-between text-[12px] text-ink-soft">
            <span>Available for purchase</span>
            <input
              type="checkbox"
              name="is_available"
              defaultChecked={painting ? painting.is_available : true}
              className="h-4 w-4 accent-[#4E7397]"
            />
          </label>
          <label className="flex items-center justify-between text-[12px] text-ink-soft">
            <span>Visible on public gallery</span>
            <input
              type="checkbox"
              name="is_visible"
              defaultChecked={painting ? painting.is_visible : true}
              className="h-4 w-4 accent-[#4E7397]"
            />
          </label>
        </div>

        {error && (
          <p className="mt-3 text-[12px] text-accent-deep" role="alert">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2.5">
          <button
            type="submit"
            disabled={pending || uploading}
            className="flex-1 bg-ink px-3 py-3 text-[11px] uppercase tracking-[0.12em] text-surface disabled:opacity-60"
          >
            {pending ? "Saving…" : isEdit ? "Save changes" : "Save painting"}
          </button>
          <Link
            href="/admin/paintings"
            className="border border-line bg-white px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-muted"
          >
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  span = 1,
  defaultValue,
  placeholder,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  span?: 1 | 2;
  defaultValue?: string | number | null;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <label className={`block ${span === 2 ? "col-span-2" : ""}`}>
      <span className="mb-1.5 block text-[9px] uppercase tracking-[0.18em] text-muted">
        {label} {required && <span className="text-accent-deep">*</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        maxLength={maxLength}
        defaultValue={defaultValue ?? undefined}
        placeholder={placeholder}
        className="w-full border border-line bg-white px-2.5 py-2 text-[13px] outline-none focus:border-blue"
      />
    </label>
  );
}
