# BD Market — Bangladesh Fashion & Lifestyle eCommerce Platform

A complete, production-ready online store built for the Bangladesh market. Full storefront, full admin
dashboard, WordPress/WooCommerce-style CMS, and SEO out of the box.

**Stack:** Next.js 14 (App Router) · React 18 · Prisma + SQLite · Tailwind CSS · TypeScript · JWT auth

---

## Quick start

> New here? **[SETUP.md](./SETUP.md)** is the step-by-step setup guide, including the automated
> installer and a troubleshooting table.

```bash
npm install          # install dependencies
npm run db:push      # create the SQLite database from the schema
npm run db:seed      # load the full demo catalogue + settings
npm run dev          # start at http://localhost:3000
```

Or let the installer do the database, config and admin account in one pass:

```bash
npm run setup
```

Then open **http://localhost:3000/admin** and sign in.

### Demo accounts

| Role     | Email                        | Password     | Access                          |
| -------- | ---------------------------- | ------------ | ------------------------------- |
| Admin    | `admin@bdmarket.com.bd`      | `admin123`   | Everything                      |
| Manager  | `manager@bdmarket.com.bd`    | `staff123`   | Orders, catalogue, settings     |
| Editor   | `editor@bdmarket.com.bd`     | `editor123`  | Products & content only         |
| Customer | `rahim@example.com`          | `customer123`| Storefront account              |

---

## What's included

### Storefront (`app/(store)`)

| Page | Route | Notes |
| --- | --- | --- |
| Home | `/` | Hero slider, category strip, promo tiles, featured / new / bestseller rails, brands, blog |
| Shop | `/shop` | Category, brand, price, size, sale & stock filters · sorting · pagination |
| Product | `/product/[slug]` | Gallery, size/colour variants, spec table, rating breakdown, reviews, related items |
| Category | `/category/[slug]` | Hero, sub-category strip, SEO copy block |
| Brands | `/brands`, `/brand/[slug]` | Brand directory and per-brand catalogue |
| Blog | `/blog`, `/blog/[slug]` | Editorial content with reading time |
| CMS pages | `/pages/[slug]` | About, Contact, Terms, Privacy, Return Policy, Track Order |
| Search | `/search` | Records queries for the admin "top searches" report |
| Cart | `/cart` | Live quantity updates, coupon field, free-shipping progress bar |
| Checkout | `/checkout` | 2-step flow, BD phone validation, division→district cascade |
| Order status | `/order/[orderNumber]` | Public order tracking with a status timeline |
| Account | `/account`, `/account/orders`, `/account/wishlist`, `/account/profile` | Customer dashboard |
| Auth | `/login`, `/register` | Separate from admin auth |

### Admin dashboard (`/admin`)

- **Dashboard** — KPIs, revenue trend, order-status donut, revenue-by-category bar, recent orders, low stock, top districts
- **Analytics** — 7/30/90/180/365-day windows, period-over-period growth, payment mix, top searches
- **Catalogue** — Products (6-tab editor), Categories (tree), Brands, Inventory (inline editing), Reviews (moderation)
- **Sales** — Orders (status workflow + timeline + courier/tracking), Customers (tags & segmentation), Coupons, Shipping Zones, Payment Methods
- **Content / CMS** — Pages, Blog Posts, Menus (builder with live preview), Banners, Media Library
- **Settings** — General, Store, Appearance, SEO, Checkout, Payment, Shipping, Email, SMS, Social, Analytics, Advanced
- **System** — Admin Users (role-based), Activity Log (audit trail)

### SEO

- Per-route Metadata API with title templates and canonical URLs
- JSON-LD structured data: `Organization`, `WebSite` + SearchAction, `Product` (with offers & aggregateRating), `BreadcrumbList`, `BlogPosting`, `Blog`
- Open Graph and Twitter card tags
- Dynamic `sitemap.xml` (`app/sitemap.ts`) covering products, categories, brands, posts, pages
- `robots.txt` (`app/robots.ts`) with an admin override field in Settings → SEO
- Per-product and per-page meta title / description / keywords fields
- Web App Manifest (`app/manifest.ts`) served at `/manifest.webmanifest`, generated from
  the General + Appearance settings so the name, tagline and theme colour stay in sync.
  Enables install-to-home-screen on Android/iOS with standalone display.
- SVG `icon.svg` + `favicon.svg` with `apple-touch-icon` and `theme-color` tags

### Bangladesh localisation

- **Currency** — BDT formatted as `৳1,25,000` using the `en-IN` grouping convention
- **Geography** — all 8 divisions and 64 districts, with a district→division cascade at checkout
- **Shipping zones** — district-based rates (Dhaka metro vs. outside) with COD toggles per zone
- **Payments** — bKash, Nagad, Rocket, card/SSLCommerz and Cash on Delivery, each with sandbox/live toggle and credential storage
- **Couriers** — Pathao, Steadfast, RedX, Sundarban, SA Paribahan, own delivery
- **Bilingual** — Bangla (`Hind_Siliguri`) alongside English throughout, plus optional Bangla names on categories and products

### Responsive design

Mobile-first across the board: sticky header with drawer navigation, 5-tab bottom nav on phones,
bottom-sheet product filters, horizontal scroll rails, collapsible admin sidebar, and touch-friendly targets.

---

## Project structure

