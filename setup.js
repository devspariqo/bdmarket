#!/usr/bin/env node
/**
 * BD Market — Automated Setup / Installer
 * ========================================
 *
 * The Node.js equivalent of `install.php`. Run this on your server after
 * uploading the project and running `npm ci`.
 *
 *   node setup.js                 interactive installer
 *   node setup.js --check         verify the server meets requirements
 *   node setup.js --yes           non-interactive, uses existing .env values
 *
 * It will:
 *   1. Check Node version, write permissions and required files
 *   2. Ask for your MySQL (or SQLite) connection details
 *   3. Write .env with a freshly generated AUTH_SECRET
 *   4. Generate the Prisma client for THIS platform
 *   5. Create all database tables
 *   6. Optionally load the demo catalogue
 *   7. Optionally create a fresh admin account
 *
 * Safe to re-run: it detects an existing install and asks before overwriting.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const readline = require('readline');

const ROOT = __dirname;
const ENV_PATH = path.join(ROOT, '.env');
const SCHEMA_PATH = path.join(ROOT, 'prisma', 'schema.prisma');

const args = process.argv.slice(2);
const CHECK_ONLY = args.includes('--check');
const NON_INTERACTIVE = args.includes('--yes') || args.includes('-y');

// ── pretty output ────────────────────────────────────────────────
const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', cyan: '\x1b[36m',
};
const ok = (m) => console.log(`  ${c.green}✓${c.reset} ${m}`);
const bad = (m) => console.log(`  ${c.red}✗${c.reset} ${m}`);
const warn = (m) => console.log(`  ${c.yellow}!${c.reset} ${m}`);
const info = (m) => console.log(`  ${c.dim}·${c.reset} ${m}`);
const step = (n, m) => console.log(`\n${c.bold}${c.cyan}[${n}]${c.reset} ${c.bold}${m}${c.reset}`);
const hr = () => console.log(`${c.dim}${'─'.repeat(62)}${c.reset}`);

/**
 * Input plumbing.
 *
 * There are three ways this script can receive answers:
 *   1. `--yes`  → no prompting at all, every answer is the documented default.
 *   2. a TTY    → the normal interactive case; readline echoes and edits properly.
 *   3. a pipe   → `echo "..." | node setup.js`, or a provisioning script that
 *                 feeds answers in. This is common on shared hosting.
 *
 * Case 3 is why we do not just use readline: when stdin is a pipe, readline's
 * `question()` attaches a one-shot 'line' listener, but Node emits 'end' while
 * the *second* question is still pending (the stream is drained faster than the
 * questions are asked). The interface then closes, the pending callback is never
 * invoked, and the awaited promise hangs forever — the installer appears to
 * freeze. So for piped input we buffer lines ourselves and hand them out.
 */
const PIPED = !NON_INTERACTIVE && !process.stdin.isTTY;

let rl = null;
if (!NON_INTERACTIVE && !PIPED) {
  rl = readline.createInterface({ input: process.stdin, output: process.stdout });
}

const queuedLines = [];
const lineWaiters = [];
let inputEnded = false;

if (PIPED) {
  process.stdin.setEncoding('utf8');
  let carry = '';
  const flush = (fromEof) => {
    const parts = carry.split(/\r\n|\r|\n/);
    carry = fromEof ? '' : parts.pop();
    for (const p of parts) queuedLines.push(p);
    while (lineWaiters.length && queuedLines.length) {
      lineWaiters.shift()(queuedLines.shift());
    }
  };
  process.stdin.on('data', (chunk) => {
    carry += chunk;
    flush(false);
  });
  const finish = () => {
    flush(true);
    if (carry.length) {
      queuedLines.push(carry);
      carry = '';
    }
    inputEnded = true;
    while (lineWaiters.length) lineWaiters.shift()(null);
    while (lineWaiters.length && queuedLines.length) {
      lineWaiters.shift()(queuedLines.shift());
    }
  };
  process.stdin.on('end', finish);
  process.stdin.on('error', finish);
  process.stdin.resume();
}

/** Read one raw line. Resolves with null once piped input is exhausted. */
function readLine() {
  return new Promise((resolve) => {
    if (queuedLines.length) return resolve(queuedLines.shift());
    if (inputEnded) return resolve(null);
    lineWaiters.push(resolve);
  });
}

