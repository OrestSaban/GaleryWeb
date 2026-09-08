-- ============================================================================
-- Iryna Izotova — online gallery
-- Initial schema, Row Level Security, and Storage bucket
--
-- Run this in the Supabase dashboard:  SQL Editor → New query → paste → Run
-- (or `supabase db push` if you use the Supabase CLI).
-- ============================================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

create table if not exists public.collections (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.paintings (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  collection_id uuid references public.collections (id) on delete set null,
  medium        text,
  dimensions    text,
  year          integer,
  price         text,                       -- free-form string, the artist sets the format ("€450", "price TBC", "not for sale")
  image_url     text,                       -- Supabase Storage public URL
  is_available  boolean not null default true,
  is_visible    boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists paintings_collection_id_idx on public.paintings (collection_id);
create index if not exists paintings_visible_idx        on public.paintings (is_visible);
create index if not exists paintings_sort_idx           on public.paintings (collection_id, sort_order);

-- ----------------------------------------------------------------------------
-- Row Level Security
--   public (anon)      → read visible paintings + all collections
--   authenticated user → full read/write on everything (this is the admin)
-- ----------------------------------------------------------------------------

alter table public.collections enable row level security;
alter table public.paintings   enable row level security;

-- collections ---------------------------------------------------------------
drop policy if exists "collections public read"      on public.collections;
drop policy if exists "collections auth read"        on public.collections;
drop policy if exists "collections auth insert"      on public.collections;
drop policy if exists "collections auth update"      on public.collections;
drop policy if exists "collections auth delete"      on public.collections;

create policy "collections public read"
  on public.collections for select
  to anon
  using (true);

create policy "collections auth read"
  on public.collections for select
  to authenticated
  using (true);

create policy "collections auth insert"
  on public.collections for insert
  to authenticated
  with check (true);

create policy "collections auth update"
  on public.collections for update
  to authenticated
  using (true)
  with check (true);

create policy "collections auth delete"
  on public.collections for delete
  to authenticated
  using (true);

-- paintings ---------------------------------------------------------------
drop policy if exists "paintings public read visible" on public.paintings;
drop policy if exists "paintings auth read"           on public.paintings;
drop policy if exists "paintings auth insert"         on public.paintings;
drop policy if exists "paintings auth update"         on public.paintings;
drop policy if exists "paintings auth delete"         on public.paintings;

create policy "paintings public read visible"
  on public.paintings for select
  to anon
  using (is_visible = true);

create policy "paintings auth read"
  on public.paintings for select
  to authenticated
  using (true);

create policy "paintings auth insert"
  on public.paintings for insert
  to authenticated
  with check (true);

create policy "paintings auth update"
  on public.paintings for update
  to authenticated
  using (true)
  with check (true);

create policy "paintings auth delete"
  on public.paintings for delete
  to authenticated
  using (true);

-- ----------------------------------------------------------------------------
-- Storage bucket  "paintings"
--   public read, authenticated write / update / delete
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('paintings', 'paintings', true)
on conflict (id) do update set public = true;

drop policy if exists "paintings storage public read"   on storage.objects;
drop policy if exists "paintings storage auth insert"    on storage.objects;
drop policy if exists "paintings storage auth update"    on storage.objects;
drop policy if exists "paintings storage auth delete"    on storage.objects;

create policy "paintings storage public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'paintings');

create policy "paintings storage auth insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'paintings');

create policy "paintings storage auth update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'paintings')
  with check (bucket_id = 'paintings');

create policy "paintings storage auth delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'paintings');

-- ----------------------------------------------------------------------------
-- Seed collections (matches the design mockups). Safe to edit or remove.
-- ----------------------------------------------------------------------------

insert into public.collections (name, slug) values
  ('Illustrations', 'illustrations'),
  ('Geometry',      'geometry')
on conflict (slug) do nothing;
