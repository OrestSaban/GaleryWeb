export type ImageSize = { width: number; height: number };

/** Natural pixel size of a picked file, before it goes to Storage. */
export async function readImageSize(file: File): Promise<ImageSize | null> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      const size = { width: bitmap.width, height: bitmap.height };
      bitmap.close?.();
      if (size.width > 0 && size.height > 0) return size;
    } catch {
      // Fall through to the <img> path below.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await sizeFromUrl(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Natural size of an already-uploaded image. Used to backfill rows saved
 * before dimensions were recorded — opening one in the editor and saving is
 * enough to fill them in.
 */
export function readImageSizeFromUrl(url: string): Promise<ImageSize | null> {
  return sizeFromUrl(url);
}

function sizeFromUrl(url: string): Promise<ImageSize | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () =>
      resolve(
        img.naturalWidth > 0 && img.naturalHeight > 0
          ? { width: img.naturalWidth, height: img.naturalHeight }
          : null,
      );
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * `width / height` for CSS `aspect-ratio`, or null when unknown.
 * Guards against absurd values so one bad row can't produce a 10,000px tall card.
 */
export function aspectRatio(
  width: number | null | undefined,
  height: number | null | undefined,
): number | null {
  if (!width || !height || width <= 0 || height <= 0) return null;
  const ratio = width / height;
  if (!Number.isFinite(ratio)) return null;
  return Math.min(Math.max(ratio, 0.3), 3.5);
}
