# Iryna Izotova — online gallery

Online gallery for a single visual artist. Visitors browse works, see prices and
availability, and contact the artist directly — no cart, checkout or payments.
The artist manages everything from a password-protected admin area.

Next.js 14 (App Router, TypeScript) · Supabase (Postgres, Storage, Auth) ·
Tailwind · deployed on Vercel.

```bash
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

Needs `.env.local` — see `.env.example`. Schema and RLS policies live in
`supabase/migrations/0001_init.sql`; run it in the Supabase SQL editor if you
ever rebuild the database. Admin users are created by hand in the Supabase
dashboard (Authentication → Users), never through the app.

## Routes

| Public | |
| --- | --- |
| `/` | Hero, about, featured works |
| `/gallery` | Grid with client-side collection filter |
| `/gallery/[id]` | Single work, full metadata, contact CTA |
| `/contact` | Email and socials |

| Admin — requires a session | |
| --- | --- |
| `/admin/login` | Email + password |
| `/admin/paintings` | List, reorder, toggle visibility, delete |
| `/admin/paintings/new`, `/admin/paintings/[id]` | Upload / edit |
| `/admin/collections` | Create, rename, delete |

## Layout

```
src/
  middleware.ts          session refresh + /admin guard  (must stay in src/)
  app/
    (site)/              public pages — header, footer, paper frame
    admin/
      layout.tsx         bare shell, shared with the login page
      actions.ts         all mutations: "use server", re-check auth, revalidate
      login/             outside the guard
      (protected)/       route group whose layout redirects unless signed in
  components/            SiteHeader, PaintingCard, GalleryGrid, CursorFlower, admin/*
  lib/
    supabase/            client.ts (browser) · server.ts (cookies, admin)
                         public.ts (anon, cookie-less) · env.ts · middleware.ts
    data.ts              read helpers — public (cached) vs admin (throws)
    slug.ts              transliterating slugify (Cyrillic → Latin)
    utils.ts             SITE constants + storage-path helper
```

## Things that look odd but aren't

**Auth is guarded twice.** `middleware.ts` redirects unauthenticated `/admin/*`,
and `(protected)/layout.tsx` independently redirects when there's no session.
Middleware alone is too fragile a single point of failure: it silently stops
running if the file leaves `src/`, and it short-circuits when the Supabase env
vars are missing — easy to do for Vercel's Preview environment.

**Public pages use a separate, cookie-less Supabase client.** Reading cookies
opts a route into dynamic rendering, which silently made `export const
revalidate` a no-op and put a live query on every visitor request. Public reads
go through `lib/supabase/public.ts` so the pages stay statically cached;
`revalidatePath` in the admin actions purges them on edit.

**Public reads fall back to empty, admin reads throw.** An empty gallery during
a Supabase blip beats a 500. In the admin an empty list is indistinguishable
from "nothing exists yet" and would trap the artist on a form that won't save.

**Reordering assigns positional indices, never swaps `sort_order`.** Every row
is created with `sort_order = 0`, so swapping two values would write 0 over 0
and nothing would move.

**Any catch-all around a Next server call must re-throw** errors whose `digest`
is `DYNAMIC_SERVER_USAGE`, `NEXT_REDIRECT` or `NEXT_NOT_FOUND` — those are
framework control flow, not failures.

## Where to change things

| | |
| --- | --- |
| Name, email, Instagram, city | `src/lib/utils.ts` → `SITE` |
| About copy | `src/app/(site)/page.tsx` → `ABOUT`, `ABOUT_2` |
| Colours, fonts | `tailwind.config.ts`, `src/app/fonts.ts` |
| Hero height, flower cursor, scroll reveals | `src/app/globals.css` |

Images upload straight from the browser to the `paintings` Storage bucket, then
a server action writes the row. Replacing or deleting a work also removes the
old object, and uploads abandoned before saving are cleaned up on unmount.

## Not built yet

- The hero image is just the first work in the gallery — it can't be chosen separately
- The portrait in the About block is a placeholder; there's no way to upload one
- `/gallery/[id]` fits works into a 4:5 frame, so landscape pieces show letterboxed.
  Sizing them to their real proportions needs image dimensions captured at upload