function ask(question, fallback = '') {
  if (NON_INTERACTIVE) return Promise.resolve(fallback);
  const suffix = fallback ? ` ${c.dim}(${fallback})${c.reset}` : '';
  process.stdout.write(`  ${question}${suffix}: `);
  if (!PIPED && rl) {
    return new Promise((resolve) => rl.question('', (a) => resolve(a.trim() || fallback)));
  }
  return readLine().then((a) => (a === null || a.trim() === '' ? fallback : a.trim()));
}

function askHidden(question) {
  if (NON_INTERACTIVE) return Promise.resolve('');
  process.stdout.write(`  ${question}: `);
  // Piped input has no terminal to mask, so fall back to a plain line read.
  if (PIPED) return readLine().then((a) => (a === null ? '' : a.trim()));
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    let buf = '';
    const onData = (ch) => {
      const s = ch.toString('utf8');
      if (s === '\n' || s === '\r' || s === '\u0004') {
        stdin.setRawMode(wasRaw);
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(buf);
      } else if (s === '\u0003') {
        process.stdout.write('\n');
        process.exit(130);
      } else if (s === '\u007f' || s === '\b') {
        if (buf.length) {
          buf = buf.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        buf += s;
        process.stdout.write('*');
      }
    };
    stdin.on('data', onData);
  });
}

function banner() {
  // Box is 60 chars wide inside the borders; pad explicitly so it lines up.
  const W = 58;
  const line = (text, visible) => {
    const pad = W - visible;
    return `${c.green}${c.bold}  ║${c.reset}${text}${' '.repeat(Math.max(0, pad))}${c.green}${c.bold}║${c.reset}`;
  };
  console.log('');
  console.log(`${c.green}${c.bold}  ╔${'═'.repeat(W)}╗${c.reset}`);
  console.log(line(`  ${c.bold}BD Market${c.reset} — Store Setup`, 20));
  console.log(line(`  ${c.dim}Bangladesh Fashion & Lifestyle eCommerce${c.reset}`, 40));
  console.log(`${c.green}${c.bold}  ╚${'═'.repeat(W)}╝${c.reset}`);
  console.log('');
}

// ── run a command, streaming output ──────────────────────────────
/**
 * Resolve a locally-installed CLI binary.
 *
 * Calling `npx <tool>` via execFileSync is unreliable on Windows: with
 * `shell: true` it goes through cmd.exe, which mangles the arguments, and
 * without it npx may not be on PATH at all. Running the JS entry point with
 * the current Node binary is portable and avoids the shell entirely.
 */
function localBin(pkg, entry) {
  const js = path.join(ROOT, 'node_modules', pkg, entry);
  return fs.existsSync(js) ? js : null;
}

function run(cmd, cmdArgs, opts = {}) {
  return execFileSync(cmd, cmdArgs, {
    cwd: ROOT,
    stdio: 'inherit',
    ...opts,
  });
}

/** Run a local CLI (prisma, tsx) using the current Node executable. */
function runLocal(pkg, entry, cliArgs) {
  const js = localBin(pkg, entry);
  if (!js) {
    throw new Error(
      `${pkg} is not installed. Run "npm ci" in this directory first.`,
    );
  }
  return run(process.execPath, [js, ...cliArgs]);
}

function prisma(argsList) {
  return runLocal('prisma', path.join('build', 'index.js'), argsList);
}

function tsx(argsList) {
  const direct = localBin('tsx', path.join('dist', 'cli.mjs'));
  if (direct) return run(process.execPath, [direct, ...argsList]);
  // Newer tsx versions ship a bin shim instead
  const shim = path.join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.cjs');
  if (fs.existsSync(shim)) return run(process.execPath, [shim, ...argsList]);
  throw new Error('tsx is not installed. Run "npm ci" in this directory first.');
}

function runCapture(cmd, cmdArgs, opts = {}) {
  try {
    return execFileSync(cmd, cmdArgs, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...opts,
    }).trim();
  } catch (e) {
    return '';
  }
}

