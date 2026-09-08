/**
 * Ukrainian/Russian Cyrillic → Latin, following the Ukrainian national
 * transliteration for the letters the two alphabets disagree on (г → h).
 */
const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie",
  ж: "zh", з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l",
  м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "",
  ю: "iu", я: "ia",
  // Russian-only letters, in case a title uses them
  ы: "y", э: "e", ъ: "", ё: "e",
};

/**
 * URL slug for a collection name.
 *
 * Cyrillic is transliterated and Latin diacritics are folded (via NFD) rather
 * than stripped, so "Ілюстрації" becomes "iliustratsii" instead of "" — an
 * empty slug collides with every other non-Latin name on the UNIQUE index.
 * Can still return "" for input that is entirely punctuation or CJK; callers
 * must handle that (see `uniqueSlug`).
 */
export function slugify(input: string): string {
  const transliterated = Array.from(input.toLowerCase().trim())
    .map((ch) => CYRILLIC[ch] ?? ch)
    .join("");

  return transliterated
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining accents: é → e
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
