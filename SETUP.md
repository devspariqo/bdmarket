# BD Market — Setup Guide

Everything needed to get this store running, from a fresh clone to a working admin login.

**Time:** about 5 minutes for a local install.
**Requirements:** Node.js 18.17 or newer (20 LTS recommended) and npm.

| I want to… | Go to |
| --- | --- |
| Run it on my own machine | [Path A — Local install](#path-a--local-install) |
| Install on a server / shared hosting | [Path B — Server install](#path-b--server-install) |
| Set up the database by hand | [Manual setup](#manual-setup-alternative) |
| Fix an error | [Troubleshooting](#troubleshooting) |

---

## Step 1 — Check Node.js

```bash
node -v
```

You need **v18.17.0 or higher**. If the output is lower, or the command is not found, install Node from
[nodejs.org](https://nodejs.org) (pick the LTS version) and run this again.

---

## Step 2 — Install dependencies

From the project folder:

```bash
npm install
```

Use `npm ci` instead if you want an exact, reproducible install from `package-lock.json` — that is the
better choice on a server.

This takes a minute or two the first time. It also downloads the Prisma database engine for your
platform, so you need an internet connection.

---

## Path A — Local install

The fastest way. One command does the database, the config file and your admin account:

```bash
npm run setup
```

Answer the prompts:

1. **Which database?** — choose `2` (SQLite file) for local development. It needs no credentials and
   creates a single file on disk.
2. **SQLite file path** — press Enter to accept `./prisma/prod.db`, or use `./prisma/dev.db`.
3. **Public site URL** — press Enter to accept `http://localhost:3000`.
4. **Load demo data?** — choose `y` to get 38 products, 21 categories, 10 brands, sample orders, blog
   posts and all settings pre-loaded. Choose `n` for an empty store.
5. **Admin email / name / password** — your first login. Use a password of at least 6 characters.

Then start it:

```bash
npm run dev
```

Open **http://localhost:3000** for the storefront, and **http://localhost:3000/admin/login** for the
dashboard. Sign in with the admin account you just created.

> **Prefer not to answer prompts?** `npm run setup:yes` accepts every default. To check your machine
> can run the app without changing anything, use `npm run setup:check`.

### Want the demo catalogue instead?

If you skipped the seed step, or just want sample data, run:

```bash
npm run db:seed
```

That gives you these ready-made accounts:

| Role | Email | Password | Access |
| --- | --- | --- | --- |
| Admin | `admin@bdmarket.com.bd` | `admin123` | Everything |
| Manager | `manager@bdmarket.com.bd` | `staff123` | Orders, catalogue, settings |
| Editor | `editor@bdmarket.com.bd` | `editor123` | Products & content only |
| Customer | `rahim@example.com` | `customer123` | Storefront account |

> Change these passwords before the site goes public. They are published here, so they are not secret.

---

## Path B — Server install

For a VPS, or shared hosting with Node.js support. See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for
host-by-host instructions; the short version is:

```bash
npm ci
npm run setup:check     # confirm the server is ready
npm run setup           # interactive install
npm run build
npm start               # or: pm2 start npm --name bd-market -- start
```

On a server, choose **MySQL/MariaDB** (option `1`) rather than SQLite — it is what cPanel provides and
it survives redeploys. The installer asks for the host, port, username, password and database name
separately, so you can copy them straight out of cPanel → **MySQL Databases**. Create the database and
its user in cPanel *before* running the installer.

### Two things that trip people up on a live server

**Use HTTPS.** The admin session cookie is marked `Secure`, so it is not sent over plain HTTP. On
`http://` the login will appear to succeed and then bounce you straight back to the login page. Get a
certificate (Let's Encrypt is free) before testing the dashboard.

**Set the site URL before building.** `NEXT_PUBLIC_SITE_URL` is baked into the bundle at build time, not
read at startup. If you change it, you must rebuild — restarting is not enough.

---

## Manual setup (alternative)

If you would rather configure everything yourself and skip the installer:

```bash
cp .env.example .env    # then edit it
npm run db:push         # create the tables
npm run db:seed         # optional: demo data
npm run dev
```

At minimum, set these three values in `.env`:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="<a long random string>"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Generate a proper secret — never reuse the example, and never commit the real `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Payment gateways, couriers, SMTP and SMS are all optional. Leave them blank to disable those features;
the store still works with cash on delivery.

---

## Command reference

| Command | What it does |
| --- | --- |
| `npm run setup` | Interactive installer — database, config, tables, admin |
| `npm run setup:check` | Verify requirements only, change nothing |
| `npm run setup:yes` | Install non-interactively, all defaults |
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run db:push` | Apply the schema to the database |
| `npm run db:seed` | Load the demo catalogue |
| `npm run db:reset` | Wipe the database and re-seed |
| `npm run db:studio` | Browse your data in a visual editor |
| `npm run db:use <db>` | Switch between `sqlite` / `postgres` / `mysql` |

---

## Choosing a database

| Option | Best for | Notes |
| --- | --- | --- |
| **SQLite** | Local development, small single-server sites | A single file. No credentials. Back it up by copying the file. |
| **MySQL / MariaDB** | Shared hosting, cPanel | What most Bangladeshi hosts provide. |
| **PostgreSQL** | Vercel, Neon, Supabase, larger sites | Required if your host has a read-only filesystem. |

Switching later is supported — see *Migrating off SQLite* in [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## Confirming it works

After starting the server, these should all return `200`:

```bash
curl -o /dev/null -w "%{http_code} /\n"          http://localhost:3000/
curl -o /dev/null -w "%{http_code} /shop\n"      http://localhost:3000/shop
curl -o /dev/null -w "%{http_code} /sitemap.xml\n" http://localhost:3000/sitemap.xml
```

`/admin` should return `307` — that is correct, it is redirecting you to the login page. Sign in at
`/admin/login` to confirm the dashboard loads.

---

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `'node' is not recognized` | Node.js is not installed or not on your PATH. Install the LTS build. |
| `Node.js v16 — need 18.17 or newer` | Upgrade Node. Next.js 14 will not run on 16. |
| `EPERM ... rename query_engine-windows.dll.node` | Something is holding the Prisma engine open. Stop any running dev/production server, close editors, and **pause OneDrive/Dropbox** if the project lives in a synced folder. Then re-run. |
| `Can't reach database server` | The database is not running, or the host/port/credentials are wrong. Recheck `DATABASE_URL`. |
| `Error code 14: Unable to open the database file` | SQLite resolves relative paths against the **schema** directory, not the folder you run the command from. Use an absolute path: `DATABASE_URL="file:/full/path/to/prisma/prod.db"`. |
| Every page 500s after a fresh build | The build output is incomplete. Delete `.next`, run `npm run build` again, and make sure `public/` and `.next/static` are present if you copied a standalone build. |
| Admin login bounces back to the login page | You are on `http://`. The session cookie is `Secure` — use HTTPS in production. |
| Uploaded images 404 | `public/uploads` must exist and be writable (`mkdir -p public/uploads && chmod 775 public/uploads`). |
| Site URL is wrong in links and the sitemap | `NEXT_PUBLIC_SITE_URL` is set at build time. Fix `.env` and run `npm run build` again. |
| Port 3000 already in use | Stop the other process, or run the binary directly on another port: `npx next dev -p 3001`. (Do not use `npm run dev -- -p 3001` — the script already passes `-p 3000`, so you would end up with two conflicting flags.) |

---

## Next steps

- **Deploying to a real host** → [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Feature overview and project layout** → [README.md](./README.md)
- **First login checklist** — change the admin password, then set your store name, currency, shipping
  zones and payment keys under **Admin → Settings**.