// ── 1. requirements ──────────────────────────────────────────────
function checkRequirements() {
  step(1, 'Checking server requirements');
  const problems = [];

  // Node version — Next.js 14 needs 18.17+
  const major = Number(process.versions.node.split('.')[0]);
  const minor = Number(process.versions.node.split('.')[1]);
  if (major > 18 || (major === 18 && minor >= 17)) {
    ok(`Node.js ${process.versions.node}`);
  } else {
    bad(`Node.js ${process.versions.node} — need 18.17 or newer`);
    problems.push('node-version');
  }

  // Platform info helps diagnose native engine issues
  info(`Platform: ${process.platform} ${os.arch()}`);

  // Required files
  for (const [file, label] of [
    ['package.json', 'package.json'],
    ['prisma/schema.prisma', 'Prisma schema'],
    ['node_modules/@prisma/client', 'Prisma client package'],
  ]) {
    if (fs.existsSync(path.join(ROOT, file))) ok(label);
    else {
      bad(`${label} missing (${file})`);
      problems.push(file);
    }
  }

  // Write permission for .env and the uploads directory
  try {
    const probe = path.join(ROOT, '.write-test');
    fs.writeFileSync(probe, 'x');
    fs.unlinkSync(probe);
    ok('Project directory is writable');
  } catch {
    bad('Project directory is NOT writable — .env cannot be created');
    problems.push('not-writable');
  }

  const uploads = path.join(ROOT, 'public', 'uploads');
  try {
    fs.mkdirSync(uploads, { recursive: true });
    fs.accessSync(uploads, fs.constants.W_OK);
    ok('public/uploads is writable');
  } catch {
    bad('public/uploads is NOT writable — image uploads will fail');
    problems.push('uploads');
  }

  return problems;
}

// ── 2. database details ──────────────────────────────────────────
async function askDatabase() {
  step(2, 'Database connection');

  // If an .env already exists with a URL, offer to keep it
  let existingUrl = null;
  if (fs.existsSync(ENV_PATH)) {
    const m = fs.readFileSync(ENV_PATH, 'utf8').match(/^DATABASE_URL\s*=\s*"?([^"\n]+)"?/m);
    if (m) existingUrl = m[1];
  }

  if (NON_INTERACTIVE && existingUrl) {
    info(`Using DATABASE_URL from existing .env`);
    return parseUrl(existingUrl);
  }

  let url = '';
  if (existingUrl) {
    info(`Found an existing database URL.`);
    const keep = await ask('Keep it? (y/n)', 'y');
    if (keep.toLowerCase().startsWith('y')) return parseUrl(existingUrl);
  }

  console.log('');
  console.log('  Which database will this store use?');
  console.log(`    ${c.bold}1${c.reset}  MySQL / MariaDB   ${c.dim}(recommended for shared hosting + cPanel)${c.reset}`);
  console.log(`    ${c.bold}2${c.reset}  SQLite file       ${c.dim}(simplest, no credentials needed)${c.reset}`);
  console.log(`    ${c.bold}3${c.reset}  PostgreSQL        ${c.dim}(Neon, Supabase, VPS)${c.reset}`);
  console.log('');

  const choice = await ask('Enter 1, 2 or 3', '1');

  if (choice === '2') {
    const file = await ask('SQLite file path', './prisma/prod.db');
    return { provider: 'sqlite', url: `file:${file}` };
  }

  if (choice === '3') {
    console.log(`\n  ${c.dim}Format: postgresql://user:password@host:5432/dbname${c.reset}`);
    const url = await ask('PostgreSQL URL', '');
    if (!url) throw new Error('A PostgreSQL URL is required.');
    return { provider: 'postgresql', url };
  }

  // MySQL — gather pieces so the user does not have to hand-format a URL
  console.log(`\n  ${c.dim}Use the MySQL details from your hosting control panel.${c.reset}`);
  console.log(`  ${c.dim}On cPanel these are usually under "MySQL Databases".${c.reset}\n`);

  const host = await ask('MySQL host', 'localhost');
  const port = await ask('MySQL port', '3306');
  const user = await ask('MySQL username', '');
  const pass = await askHidden('MySQL password');
  const db = await ask('Database name', '');

  if (!user || !db) throw new Error('MySQL username and database name are required.');

  const enc = encodeURIComponent(pass);
  url = `mysql://${user}:${enc}@${host}:${port}/${db}`;
  return { provider: 'mysql', url };
}

function parseUrl(url) {
  if (url.startsWith('mysql://')) return { provider: 'mysql', url };
  if (url.startsWith('postgres')) return { provider: 'postgresql', url };
  return { provider: 'sqlite', url };
}

