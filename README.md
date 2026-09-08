# Iryna Izotova — online gallery

A small full-stack gallery site for a single visual artist. Visitors browse
works, see prices and availability, and contact the artist directly — there is
no cart, checkout or payment. The artist manages everything from a
password-protected admin area.

- **Next.js 14** (App Router, TypeScript, `next/image`, `next/font`)
- **Supabase** — PostgreSQL, Storage, Auth (admin only)
- **Tailwind CSS**
- Deploy: **Vercel** (frontend) + **Supabase free tier** (data / storage / auth)

---

## 1. Local setup

```bash
npm install
cp .env.example .env.local     # then fill in the values from step 2
npm run dev                     # http://localhost:3000
```

Public routes:

| Route             | Purpose                                    |
| ----------------- | ------------------------------------------ |
| `/`               | Home — hero, about, featured works         |
| `/gallery`        | Full grid with client-side collection filter |
| `/gallery/[id]`   | Single painting, full metadata + contact CTA |
| `/contact`        | Email + socials (no form)                  |

Admin routes (require a Supabase auth session — enforced in `middleware.ts`):

| Route                    | Purpose                                   |
| ------------------------ | ----------------------------------------- |
| `/admin`                 | Redirects to `/admin/paintings`           |
| `/admin/login`           | Email + password sign-in                  |
| `/admin/paintings`       | List, reorder, toggle visibility, delete  |
| `/admin/paintings/new`   | Upload image + metadata                   |
| `/admin/paintings/[id]`  | Edit an existing painting                 |
| `/admin/collections`     | Create / rename / delete collections      |

---

## 2. Supabase setup

### 2.1 Create the project

1. Go to <https://supabase.com/dashboard> → **New project** (free tier is fine).
2. Once it's ready, open **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys → `anon` / `public`** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Put both into `.env.local` (local) and into Vercel (step 3).

### 2.2 Run the migration

1. In the dashboard: **SQL Editor → New query**.
2. Paste the entire contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and click **Run**.

This creates:

- `collections` and `paintings` tables (exact schema from the brief)
- **Row Level Security**
  - anonymous visitors can read collections and **only** `is_visible = true` paintings
  - authenticated users (the admin) can read/write everything
- the **`paintings` Storage bucket** (public read, authenticated write) with matching policies
- two seed collections — `Illustrations` and `Geometry` (edit or delete freely)

The script is idempotent — safe to run again after edits.

### 2.3 Create the admin account

There is no public sign-up. Create the single admin user by hand:

1. Dashboard → **Authentication → Users → Add user → Create new user**.
2. Enter the artist's email + a strong password.
3. Tick **Auto Confirm User** (so no confirmation email is needed).
4. Click **Create user**.

That's it — sign in at `/admin/login` with those credentials.

> To disable sign-ups entirely: **Authentication → Providers → Email** and turn
> **Allow new users to sign up** off. The app never calls `signUp`, but this
> closes the door at the API level too.

To add more admins later, repeat step 2.3 — every authenticated user has full
admin access by design.

---

## 3. Deploy to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. <https://vercel.com/new> → **Import** the repo. Framework preset: **Next.js**
   (auto-detected). No build-command changes needed.
3. **Environment Variables** — add for *Production* **and** *Preview*:

   | Name                             | Value                                   |
   | -------------------------------- | --------------------------------------- |
   | `NEXT_PUBLIC_SUPABASE_URL`       | your Supabase Project URL               |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | your Supabase `anon` public key         |
   | `NEXT_PUBLIC_SITE_URL`           | `https://<your-project>.vercel.app`     |

4. **Deploy.** After the first deploy, if you set a custom domain, update
   `NEXT_PUBLIC_SITE_URL` to match and redeploy.

`next.config.mjs` already whitelists `*.supabase.co` for `next/image`, so
Storage images load with no further config.

### Supabase side, once the domain is known

- **Authentication → URL Configuration → Site URL**: set to your production URL.
- Add `https://<your-project>.vercel.app/**` (and any custom domain) to
  **Redirect URLs**. This keeps auth cookies working in production.

---

## 4. How things fit together

```
src/
  middleware.ts          refreshes the session, guards /admin  (must live in src/)
  app/
    (site)/              public site (own layout: header, footer, paper frame)
      page.tsx           home
      gallery/…          grid + detail
      contact/…
    admin/
      layout.tsx         bare shell (noindex) — shared with the login page
      actions.ts         all mutations — "use server", re-check auth, revalidate
      login/…            client sign-in via supabase-js  (outside the guard)
      (protected)/       route group; its layout redirects unless signed in
        paintings/…      list (optimistic), new, edit
        collections/…    CRUD (optimistic, warns if paintings exist)
  components/            SiteHeader, PaintingCard, GalleryGrid, admin/*
  lib/
    supabase/            client.ts (browser) · server.ts (cookies, admin)
                         public.ts (anon, cookie-less) · middleware.ts
    data.ts              typed read helpers — public (cached) vs admin (throws)
    slug.ts              transliterating slugify (Cyrillic → Latin)
    utils.ts             site constants + storage-path helper
supabase/migrations/     0001_init.sql
```

**Auth is guarded twice, on purpose.** `middleware.ts` redirects unauthenticated
`/admin/*` requests, and `(protected)/layout.tsx` independently redirects if
there is no session. Middleware alone is too fragile a single point of failure:
it silently stops running if the file leaves `src/`, and it short-circuits when
the Supabase env vars are missing (easy to do for Vercel's Preview environment).

**Public vs admin reads.** Public pages read through a cookie-less anon client
(`lib/supabase/public.ts`) so they stay statically cached — reading cookies
would force dynamic rendering and put a live query on every visitor request.
Admin pages use the cookie-based client and let errors throw, since silently
returning an empty list there would look like "nothing exists yet".

**Image upload flow:** the admin form uploads the file straight to the
`paintings` Storage bucket from the browser (authenticated), gets the public
URL back, then a Server Action writes the `paintings` row. Deleting or
replacing a painting also removes the old object from Storage.

**Reordering:** each painting has `sort_order`; the admin list has ↑/↓ controls
that swap order within a collection. Public queries sort by `sort_order` then
`created_at`.

---

## 5. Common tasks

| Task | Where |
| ---- | ----- |
| Change artist name / email / socials | `src/lib/utils.ts` (`SITE`) |
| Edit the About copy | `src/app/(site)/page.tsx` |
| Adjust colours / fonts | `tailwind.config.ts`, `src/app/fonts.ts` |
| Add a collection | `/admin/collections` |
| Hide a work without deleting | toggle **Visible** in `/admin/paintings` |

## 6. Scripts

```bash
npm run dev     # local dev server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```
