#!/usr/bin/env node
/**
 * Guided MySQL setup for Hostinger (and any other MySQL host).
 *
 *   node scripts/setup-db.js
 *
 * Asks for the four values hPanel shows you, builds the connection string with
 * the password correctly encoded, proves the connection actually works, and
 * offers to create the tables. Writes the result to .env on request.
 *
 * The fiddly parts this removes:
 *   - Hostinger needs 127.0.0.1, not localhost, for Node.js apps. Node resolves
 *     localhost to the IPv6 loopback ::1, which the database user is not
 *     granted for, and the connection is refused.
 *   - Database names and usernames are prefixed with your Hostinger account ID,
 *     which is easy to mistype.
 *   - Special characters in the password must be percent-encoded.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ENV_PATH = path.join(__dirname, '..', '.env');

/**
 * Input handling for both an interactive terminal and piped/scripted input.
 *
 * readline's `question()` does not deliver answers when stdin is a pipe in some
 * environments (observed on Node 22 + Git Bash on Windows) — the first prompt is
 * answered and the second hangs. So when stdin is not a TTY the whole stream is
 * read up-front and answers are popped from a queue. Interactive use is
 * unaffected and still goes through readline.
 */
let piped = null;
let pipedIndex = 0;
if (!process.stdin.isTTY) {
  try {
    piped = fs.readFileSync(0, 'utf8').split(/\r?\n/);
  } catch {
    piped = [];
  }
}

const rl = piped
  ? null
  : readline.createInterface({ input: process.stdin, output: process.stdout });

// Mute readline's echo while the password is typed.
let muted = false;
if (rl) {
  const passthrough = rl._writeToOutput.bind(rl);
  rl._writeToOutput = (str) => {
    if (!muted) passthrough(str);
  };
}

function ask(question, defaultValue) {
  const suffix = defaultValue ? ` [${defaultValue}]` : '';
  const prompt = `  ${question}${suffix}: `;

  if (piped) {
    const answer = (piped[pipedIndex++] || '').trim();
    // Echo the prompt and the answer so a piped run reads like a real session.
    process.stdout.write(prompt + (answer || '(default)') + '\n');
    return Promise.resolve(answer || defaultValue || '');
  }

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      const value = (answer || '').trim();
      resolve(value || defaultValue || '');
    });
  });
}

/** Ask without echoing the typed value. */
function askHidden(question) {
  const prompt = `  ${question}: `;

  if (piped) {
    const answer = (piped[pipedIndex++] || '').trim();
    process.stdout.write(prompt + (answer ? '(hidden)' : '') + '\n');
    return Promise.resolve(answer);
  }

  return new Promise((resolve) => {
    process.stdout.write(prompt);
    muted = true;
    rl.question('', (answer) => {
      muted = false;
      process.stdout.write('\n');
      resolve((answer || '').trim());
    });
  });
}

function finish() {
  if (rl) rl.close();
}

function buildUrl({ host, port, user, password, database }) {
  return (
    `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}` +
    `@${host}:${port}/${encodeURIComponent(database)}`
  );
}