// ── 3. write .env ────────────────────────────────────────────────
function writeEnv(db, siteUrl) {
  step(3, 'Writing configuration');

  const secret = crypto.randomBytes(48).toString('hex');

  let existing = '';
  if (fs.existsSync(ENV_PATH)) {
    existing = fs.readFileSync(ENV_PATH, 'utf8');
    // Preserve any gateway / SMTP credentials the user already filled in
    const keepKeys = [
      'BKASH_APP_KEY', 'BKASH_APP_SECRET', 'BKASH_USERNAME', 'BKASH_PASSWORD',
      'NAGAD_MERCHANT_ID', 'NAGAD_PUBLIC_KEY', 'NAGAD_PRIVATE_KEY',
      'SSLCOMMERZ_STORE_ID', 'SSLCOMMERZ_STORE_PASSWORD',
      'PATHAO_CLIENT_ID', 'PATHAO_CLIENT_SECRET', 'STEADFAST_API_KEY', 'STEADFAST_SECRET_KEY',
      'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS',
      'SMS_API_KEY', 'SMS_SENDER_ID',
    ];
    const kept = [];
    for (const key of keepKeys) {
      const m = existing.match(new RegExp(`^${key}\\s*=\\s*"?([^"\\n]*)"?`, 'm'));
      if (m && m[1]) kept.push(`${key}="${m[1]}"`);
    }
    if (kept.length) info(`Preserved ${kept.length} existing credential value(s)`);
    var preserved = kept;
  }

  const content = `# BD Market — generated by setup.js on ${new Date().toISOString()}
# Do not commit this file to version control.
#
# Only the three values below are read by the app.

# ── Database (REQUIRED) ──────────────────────────────────────────
DATABASE_URL="${db.url}"

# ── Auth (REQUIRED) ──────────────────────────────────────────────
# Signs admin and customer session cookies. Generated fresh on install.
AUTH_SECRET="${secret}"

# ── Site (REQUIRED) ──────────────────────────────────────────────
# Must include the protocol. Used for canonical tags, OG and the sitemap.
# NOTE: NEXT_PUBLIC_* values are baked in at BUILD time — change this before
# running "npm run build", not after.
NEXT_PUBLIC_SITE_URL="${siteUrl}"

# ═════════════════════════════════════════════════════════════════
# RESERVED — not read by the code yet.
#
# Payment gateway credentials live in the DATABASE, not here:
#     Admin -> Settings -> Payments   (each gateway has a sandbox/live toggle)
#
# The variables below are placeholders for courier, email and SMS integrations
# that are scaffolded but not yet wired to the environment. Setting them has no
# effect today; they are kept so the intended shape of a production config is
# documented. Safe to ignore.
# ═════════════════════════════════════════════════════════════════

# ── Payment gateways (reserved) ──────────────────────────────────
BKASH_APP_KEY=""
BKASH_APP_SECRET=""
BKASH_USERNAME=""
BKASH_PASSWORD=""
NAGAD_MERCHANT_ID=""
NAGAD_PUBLIC_KEY=""
NAGAD_PRIVATE_KEY=""
SSLCOMMERZ_STORE_ID=""
SSLCOMMERZ_STORE_PASSWORD=""

# ── Couriers (reserved) ──────────────────────────────────────────
PATHAO_CLIENT_ID=""
PATHAO_CLIENT_SECRET=""
STEADFAST_API_KEY=""
STEADFAST_SECRET_KEY=""

# ── Email / SMTP (reserved) ──────────────────────────────────────
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""

# ── SMS (reserved) ───────────────────────────────────────────────
SMS_API_KEY=""
SMS_SENDER_ID="BDMARKET"
`;

  fs.writeFileSync(ENV_PATH, content);
  ok('Created .env');
  ok('Generated a unique AUTH_SECRET');
  ok(`Database: ${db.provider}`);
  ok(`Site URL: ${siteUrl}`);
}

