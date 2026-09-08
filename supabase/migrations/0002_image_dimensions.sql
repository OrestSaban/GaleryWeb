-- ============================================================================
-- Store the pixel dimensions of each uploaded image.
--
-- Without them the site has to guess an aspect ratio, which meant forcing every
-- work into one fixed frame: landscape pieces were cropped in the gallery grid
-- and letterboxed on their detail page. With real dimensions the grid becomes
-- true masonry and the detail view matches the work exactly.
--
-- Nullable on purpose — rows uploaded before this migration have no dimensions
-- and fall back to the old fixed frame until they're re-saved in the admin.
--
-- Run in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- ============================================================================

alter table public.paintings
  add column if not exists image_width  integer,
  add column if not exists image_height integer;

comment on column public.paintings.image_width  is 'Natural pixel width of image_url, captured at upload.';
comment on column public.paintings.image_height is 'Natural pixel height of image_url, captured at upload.';