async function testConnection(url) {
  // Loaded lazily so the script still runs (and can print guidance) on a machine
  // where the client has not been generated yet.
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

/**
 * Pull the meaningful line out of a Prisma error.
 *
 * Prisma wraps its errors in boilerplate that starts with a blank line and
 * "Invalid `prisma.xxx()` invocation:" — taking the first line yields an empty
 * string, and the second is noise. The actual cause is further down.
 */
function firstUsefulLine(error) {
  const lines = String(error)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^Invalid `prisma\./i.test(l))
    .filter((l) => !/^-->/.test(l));
  return lines[0] || 'Unknown error';
}

/** Turn a raw driver error into something actionable. */
function explain(error) {
  if (/Access denied for user '[^']*'@'::1'/i.test(error)) {
    return (
      'The server saw the connection from the IPv6 loopback (::1). Use 127.0.0.1 as the host, ' +
      'not localhost — Node.js resolves localhost to ::1, which the database user is not ' +
      'granted for.'
    );
  }
  if (/Access denied for user/i.test(error)) {
    return 'The username or password is wrong. Check both at Databases → MySQL Users in hPanel.';
  }
  if (/Unknown database/i.test(error)) {
    return (
      'The server is reachable but that database does not exist. Database names on Hostinger are ' +
      'prefixed with your account ID — copy the exact name from Databases → MySQL Databases.'
    );
  }
  // Prisma words this as "Can't reach database server at `host:port`" rather than
  // exposing ECONNREFUSED, so match the phrasing as well as the errno codes.
  if (/Can't reach database server|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|getaddrinfo|P1001/i.test(error)) {
    return (
      'Could not reach the host. Use 127.0.0.1 (not localhost) on port 3306. If you are ' +
      'connecting from outside Hostinger, Remote MySQL must be enabled for your IP first — ' +
      'databases are localhost-only by default.'
    );
  }
  if (/Authentication plugin|caching_sha2_password/i.test(error)) {
    return "A MySQL authentication plugin mismatch. Change the user's password in hPanel once, then retry.";
  }
  if (/timed out|timeout/i.test(error)) {
    return 'The connection timed out. Confirm the host is 127.0.0.1 and that Remote MySQL allows your IP.';
  }
  return null;
}

async function main() {
  console.log('');
  console.log('  ── MySQL setup ────────────────────────────────────────────');
  console.log('  Create the database first, in hPanel:');
  console.log('    Websites → Dashboard → Databases → MySQL Databases → Create database');
  console.log('  A database user is created automatically with the same name.');
  console.log('');

  const host = await ask('Database host', '127.0.0.1');
  const port = await ask('Port', '3306');
  const database = await ask('Database name (e.g. u123456789_bdmarket)');
  const user = await ask('Database username', database);
  const password = await askHidden('Database password');

  if (!database || !user || !password) {
    console.log('\n  Database name, username and password are all required.\n');
    finish();
    process.exit(1);
  }

  if (host === 'localhost') {
    console.log('');
    console.log('  Note: you entered "localhost". For a Node.js app Hostinger requires');
    console.log('  127.0.0.1 — localhost resolves to the IPv6 loopback, which the database');
    console.log('  user is not granted for. Using 127.0.0.1 instead.');
  }
  const finalHost = host === 'localhost' ? '127.0.0.1' : host;

  const url = buildUrl({ host: finalHost, port, user, password, database });

  console.log('');
  console.log('  Connection string (password masked):');
  console.log('  ' + url.replace(/:([^:@]+)@/, ':' + '*'.repeat(8) + '@'));
  console.log('');

  const encoded = password !== encodeURIComponent(password);
  if (encoded) {
    console.log('  The password contains characters that needed encoding — handled for you.');
    console.log('');
  }

  console.log('  Testing the connection…');
  const result = await testConnection(url);

  if (!result.ok) {
    console.log('');
    console.log('  ✗ Could not connect.');
    const hint = explain(result.error || '');
    console.log('    ' + (hint || firstUsefulLine(result.error || '')));
    console.log('');
    console.log('  Nothing was changed. Fix the value above and run this again.');
    console.log('');
    finish();
    process.exit(1);
  }

  console.log('  ✓ Connected successfully.');
  console.log('');

  const save = await ask('Write this to .env as DATABASE_URL? (y/n)', 'y');
  if (/^y/i.test(save)) {
    let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
    const line = `DATABASE_URL="${url}"`;

    if (/^\s*DATABASE_URL\s*=/m.test(content)) {
      content = content.replace(/^\s*DATABASE_URL\s*=.*$/m, line);
    } else {
      content = (content.trim() ? content.replace(/\s*$/, '\n') : '') + line + '\n';
    }

    // .env is gitignored, but keep a sensible header on a fresh file.
    if (!content.includes('# BD Market')) {
      content = '# BD Market — local environment\n' + content;
    }

    fs.writeFileSync(ENV_PATH, content);
    console.log('  ✓ Written to .env');
  }

  console.log('');
  console.log('  Next: create the tables');
  console.log('    npx prisma db push');
  console.log('    npm run db:seed        # optional demo catalogue');
  console.log('');
  console.log('  For the deployed app, set the same DATABASE_URL in');
  console.log('  hPanel → your website dashboard → Environment variables.');
  console.log('');

  finish();
}

main().catch((err) => {
  console.error('\n  Unexpected error:', err.message);
  finish();
  process.exit(1);
});