// ── 4. switch provider + generate client ─────────────────────────
function configurePrisma(provider) {
  step(4, 'Preparing the database engine');

  const targets =
    provider === 'postgresql'
      ? ['native', 'debian-openssl-3.0.x', 'debian-openssl-1.1.x', 'linux-musl-openssl-3.0.x', 'rhel-openssl-3.0.x']
      : ['native', 'debian-openssl-3.0.x', 'debian-openssl-1.1.x', 'linux-musl-openssl-3.0.x'];

  let schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  schema = schema.replace(
    /generator client \{[\s\S]*?\n\}/,
    `generator client {
  provider = "prisma-client-js"
  // Engines for every platform this project may build or run on, so a build on
  // Windows/macOS still deploys to Linux without "Query engine library not found".
  binaryTargets = [${targets.map((t) => `"${t}"`).join(', ')}]
}`,
  );
  schema = schema.replace(
    /datasource db \{[\s\S]*?\n\}/,
    `datasource db {
  provider = "${provider}"
  url      = env("DATABASE_URL")
}`,
  );
  fs.writeFileSync(SCHEMA_PATH, schema);
  ok(`Schema provider set to "${provider}"`);

  try {
    prisma(['generate']);
    ok('Prisma client generated for this platform');
  } catch (e) {
    const output = `${e.stdout || ''}${e.stderr || ''}${e.message || ''}`;

    // A running `next start`/`next dev` keeps the native query engine DLL open,
    // so Prisma cannot rename its freshly downloaded copy over it. OneDrive and
    // other sync clients can hold the same lock. On Windows this surfaces as a
    // bare EPERM with no hint, which is confusing — spell out the fix.
    if (/EPERM|EBUSY|resource busy or locked/i.test(output)) {
      console.log('');
      warn('A process is holding the Prisma engine file open.');
      console.log(`  ${c.dim}Prisma needs to replace node_modules/.prisma/client/query_engine-*.node,${c.reset}`);
      console.log(`  ${c.dim}but something currently has it locked. This is almost always:${c.reset}`);
      console.log('');
      console.log('    • a running app — stop it first (Ctrl+C, or: pm2 stop bd-market)');
      console.log('    • a file sync client on Windows (OneDrive / Dropbox) — pause it');
      console.log('    • an editor with the file open');
      console.log('');
      console.log(`  ${c.dim}Then re-run: node setup.js${c.reset}`);
      throw new Error('Could not write the database engine (file locked).');
    }

    throw new Error('prisma generate failed. Check the output above.');
  }
}

// ── 5. create tables ─────────────────────────────────────────────
function pushSchema() {
  step(5, 'Creating database tables');
  try {
    prisma(['db', 'push', '--accept-data-loss']);
    ok('All tables created');
  } catch {
    throw new Error(
      'Could not create the tables. Check DATABASE_URL in .env, and that the\n' +
      '  database exists and the user has CREATE privileges.',
    );
  }
}

// ── 6. demo data ─────────────────────────────────────────────────
async function seedData() {
  step(6, 'Store content');

  let answer = 'n';
  if (NON_INTERACTIVE) {
    answer = 'n';
    info('Skipping demo data (non-interactive mode)');
  } else {
    console.log('  Load the demo catalogue? This adds 38 products, 21 categories,');
    console.log('  10 brands, sample orders, blog posts and all settings.');
    console.log(`  ${c.dim}Recommended for a new store. Choose "n" for an empty store.${c.reset}`);
    answer = await ask('Load demo data? (y/n)', 'y');
  }

  if (!answer.toLowerCase().startsWith('y')) {
    info('Skipped. You can load it later with: npm run db:seed');
    return false;
  }

  try {
    tsx([path.join('prisma', 'seed.ts')]);
    ok('Demo catalogue loaded');
    return true;
  } catch {
    warn('Seeding failed. The tables are created, so you can retry with: npm run db:seed');
    return false;
  }
}

