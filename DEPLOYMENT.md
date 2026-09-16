# Deploying BD Market to a Live Server

This guide covers the realistic options for hosting this project, in order of how well they fit.

> Setting up locally first, or want the plain install steps? See **[SETUP.md](./SETUP.md)**.

---

## First: can your shared hosting run this?

**Short answer: probably not, and here is how to check in 60 seconds.**

This project is a **Next.js 14 application with a Node.js server**. It is not PHP. It needs a  
**long-running Node process** — something that stays alive and answers requests continuously.

Classic shared hosting (the $3–5/month cPanel plan with PHP + MySQL) cannot do that. It serves  
static files and PHP scripts only. Uploading this project there will not work, no matter the  
configuration.

### Run these three checks on your host

| # | Check                  | Where to look                                | What you need                            |
| - | ---------------------- | -------------------------------------------- | ---------------------------------------- |
| 1 | **Node.js support**    | cPanel → "Setup Node.js App", or ask support | Node **18.17+** (20 LTS ideal)           |
| 2 | **SSH access**         | cPanel → "Terminal", or your SSH details     | Required to run build commands           |
| 3 | **Persistent process** | "Setup Node.js App" or PM2 in SSH            | Must survive after you close the browser |

If **all three pass**, go to [Option B](#option-b-shared-hosting-with-nodejs-support).

If **any fail**, use [Option A](#option-a-vercel--recommended) or [Option C](#option-c-cheap-vps--best-for-production).

---


## The installer (`setup.js`)

Wherever you deploy — shared hosting, a VPS, or your own machine — `setup.js` replaces the manual  
database and environment setup with one command. Run it from the project root after `npm ci`:

```bash
node setup.js --check    # 1. is this server ready? (changes nothing)
node setup.js            # 2. install
```

It checks the server, asks which database to use (**MySQL**, SQLite or PostgreSQL), writes `.env`  
with a freshly generated `AUTH_SECRET`, points Prisma at the right provider, creates every table,  
optionally loads the demo catalogue, and creates your first admin account.

Three ways to run it:

| Command                 | Use it for                                                 |
| ----------------------- | ---------------------------------------------------------- |
| `node setup.js`         | Normal interactive install — the one you want              |
| `node setup.js --check` | Verify requirements only, imports nothing, changes nothing |
| `node setup.js --yes`   | Unattended install, every prompt takes its default         |

Answers can also be piped in, which is useful for provisioning scripts:

```bash
printf '2\n./prisma/prod.db\nhttps://example.com\nn\n' | node setup.js
```

The installer is **safe to re-run**. It will notice an existing `.env`, offer to keep the current  
database URL, and carry over any payment-gateway or SMTP credentials you had already filled in.

> `setup.js` is the Node.js installer for this project. A PHP `install.php` would not apply here —  
> the application is a Next.js/Node server, not PHP, so there is no PHP runtime to hook into.  
> The installer does the same job (database, config, tables, admin user) in the language the app  
> actually runs on.

---

## Option A: Vercel (recommended)

Vercel is made by the Next.js team. This project deploys in about 5 minutes with zero server work.

> **One caveat:** Vercel's filesystem is **read-only**. SQLite (`prisma/dev.db`) cannot be written  
> there, and media uploads to `public/uploads` will fail. You must move the database to a hosted  
> Postgres/MySQL first. See [Migrating the database](#migrating-off-sqlite).

### Steps

1. **Push the project to GitHub** (see [Uploading your code](#uploading-your-code)).
2. Go to **vercel.com** → *Add New Project* → import the repository.
3. Vercel auto-detects Next.js. Leave build settings at their defaults.
4. Add **Environment Variables**:
   | Key                    | Value                                 |
   | ---------------------- | ------------------------------------- |
   | `DATABASE_URL`         | Your Postgres/MySQL connection string |
   | `AUTH_SECRET`          | A long random string (see below)      |
   | `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com`              |
5. Click **Deploy**.
6. **Add your custom domain**: Project → *Settings* → *Domains* → add your domain, then point your  
   domain's DNS to the value Vercel shows you.

Generate a strong `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Also set `binaryTargets` in `prisma/schema.prisma` to include `rhel-openssl-3.0.x` for Vercel.

---

## Option B: Shared hosting with Node.js support

This is the closest thing to "shared hosting that works". Providers that offer this pattern include  
**Hostinger**, **A2 Hosting**, **Namecheap**, **cPanel hosts with Passenger**, and  
**LiteSpeed-based hosts with Node support**. Confirm with their support that Node **18+** and  
**SSH** are included before buying.


### B0. Hostinger Web Apps — the managed flow

Hostinger's **Web Apps** (Websites → Add Website → Node.js web app) builds and runs the app for  
you from a connected GitHub repository. Four things about it are easy to get wrong:

**1. SQLite will not work here, even though Hostinger is not serverless.** Builds land in  
`~/domains/{domain}/hbuilds/current/`, and `current` is a symlink to the live build. **Every  
redeploy creates a new build directory**, so a SQLite file inside the app is wiped on each deploy.  
Use a hosted database.

**2. Use Hostinger's own MySQL.** Hostinger supports **MySQL only** on shared and managed plans —  
PostgreSQL is not available. That makes MySQL the simplest option by a wide margin: the credentials  
are shown plainly in hPanel, there is no connection pooler, no region to match, and no extra  
service to sign up for.

1. In hPanel go to **Websites → Dashboard → Databases → MySQL Databases**.
2. Click **Create database**, enter a name, and click **Create**. A database user is created
   automatically with the same name.
3. Hostinger prefixes both with your account ID, so you end up with something like
   `u860892017_bdmarket`. Save the password — it is shown only once.
4. Note the four values: **database name**, **username**, **password** and **host**.
5. Commit the schema change and push — Hostinger rebuilds automatically. (The provider switch and
   the tables are covered under *Creating the tables* below.)

> ⚠️ **The host must be `127.0.0.1`, not `localhost`.** PHP apps reach MySQL over a local socket,
> so `localhost` works for them. Node.js connects over TCP and resolves `localhost` to the IPv6
> loopback `::1`, which the database user is not granted for — the connection is refused with
> `Access denied for user 'u123456789_admin'@'::1'`. `127.0.0.1` forces IPv4 and works on every
> account.

**3. Hostinger overrides your `output` setting — it always builds with `output: 'standalone'`.**
You do not set this yourself, and any `output` value in your config is replaced. Two consequences:

- Your config must **export an object** (`module.exports = { ... }`). A *function* export
  (`module.exports = (phase) => ({ ... })`) loses both your settings and the standalone output,
  and the deploy fails with *Next.js build produced no standalone server or static output*. The
  file must also be named `next.config.js` / `.mjs` / `.ts` / `.mts` — `next.config.cjs` is
  silently ignored and the build continues with defaults.
- Standalone is a **strict production runtime**. Pages that are prerendered at build time are
  held to static-rendering rules, so a route that reads `cookies()` and is *also* prerendered
  will 500 here even though it works locally. See *Static storefront routes* under
  Troubleshooting before adding `generateStaticParams` anywhere under `app/(store)/`.

Your `DATABASE_URL` then looks like this — a single line, with the three values you just noted:

```
mysql://u860892017_bdmarket:YOUR-PASSWORD@127.0.0.1:3306/u860892017_bdmarket
```

**Build it with the guided helper** rather than by hand — it percent-encodes the password, enforces
`127.0.0.1`, tests the connection *before* saving anything, and can write `.env` for you:

```bash
npm run db:setup
```

Or non-interactively:

```bash
npm run db:check-url -- --build \
  --host 127.0.0.1 --port 3306 \
  --user u860892017_bdmarket \
  --password 'your-password' \
  --db u860892017_bdmarket
```

### Uploaded images and redeploys — set `UPLOAD_DIR`

**Do this before you rely on any uploaded image.** Hostinger builds into
`~/domains/{domain}/hbuilds/current/`, which is a symlink the deploy swaps for a fresh directory.
Anything written under the application folder is therefore **deleted on the next push** — the
database keeps the `/uploads/...` paths, so the header logo, payment logos, brand marks and every
product photo turn into broken images.

Point uploads at a folder outside the application:

```bash
mkdir -p ~/uploads && chmod 775 ~/uploads
```

Then add to **hPanel → website dashboard → Environment variables** (saving triggers a redeploy):

```
UPLOAD_DIR=/home/youruser/uploads
```

Use the absolute path, not `~`. Nothing else changes — URLs stay `/uploads/<file>`, only the
directory they resolve to moves. The admin **Media Library** shows a warning banner whenever uploads
are still landing somewhere a deploy will delete, so you will see this rather than discover it later.

### Creating the tables

Once `DATABASE_URL` is set and `/api/health` reports `schema-not-pushed`, the connection is working
and only the tables are missing. There are three ways to create them; **the first needs no network
configuration at all.**

**Option 1 — import via phpMyAdmin (easiest).** Hostinger databases are `localhost`-only, so
pushing from your own PC needs an allowlist entry first. Importing sidesteps that entirely, because
phpMyAdmin runs on the server.

1. Generate the SQL (both files are committed; regenerate after any schema change):
   ```bash
   npm run db:sql
   ```
2. hPanel → **Databases** → **phpMyAdmin** next to your database.
3. Select the database in the left sidebar → **Import** tab.
4. Choose one of the two files and click **Go**:

| File | Result |
| --- | --- |
| `prisma/schema.sql` | 27 empty tables — a clean store |
| `prisma/schema-with-demo.sql` | 27 tables **plus 645 demo rows** — products, orders, customers, reviews, settings, and the admin account |

`schema-with-demo.sql` drops and recreates every table, so it is safe to re-import but **wipes
anything already in that database**. It omits `AuditLog`, `SearchQuery` and `PageView` as
operational noise. The admin login is `admin@bdmarket.com.bd` / `admin123` — **change that
immediately**, it has been public in this repository.

**Option 2 — allow your IP and push from your PC.**

1. hPanel → **Databases** → **Remote MySQL**. Add your public IP (find it at
   [ipify.org](https://api.ipify.org)) and click **Add**.
2. That page also shows the **hostname** to connect to, e.g. `srv1517.hstgr.io`. Use it in place of
   `127.0.0.1`:
   ```bash
   DATABASE_URL="mysql://u860892017_bdmarket:PASSWORD@srv1517.hstgr.io:3306/u860892017_bdmarket" npx prisma db push
   ```
3. Remove the Remote MySQL entry when you are done — it is not needed by the app, which connects
   locally.

**Option 3 — SSH onto the server**, where `127.0.0.1` already works:
```bash
cd domains/yourdomain.com/hbuilds/current/nodejs
DATABASE_URL="mysql://user:pass@127.0.0.1:3306/dbname" npx prisma db push
```

Optionally load the demo catalogue afterwards. Note that `db:seed` also needs a database
connection, so run it the same way:
```bash
DATABASE_URL="..." npm run db:seed
```

**If hPanel has no Databases section**, your plan does not include MySQL. In that case connect to  
an external Postgres instead — see *Using Supabase Postgres* below.


### B0b. Using Supabase Postgres instead

Only needed if MySQL is unavailable. Supabase is an external Postgres provider, so it works on any  
plan — but the setup is fiddlier, because the credentials live in a different dashboard and the  
URL must be assembled correctly.

**Do not use Hostinger's "Connect a database" wizard for this.** It sets `SUPABASE_URL` and  
`SUPABASE_ANON_KEY`, which are Supabase's *client* credentials, not a Postgres connection string —  
Prisma cannot use them.

1. Create a free project at [supabase.com](https://supabase.com). Save the database password.
2. In the project, click **Connect** at the top of the page.
3. Choose **Transaction pooler** and copy the string.
4. Replace `[YOUR-PASSWORD]` — including the brackets — with your real password, percent-encoded.
5. Append `?pgbouncer=true`, then set the provider:
   ```bash
   node scripts/use-db.js postgres
   npx prisma db push        # run this with the SESSION pooler URL (port 5432)
   ```

```
postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true
```

The pooler host cannot be guessed — the `aws-N` index varies by region, so copy it from the dialog.  
The username differs by mode too: the pooler uses `postgres.<ref>`, the direct connection uses  
`postgres`. Direct connections are IPv6-only on the free plan and will not work from Hostinger.

**Environment variables** live at **hPanel → your website dashboard → Environment variables**.  
They are injected into **both the build and the running app**, and persist across deployments, so  
set them once:

| Key                    | Value                                    |
| ---------------------- | ---------------------------------------- |
| `DATABASE_URL`         | the MySQL URL above, or the Supabase URI |
| `AUTH_SECRET`          | a fresh 96-character hex string          |
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com`                 |

Saving the variables **triggers a redeploy**, which is what makes them take effect. `NEXT_PUBLIC_*`  
is baked in at build time, so it must be set *before* the build that needs it.

If the app deploys green but every page 500s, open **`/api/health`** — it names the cause.

**`invalid domain character in database URL`** — Prisma cannot parse `DATABASE_URL`. Verified  
against Prisma's own parser, this specific message means the **host** portion is malformed, which  
in practice is a space, a line break or a quote character that came along with a wrapped paste.  
Re-paste the value as one unbroken line with no surrounding quotes. Diagnose it locally with:

```bash
npm run db:check-url                                  # reads DATABASE_URL from .env
npm run db:check-url "postgresql://..."               # checks a specific value
npm run db:check-url -- --encode "p@ss#w0rd"          # percent-encode a password
```

A password containing `@`, `#`, `/` or `:` must be percent-encoded — `@` becomes `%40`, `#`  
becomes `%23`, `/` becomes `%2F`. Note that an unencoded `@` produces a *different* error  
(`Can't reach database server`), not this one.

### B1. Prepare the project locally (on your PC)

Do this **before** uploading — you cannot reliably compile on shared hosting.

```bash
cd "C:/Users/WALTON/OneDrive/Documents/BD Woocommerce"

# 1. Make sure the Linux Prisma engines are present (already configured in schema.prisma)
npx prisma generate

# 2. Build for production
npm run build
```

Confirm `prisma/schema.prisma` contains the `binaryTargets` line. It should already:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x", "debian-openssl-1.1.x", "linux-musl-openssl-3.0.x"]
}
```

### B2. Decide what to upload

**Upload everything EXCEPT `node_modules` and `.next/cache`.** Your host must run `npm install`  
so Prisma fetches the correct Linux engine for its own architecture.

| Upload                                                                       | Skip                                             |
| ---------------------------------------------------------------------------- | ------------------------------------------------ |
| `app/`, `components/`, `lib/`, `prisma/`                                     | `node_modules/` (reinstall on server)            |
| `public/`                                                                    | `.next/` (rebuild on server)                     |
| `package.json`, `package-lock.json`                                          | `.git/`                                          |
| `next.config.js`, `tailwind.config.js`, `tsconfig.json`, `postcss.config.js` | `tsconfig.tsbuildinfo`                           |
| `middleware.ts`                                                              | `prisma/dev.db` (unless you want your demo data) |

> **Note:** `prisma/dev.db` is gitignored but it is your *data*. If you want your seeded catalogue  
> and demo products live, upload it. For a clean store, skip it and the schema will be created empty.


### B3. Configure the app on the server

Over SSH, from your application root:

```bash
# Install dependencies exactly as locked
npm ci
```

**The quick way — use the installer.** It handles the environment file, the database tables, the  
Prisma engine and your first admin account in one pass:

```bash
node setup.js
```

It asks which database to use, then for the connection details. On cPanel, open **MySQL  
Databases** in the control panel and copy the host, database name and user straight from there.  
Check the server is ready first with `node setup.js --check` (changes nothing). For an unattended  
run, `node setup.js --yes` accepts every default.

The rest of this section is the manual equivalent — use it if you prefer to configure things by  
hand or the installer does not suit your host.

```bash
# Create the production environment file
nano .env
```

Paste this, then edit the values:

```env
DATABASE_URL="file:./prod.db"

# REQUIRED: generate a unique secret, never reuse the dev one
AUTH_SECRET="paste-your-generated-secret-here"

NEXT_PUBLIC_SITE_URL="https://yourdomain.com"
```

These three are the only variables the app reads. `NEXT_PUBLIC_SITE_NAME` is not  
used — the display name comes from **Admin → Settings → General**.

**Payment gateway credentials are not environment variables.** bKash, Nagad,  
Rocket and SSLCommerz are configured in the database at **Admin → Settings →  
Payments**, where each gateway also has a sandbox / live toggle. Enter the live  
keys there once the site is up; do not put them in `.env`.

For MySQL, the URL looks like this instead:

```env
DATABASE_URL="mysql://cpuser:dbpassword@localhost:3306/bdmarket"
```

Use `127.0.0.1` in place of `localhost` on any host where the app is a **Node.js** process —
including Hostinger and most cPanel hosts. Node resolves `localhost` to the IPv6 loopback `::1`,
which the database user is usually not granted for. See the B0 section above.

Create the database schema, then optionally load demo data:

```bash
npx prisma db push          # creates prod.db with all tables

# Make the uploads directory writable
mkdir -p public/uploads && chmod 775 public/uploads

# Only if you want the seeded demo catalogue:
npx prisma db seed          # or: npx tsx prisma/seed.ts
```

### B4. Build and start

```bash
npm run build
```

Then start it under a process manager so it restarts automatically. **PM2** is the standard choice:

```bash
npm install -g pm2
pm2 start npm --name "bd-market" -- start
pm2 save                     # remember this process list
pm2 startup                  # prints a command — run it to auto-start on reboot
```

Verify it is alive:

```bash
pm2 status
pm2 logs bd-market --lines 50
```

### B5. Point the domain at the Node app

Two common setups:

**Via cPanel's "Setup Node.js App":**

- Application root: your project folder
- Application startup file: `node_modules/next/dist/bin/next`
- Application URL: your domain
- Then click *Run NPM Install* and *Restart*

**Via reverse proxy (if you have root or the host allows it):**

```apache
# Apache — .htaccess in public_html
RewriteEngine On
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
```

```nginx
# Nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

Finally enable **free SSL** (Let's Encrypt) from your cPanel — this project sets  
`Secure` cookies, so **HTTPS is mandatory** for admin login to work.

---

## Option C: Cheap VPS (best for production)

If you want SQLite to actually work and full control, a **$5/month VPS** is the honest answer.  
DigitalOcean, Hetzner, Vultr, Contabo and Linode all work.

```bash
# On a fresh Ubuntu 22.04 server
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git

# Get your code
git clone <your-repo-url> /var/www/bd-market
cd /var/www/bd-market
npm ci
npx prisma generate
npx prisma db push
npm run build

# Run it forever
sudo npm install -g pm2
pm2 start npm --name bd-market -- start
pm2 startup && pm2 save
```

Then put Nginx in front (config above) and add HTTPS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

On a VPS, SQLite is fine for a small-to-medium store — but **back up `prod.db` daily**:

```bash
# Add to crontab -e — nightly backup, keeps 30 days
0 3 * * * cp /var/www/bd-market/prisma/prod.db /var/backups/bd-market-$(date +\%F).db
```


### Optional: slim container/standalone deploy

For Docker or a minimal server you can build a self-contained bundle instead of shipping  
`node_modules`. Add one line to `next.config.js`:

```js
output: 'standalone',
```

Then:

```bash
npm run build
# Next does NOT copy these automatically — the site breaks without them:
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

cd .next/standalone
PORT=3000 HOSTNAME=0.0.0.0 \
DATABASE_URL="file:/abs/path/to/prisma/prod.db" \
AUTH_SECRET="..." \
node server.js
```

Verified on this project: all routes return 200, CSS loads, and uploaded media serves correctly  
with its security guards intact.

Two gotchas:

- **If you skip the two `cp` commands, the site loads unstyled with no images.** This is documented  
  Next.js behaviour, not a bug — the standalone bundle contains only `server.js` and `node_modules`.
- **SQLite paths must be absolute.** Prisma resolves relative SQLite paths against the schema  
  directory, so `file:./prod.db` breaks when the server runs from a different working directory.  
  A relative path produces `EINVAL`/`Unable to open the database file` and every page 500s.  
  Use `file:/absolute/path/to/prod.db` — or just switch to Postgres/MySQL, which is immune to this.

---

## Migrating off SQLite

Required for Vercel; recommended for any serious store. Two steps: switch the schema, then move  
your data. Both are scripted.

### Step 1 — Switch the provider

```bash
npm run db:use postgres     # or: mysql  |  sqlite (to switch back)
```

This rewrites `prisma/schema.prisma` and sets the correct `binaryTargets` — including  
`rhel-openssl-3.0.x`, which Vercel requires. It is safe to run repeatedly and to revert.

Then set `DATABASE_URL` in `.env`:

| Provider   | Example                                                     |
| ---------- | ----------------------------------------------------------- |
| PostgreSQL | `postgresql://user:pass@host:5432/bdmarket?sslmode=require` |
| MySQL      | `mysql://user:pass@host:3306/bdmarket`                      |

### Step 2 — Create the tables

```bash
npx prisma generate
npx prisma db push
```

### Step 3 — Move your existing data

Your 762 seeded rows (products, orders, customers, settings) can be carried across:

```bash
# On your current database
node scripts/db-transfer.js export backup.json

# After switching DATABASE_URL to the new database
node scripts/db-transfer.js import backup.json
```

The export writes every table to one JSON file. The import preserves record ids and inserts in  
dependency order, so foreign keys stay valid; category parent links are re-linked in a second pass.  
Verified end-to-end on this project: **762/762 rows, all 25 tables**, with products, orders and  
settings queryable afterwards.

> Run `npx prisma db push` against the **target** database before importing, so the tables exist.

### Step 4 — Rebuild

```bash
npm run build
```

Clean up `backup.json` afterwards — it contains customer emails and order data.

### Alternative: skip the data

For a fresh store you can simply seed it instead:

```bash
npm run db:use postgres
npx prisma db push
npm run db:seed
```

### Full workflow summary

```bash
# Move local SQLite → production Postgres
node scripts/db-transfer.js export backup.json
npm run db:use postgres
# edit .env → DATABASE_URL="postgresql://..."
npx prisma generate
npx prisma db push
node scripts/db-transfer.js import backup.json
npm run build
```

> **Do not introduce Prisma `enum` types.** The schema deliberately uses plain `String` fields for  
> status/role values so it stays portable across SQLite, PostgreSQL and MySQL. Adding enums would  
> break the ability to develop locally on SQLite. Keep it that way.

---

## Uploading your code

### With Git (recommended)

```bash
cd "C:/Users/WALTON/OneDrive/Documents/BD Woocommerce"
git init
git add .
git commit -m "BD Market eCommerce platform"

# Create an empty repo on github.com first, then:
git remote add origin https://github.com/YOURNAME/bd-market.git
git branch -M main
git push -u origin main
```

`.gitignore` already excludes `node_modules/`, `.next/`, `.env` and `prisma/dev.db`, so no secrets  
or build output get committed.

### With FTP / cPanel File Manager

Zip the project **excluding `node_modules` and `.next`** (they contain Windows binaries and  
thousands of files — uploading them wastes hours and will not work on Linux), then upload and  
extract on the server.

---

## Environment variables reference

| Variable                             | Required | Notes                                                         |
| ------------------------------------ | -------- | ------------------------------------------------------------- |
| `DATABASE_URL`                       | **Yes**  | `file:./prod.db` for SQLite, or a Postgres/MySQL URL          |
| `AUTH_SECRET`                        | **Yes**  | Signs admin + customer sessions. Must be unique and secret    |
| `NEXT_PUBLIC_SITE_URL`               | **Yes**  | Full URL with `https://`. Used for canonical tags and sitemap |
| `NEXT_PUBLIC_SITE_NAME`              | No       | Display name                                                  |
| `BKASH_*`, `NAGAD_*`, `SSLCOMMERZ_*` | No       | Leave blank to disable that gateway; start in sandbox         |
| `SMTP_*`                             | No       | Order confirmation emails                                     |
| `SMS_API_KEY`, `SMS_SENDER_ID`       | No       | BD SMS notifications                                          |

> Variables starting with `NEXT_PUBLIC_` are baked in **at build time**. If you change one, you must  
> rebuild (`npm run build`) — restarting alone is not enough.

---


## Go-live checklist

**Security**

- [ ] `AUTH_SECRET` is a fresh random value, **not** the dev default
- [ ] HTTPS enabled — the session cookie is `Secure`, so login fails on plain HTTP
- [ ] Demo accounts changed or deleted (`admin@bdmarket.com.bd` / `admin123`)
- [ ] `.env` is not publicly accessible or committed to Git
- [ ] Payment gateways still in **sandbox** until you have live credentials

**Configuration**

- [ ] `NEXT_PUBLIC_SITE_URL` matches your real domain
- [ ] Admin → Settings → General: site name, email, phone, address updated
- [ ] Admin → Settings → Store: currency, weight unit, order prefix
- [ ] Admin → Settings → SEO: meta title/description, and the sitemap URL field
- [ ] Shipping zones and rates set for Dhaka vs. outside Dhaka
- [ ] Payment methods enabled with real credentials

**Verification**

- [ ] Homepage loads on your domain
- [ ] Register a test customer, add to cart, place a COD order
- [ ] The order appears in Admin → Orders
- [ ] **Upload an image in Admin → Media, then confirm it displays** (this is the upload-path test)
- [ ] Order tracking works at `/pages/track-order`
- [ ] `https://yourdomain.com/sitemap.xml` returns XML
- [ ] `https://yourdomain.com/robots.txt` returns text
- [ ] Submit the sitemap in Google Search Console
- [ ] Test on a real phone — the design is responsive, confirm it

---


## Troubleshooting

| Symptom                                                          | Cause                                                     | Fix                                                                                                          |
| ---------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Homepage works, every `/product/<slug>` 500s**                 | `generateStaticParams` on a route whose layout reads `cookies()` | Remove it and set `export const dynamic = 'force-dynamic'` — see *Static storefront routes* below             |
| **"Next.js build produced no standalone server or static output"** | A *function* `next.config` export, or an unsupported filename | Export a config **object** from `next.config.js`. Not a function, not `next.config.cjs`                       |
| **"Query engine library not found"**                             | Windows-built Prisma on Linux                             | `binaryTargets` in schema (already set), then `npx prisma generate` and `npm run build` on the server        |
| **Uploaded images 404**                                          | Next snapshots `public/` at boot                          | Already fixed — uploads are served by `app/uploads/[...path]/route.ts`. If you removed that file, restore it |
| **`EACCES` / can't write `prod.db`**                             | File permissions                                          | `chmod 664 prisma/prod.db && chmod 775 prisma`                                                               |
| **`EACCES` on upload**                                           | `public/uploads` not writable                             | `mkdir -p public/uploads && chmod 775 public/uploads`                                                        |
| **Every page 500s, log says `Unable to open the database file`** | Relative SQLite path resolved against the wrong directory | Use an absolute `DATABASE_URL`: `file:/var/www/bd-market/prisma/prod.db`                                     |
| **502 Bad Gateway**                                              | Node process died                                         | `pm2 logs` — usually a missing env var or DB error                                                           |
| **Login silently fails, page reloads**                           | Cookie rejected over HTTP                                 | Enable HTTPS. The `Secure` flag blocks cookies on plain HTTP                                                 |
| **Admin pages redirect in a loop**                               | Missing middleware                                        | Ensure `middleware.ts` is uploaded at the project root                                                       |
| **Changes not showing**                                          | Build cached                                              | `rm -rf .next && npm run build`, then restart                                                                |
| **`EINVAL readlink` during build**                               | OneDrive/Dropbox sync interference                        | Build on the server, or move the project out of OneDrive first                                               |
| **Out of memory during build**                                   | Shared hosts are RAM-limited                              | Build locally and upload `.next`, or upgrade the plan                                                        |

---

## Static storefront routes — do not add `generateStaticParams` to them

**Never put `generateStaticParams` on a route under `app/(store)/`.** It will build fine, work
locally, and then 500 in production.

The reason is that `app/(store)/layout.tsx` wraps *every* storefront page and reads `cookies()`
(for the cart count and the customer session). A route that is statically prerendered is not
allowed to touch a dynamic API. `next dev` and a local `next start` tolerate the mismatch and
quietly fall back to dynamic rendering — which is why this only ever shows up after deploying.
A strict runtime enforces the rule and the route dies with `DYNAMIC_SERVER_USAGE` (HTTP 500)
while the rest of the site keeps working.

`/product/[slug]` hit exactly this. It was the only storefront route marked **● (SSG)** in the
build output:

```
┌ ƒ /                          ← Dynamic
├ ƒ /category/[slug]           ← Dynamic
├ ƒ /brand/[slug]              ← Dynamic
├ ƒ /blog/[slug]               ← Dynamic
├ ● /product/[slug]            ← SSG  ← the odd one out, and the one that 500'd
```

**Check after every change to a storefront route.** `npm run build` prints the table above; any
`○` or `●` row under `app/(store)/` is a future production 500. The fix is to drop
`generateStaticParams` and make the intent explicit:

```ts
export const dynamic = 'force-dynamic';
```

Nothing is lost by doing so. Because the layout already forces dynamic rendering for the whole
subtree, the prerendered HTML was never servable in the first place — `generateStaticParams` only
produced output that the runtime then had to throw away, and that it crashed on instead.

Routes that are *safe* to prerender are the ones outside `(store)` that never touch cookies:
`app/sitemap.ts`, `app/robots.ts` and `app/manifest.ts` are intentionally static and read the
database at build time.

---

## Media uploads and file storage

Uploaded images go to **`public/uploads/`** on disk, and are served by the route handler at  
`app/uploads/[...path]/route.ts`.

**Why the route handler is necessary:** Next.js takes a snapshot of `public/` when the production  
server boots. A file written to `public/uploads/` *after* startup is **not** served by the static  
handler — it returns 404. Since the admin media uploader writes files at runtime, serving them  
through a route handler is what makes uploads work in production. Do not delete  
`app/uploads/[...path]/route.ts`.

The handler also enforces:

- an allow-list of image/document extensions (returns 415 otherwise)
- path-traversal protection (returns 400)
- `Cache-Control: immutable` for long-lived caching
- a restrictive `Content-Security-Policy` on SVG files so uploaded SVGs cannot execute scripts

### On hosts with ephemeral or read-only disks

Vercel, Netlify and most serverless platforms cannot persist files written to disk. Uploads will  
appear to succeed and then vanish. For those hosts, switch the multipart branch in  
`app/api/admin/media/route.ts` to object storage (Cloudinary, S3, Cloudflare R2, Supabase Storage)  
and return the resulting absolute URL in place of `/uploads/<filename>`.

The free-form **"Add image by URL"** path in the media library already accepts remote URLs and works  
unchanged on any host — it is the simplest workaround if you deploy serverless and do not want to  
wire up a bucket immediately.

Ensure the directory exists and is writable before first use:

```bash
mkdir -p public/uploads
chmod 775 public/uploads
```

---

## Which option should you pick?

| Your situation                                     | Choose                                    |
| -------------------------------------------------- | ----------------------------------------- |
| Fastest, free to start, no server admin            | **Option A — Vercel** (+ hosted Postgres) |
| Already paying for shared hosting with Node + SSH  | **Option B**                              |
| Want SQLite, uploads and full control to just work | **Option C — $5 VPS**                     |
| Classic PHP-only shared hosting                    | **Not possible** — upgrade or switch      |