```
app/
  (store)/            storefront route group (own layout, header, footer)
  admin/              admin dashboard
    settings/[group]  the 12 settings panels
  api/                REST route handlers
    admin/            admin-only endpoints (auth-guarded)
    cart/ checkout/   storefront endpoints
  sitemap.ts          dynamic XML sitemap
  robots.ts           robots.txt
  manifest.ts         PWA web app manifest
components/
  store/              storefront UI
  admin/              dashboard UI
lib/
  db.ts               Prisma singleton
  auth.ts             JWT sessions (admin + customer), bcrypt hashing
  settings.ts         cached settings access + typed getSiteConfig()
  cart.ts             cart resolution and totals (coupon, shipping, tax)
  analytics.ts        dashboard aggregation queries
  utils.ts            BDT formatting, BD geography, status maps, helpers
prisma/
  schema.prisma       27 models
  seed.ts             full demo dataset
middleware.ts         forwards the pathname header, sets security headers
```

---

## Configuration

`.env` in the project root:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="change-this-to-a-long-random-string"

NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Payment gateways — sandbox credentials
BKASH_APP_KEY=""
BKASH_APP_SECRET=""
NAGAD_MERCHANT_ID=""
NAGAD_MERCHANT_KEY=""
SSLCOMMERZ_STORE_ID=""
SSLCOMMERZ_STORE_PASSWORD=""
```

Most store settings are stored in the database and editable from **Admin → Settings**, so you do not need
to restart the app after changing them.

---

## Useful scripts

| Command | What it does |
| --- | --- |
| `npm run setup` | **Automated installer** — database, `.env`, tables, admin account |
| `npm run setup:check` | Verify the server meets requirements, change nothing |
| `npm run setup:yes` | Install non-interactively (accepts all defaults) |
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run db:push` | Sync the Prisma schema to SQLite |
| `npm run db:seed` | Re-run the demo seed |
| `npm run db:reset` | Wipe the database and re-seed from scratch |
| `npm run db:studio` | Browse the data in Prisma Studio |
| `npm run db:use <db>` | Switch schema between `sqlite` / `postgres` / `mysql` |
| `node scripts/db-transfer.js export <file>` | Dump all tables to JSON |
| `node scripts/db-transfer.js import <file>` | Load that JSON into another database |

---

## Automated install on shared hosting

`setup.js` is a single interactive installer that takes a fresh upload and turns it into a
running store. It is the easiest path on a host with Node.js support (cPanel **Setup Node.js App**,
Plesk, or SSH access).

```bash
npm ci            # install dependencies first
npm run setup:check   # confirm the server can run the app
npm run setup         # interactive install
```

What it does, in order:

| Step | Action |
| --- | --- |
| 1 | Checks Node.js ≥ 18.17, required files, and that the project and `public/uploads` are writable |
| 2 | Asks which database to use — **MySQL/MariaDB** (cPanel's usual option), SQLite, or PostgreSQL |
| 3 | Writes `.env` with a freshly generated `AUTH_SECRET`, and preserves any gateway/SMTP keys already present |
| 4 | Points `prisma/schema.prisma` at the chosen provider, sets cross-platform `binaryTargets`, runs `prisma generate` |
| 5 | Runs `prisma db push` to create every table |
| 6 | Optionally loads the demo catalogue (38 products, 21 categories, blog posts, settings) |
| 7 | Creates the first admin account, with a bcrypt-hashed password |

For MySQL it asks for the host, port, username, password and database name separately and
assembles the connection URL itself, so you can copy the values straight out of cPanel →
**MySQL Databases**. The password is not echoed while you type it.

**Unattended installs.** `npm run setup:yes` accepts the documented default for every prompt, and
answers can also be piped in for provisioning scripts:

```bash
printf '2\n./prisma/prod.db\nhttps://example.com\nn\n' | node setup.js
```

The installer is safe to re-run: it detects an existing `.env`, offers to keep the current database
URL, and preserves credentials you have already filled in.

> Admin login requires **HTTPS** — the session cookie is marked `Secure`, so it is not sent over
> plain HTTP. Use `http://localhost:3000` in development and a real certificate in production.

---

## Going live

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for a full hosting guide — including how to check whether
your shared hosting can run this at all, Vercel and VPS walkthroughs, migrating off SQLite, and a
go-live checklist.

Quick version for a Linux host:

```bash
npm ci
npx prisma generate        # fetches the correct native engine for the server
npx prisma db push         # creates the production database
npm run build
pm2 start npm --name bd-market -- start
```

Copy `.env.example` to `.env` first and fill it in. Two things that catch people out:
`AUTH_SECRET` must be a fresh random value, and **HTTPS is required** — the session cookie is
marked `Secure`, so admin login will not work over plain HTTP.

---

## Notes

- The database is SQLite (`prisma/dev.db`) for zero-config local development. Switching to PostgreSQL or
  MySQL means changing the `provider` and `DATABASE_URL` in `schema.prisma` and re-running `db:push`.
- Prisma enums are not supported on SQLite, so status/role fields are plain strings with their allowed
  values documented inline in `prisma/schema.prisma`.
- Uploaded media is written to `public/uploads` and served by `app/uploads/[...path]/route.ts`.
  That route is required: Next.js snapshots `public/` at boot, so files written at runtime would
  otherwise 404 in production. On a serverless host, swap the multipart branch for object storage
  (S3, Cloudinary, R2) — see [DEPLOYMENT.md](./DEPLOYMENT.md#media-uploads-and-file-storage).
- Before going live: change `AUTH_SECRET`, update the store URL in Settings → General, rotate the REST API
  key in Settings → Advanced, and disable sandbox mode on your payment gateways.