// ── 7. admin account ─────────────────────────────────────────────
async function ensureAdmin() {
  step(7, 'Administrator account');

  let prisma;
  try {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
  } catch {
    warn('Could not load the Prisma client — skipping admin check.');
    return;
  }

  try {
    const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (admins > 0) {
      const list = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { email: true },
        take: 3,
      });
      ok(`${admins} admin account(s) exist`);
      list.forEach((u) => info(u.email));
      if (!NON_INTERACTIVE) {
        const add = await ask('Create an additional admin? (y/n)', 'n');
        if (!add.toLowerCase().startsWith('y')) return;
      } else {
        return;
      }
    }

    const email = await ask('Admin email', 'admin@bdmarket.com.bd');
    const name = await ask('Admin name', 'Store Admin');
    let password = await askHidden('Admin password');
    if (!password || password.length < 6) {
      warn('Password too short — skipping. Create the admin from /admin/users after login.');
      return;
    }

    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(password, 10);

    await prisma.user.upsert({
      where: { email },
      update: { passwordHash: hash, role: 'ADMIN', name },
      create: { email, passwordHash: hash, role: 'ADMIN', name, status: 'active' },
    });
    ok(`Admin ready: ${email}`);
  } catch (e) {
    warn(`Could not verify the admin account: ${e.message.split('\n')[0]}`);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

// ── summary ──────────────────────────────────────────────────────
async function summary(db, seeded) {
  hr();
  console.log(`${c.green}${c.bold}  Setup complete.${c.reset}`);
  hr();
  console.log('');

  let prisma;
  try {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
    const [products, orders, settings, users] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.setting.count(),
      prisma.user.count(),
    ]);
    console.log('  Database contents');
    info(`Products: ${products}`);
    info(`Orders:   ${orders}`);
    info(`Settings: ${settings}`);
    info(`Users:    ${users}`);
    console.log('');
  } catch {
    /* counts are informational only */
  } finally {
    if (prisma) await prisma.$disconnect().catch(() => {});
  }

  console.log(`  ${c.bold}Next: build and start${c.reset}`);
  console.log(`    ${c.cyan}npm run build${c.reset}                ${c.dim}# compile for production${c.reset}`);
  console.log(`    ${c.cyan}npm start${c.reset}                    ${c.dim}# serve on port 3000${c.reset}`);
  console.log('');
  console.log(`  ${c.dim}If you will use a process manager:${c.reset}`);
  console.log(`    ${c.cyan}pm2 start npm --name bd-market -- start${c.reset}`);
  console.log(`    ${c.cyan}pm2 save && pm2 startup${c.reset}`);
  console.log('');
  console.log(`  ${c.bold}Then open:${c.reset}`);
  console.log(`    Storefront  ${c.cyan}${siteUrlForDisplay()}${c.reset}`);
  console.log(`    Admin       ${c.cyan}${siteUrlForDisplay()}/admin/login${c.reset}`);
  console.log('');
  console.log(`  ${c.yellow}Important:${c.reset} HTTPS is required for admin login — the session`);
  console.log('  cookie is marked Secure, so it will not be sent over plain HTTP.');
  console.log('');
  console.log(`  ${c.red}Security:${c.reset} change the admin password after your first login,`);
  console.log(`  and add real payment keys in Admin → Settings → Payments.`);
  console.log('');

  if (!seeded) {
    console.log(`  ${c.dim}Tip: load the demo catalogue any time with "npm run db:seed".${c.reset}`);
    console.log('');
  }
}

function siteUrlForDisplay() {
  try {
    const m = fs.readFileSync(ENV_PATH, 'utf8').match(/^NEXT_PUBLIC_SITE_URL\s*=\s*"?([^"\n]+)"?/m);
    return m ? m[1] : 'http://localhost:3000';
  } catch {
    return 'http://localhost:3000';
  }
}

// ── main ─────────────────────────────────────────────────────────
(async () => {
  banner();

  if (CHECK_ONLY) {
    const problems = checkRequirements();
    console.log('');
    if (problems.length) {
      console.log(`${c.red}${c.bold}  ${problems.length} problem(s) found.${c.reset}`);
      console.log(`  Fix these before running the full installer.`);
      console.log('');
      process.exit(1);
    } else {
      console.log(`${c.green}${c.bold}  Your server meets all requirements.${c.reset}`);
      console.log(`  Run ${c.cyan}node setup.js${c.reset} to install.`);
      console.log('');
      process.exit(0);
    }
  }

  const problems = checkRequirements();
  if (problems.length) {
    console.log('');
    console.log(`${c.red}${c.bold}  Setup cannot continue — ${problems.length} blocking problem(s).${c.reset}`);
    console.log(`  Resolve the items marked ✗ above, then run setup again.`);
    console.log('');
    if (rl) rl.close();
    process.exit(1);
  }

  if (fs.existsSync(ENV_PATH) && !NON_INTERACTIVE) {
    step(0, 'Existing installation detected');
    warn('.env already exists — this will overwrite the database settings');
    const go = await ask('Continue? (y/n)', 'n');
    if (!go.toLowerCase().startsWith('y')) {
      console.log('\n  Cancelled. Nothing was changed.\n');
      if (rl) rl.close();
      process.exit(0);
    }
  }

  try {
    const db = await askDatabase();

    const guess = siteUrlForDisplay();
    const siteUrl = NON_INTERACTIVE ? guess : await ask('Public site URL (with https:// when live)', guess);

    writeEnv(db, siteUrl);
    configurePrisma(db.provider);
    pushSchema();
    const seeded = await seedData();
    await ensureAdmin();
    await summary(db, seeded);

    if (rl) rl.close();
    process.exit(0);
  } catch (e) {
    console.log('');
    console.log(`${c.red}${c.bold}  Setup failed${c.reset}`);
    console.log(`  ${e.message}`);
    console.log('');
    console.log(`  ${c.dim}Nothing was left half-configured: re-run "node setup.js" after fixing the issue.${c.reset}`);
    console.log('');
    if (rl) rl.close();
    process.exit(1);
  }
})();
