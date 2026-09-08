export const SITE = {
  artist: "Iryna Izotova",
  location: "Prague",
  strapline: "Prague · Watercolour & Geometry",
  email: "studio@irynaizotova.com",
  instagramHandle: "@irynkaa_i",
  instagramUrl: "https://instagram.com/irynkaa_i",
  origin: "Ivano-Frankivsk → Prague",
};

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Derives the object path inside the "paintings" bucket from a public URL, so
 * a deleted/replaced painting's image can be removed from Storage.
 * e.g. https://x.supabase.co/storage/v1/object/public/paintings/abc/def.jpg → "abc/def.jpg"
 */
export function storagePathFromPublicUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = "/storage/v1/object/public/paintings/";
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length).split("?")[0]) || null;
}

export function mailtoPainting(title: string) {
  const subject = encodeURIComponent(`Enquiry — "${title}"`);
  const body = encodeURIComponent(
    `Hello Iryna,\n\nI'm interested in "${title}". Could you tell me more about availability and shipping?\n\nThank you,`,
  );
  return `mailto:${SITE.email}?subject=${subject}&body=${body}`;
}
