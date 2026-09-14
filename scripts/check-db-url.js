#!/usr/bin/env node
/**
 * Validates a DATABASE_URL and diagnoses the most common paste errors.
 *
 *   node scripts/check-db-url.js                        # reads .env
 *   node scripts/check-db-url.js "postgresql://..."     # checks a value
 *   node scripts/check-db-url.js --encode 'my@pass#1'   # percent-encodes a password
 *
 * Prisma reports a malformed URL as the unhelpful
 *   "invalid domain character in database URL"
 * which is almost always an unencoded character in the *password* rather than
 * anything wrong with the host. This prints the actual problem.
 *
 * The password is never printed in full — only its length and a masked form.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

/**
 * --build mode: assemble a correct URL from its parts.
 *
 *   node scripts/check-db-url.js --build \
 *     --host aws-0-ap-south-1.pooler.supabase.com \
 *     --user postgres.abcdefghijkl \
 *     --password 'Romen#dev4564' \
 *     --db postgres
 *
 * The password is percent-encoded for you, which is the part people most often
 * get wrong — base64 is a common mistake and is NOT valid in a URL.
 */
if (args[0] === '--build') {
  const flags = {};
  for (let i = 1; i < args.length; i += 2) {
    const key = (args[i] || '').replace(/^--/, '');
    flags[key] = args[i + 1];
  }

  const missing = ['host', 'user', 'password'].filter((k) => !flags[k]);
  if (missing.length) {
    console.error('\n  Missing required value(s): ' + missing.map((m) => '--' + m).join(', '));
    console.error('\n  Usage:');
    console.error('    node scripts/check-db-url.js --build \\');
    console.error('      --host aws-0-ap-south-1.pooler.supabase.com \\');
    console.error('      --user postgres.abcdefghijkl \\');
    console.error("      --password 'your-password' \\");
    console.error('      --db postgres            # optional, defaults to postgres');
    console.error('      --port 6543              # optional; 6543 adds ?pgbouncer=true');
    console.error('');
    process.exit(1);
  }

  const db = flags.db || 'postgres';
  const port = flags.port || '5432';
  const user = encodeURIComponent(flags.user);
  const password = encodeURIComponent(flags.password);
  const needsPgbouncer = port === '6543';

  const url =
    `postgresql://${user}:${password}@${flags.host}:${port}/${db}` +
    (needsPgbouncer ? '?pgbouncer=true' : '');

  console.log('');
  console.log('  DATABASE_URL');
  console.log('  ' + url);
  console.log('');
  if (flags.password !== password) {
    console.log('  The password was percent-encoded:');
    console.log('    ' + flags.password.replace(/./g, '*') + `  (${flags.password.length} chars)`);
    console.log('    -> ' + password);
    console.log('');
  }
  if (needsPgbouncer) {
    console.log('  Port 6543 is the transaction pooler, so ?pgbouncer=true was added.');
    console.log('  This URL is for the running app. For `prisma db push`, use port 5432');
    console.log('  with no ?pgbouncer=true instead.');
    console.log('');
  }
  console.log('  Paste it into your host\'s environment variables as DATABASE_URL.');
  console.log('  Then check it with:  npm run db:check-url "<the url>"');
  console.log('');
  process.exit(0);
}

// ── --encode mode ──
if (args[0] === '--encode') {
  const raw = args[1];
  if (!raw) {
    console.error('Usage: node scripts/check-db-url.js --encode \'your-password\'');
    process.exit(1);
  }
  const encoded = encodeURIComponent(raw);
  console.log('');
  console.log('  raw     : ' + raw.replace(/./g, '*') + `  (${raw.length} chars)`);
  console.log('  encoded : ' + encoded);
  console.log('');
  console.log('  Use the ENCODED value inside the URL:');
  console.log(`  DATABASE_URL="postgresql://user:${encoded}@host:5432/dbname"`);
  console.log('');
  process.exit(0);
}

function mask(url) {
  // Hide the password but keep everything else readable.
  return url.replace(/(:\/\/[^:/@]+:)([^@]*)(@)/, (_, a, pw, c) => a + '*'.repeat(Math.min(pw.length, 8)) + c);
}

function readFromEnv() {
  const p = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(p)) return null;
  const line = fs
    .readFileSync(p, 'utf8')
    .split(/\r?\n/)
    .find((l) => /^\s*DATABASE_URL\s*=/.test(l));
  if (!line) return null;
  return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
}

const raw = args[0] || readFromEnv();

if (!raw) {
  console.error('\n  No DATABASE_URL found in .env and none passed as an argument.\n');
  process.exit(1);
}

const problems = [];

// 1. Surrounding quotes. Some hosts store the value verbatim, so a quoted value
//    arrives with the quote characters included and becomes part of the host.
if (/^["']/.test(raw) || /["']$/.test(raw)) {
  problems.push({
    what: 'The value is wrapped in quote characters',
    fix: 'Set the variable to the bare URL. Quotes belong in a .env file, not in a hosting dashboard field.',
  });
}

// 2. Leftover placeholder brackets — Supabase's dashboard shows [YOUR-PASSWORD].
if (/[[\]]/.test(raw)) {
  problems.push({
    what: 'The value still contains square brackets',
    fix: 'Replace the placeholder (e.g. [YOUR-PASSWORD]) with the real password. Square brackets are not valid in a hostname.',
  });
}

// 3. Whitespace / newlines from a wrapped paste.
if (/\s/.test(raw)) {
  problems.push({
    what: 'The value contains a space or newline',
    fix: 'Re-paste it as a single unbroken line.',
  });
}

// 4. Unencoded '@' in the password. This is the single most common cause:
//    the parser splits on the LAST '@', so "user:p@ss@host" makes "ss@host"
//    the hostname and the domain check fails.
const atCount = (raw.match(/@/g) || []).length;
if (atCount > 1) {
  problems.push({
    what: `The value contains ${atCount} '@' characters — the password almost certainly has an unencoded '@'`,
    fix: 'Percent-encode the password: node scripts/check-db-url.js --encode \'your-password\'',
  });
} else if (atCount === 0) {
  problems.push({
    what: 'No "@" separating the credentials from the host',
    fix: 'Expected the form scheme://user:password@host:port/database',
  });
}

// 5. Unencoded '#' — everything after it becomes a URL fragment, so the host is lost.
if (raw.includes('#')) {
  problems.push({
    what: "The value contains '#'",
    fix: "An unencoded '#' starts a fragment. Percent-encode it as %23 in the password.",
  });
}

// 6. Unencoded '/' in the password adds a path segment.
const afterScheme = raw.replace(/^[a-z+]+:\/\//i, '');
const beforeHost = afterScheme.split('@')[0] || '';
if ((beforeHost.match(/\//g) || []).length > 0) {
  problems.push({
    what: "The credentials section contains a '/'",
    fix: "Percent-encode '/' as %2F in the password.",
  });
}

// 7. Scheme check.
const scheme = (raw.match(/^([a-z+]+):\/\//i) || [])[1];
if (!scheme) {
  problems.push({
    what: 'No scheme at the start',
    fix: 'The URL must begin with postgresql:// (or mysql://, or file: for SQLite).',
  });
} else if (!/^(postgres|postgresql|mysql|file)$/i.test(scheme)) {
  problems.push({
    what: `Unrecognised scheme "${scheme}:"`,
    fix: 'Use postgresql:// for Postgres, mysql:// for MySQL, or file: for SQLite.',
  });
}

// 8. Placeholder values left in place. A URL like
//      postgresql://user:pw@host:5432/db
// parses perfectly, so it fails later as "host could not be reached" — which
// points at the network rather than at the template nobody finished editing.
const PLACEHOLDER_HOSTS = /^(host|your[-_]?host|hostname|db|database|server|example\.com|yourdomain\.com|xxx+|<host>|\[host\])$/i;
const PLACEHOLDER_USERS = /^(user|username|your[-_]?user|dbuser|<user>|\[user\])$/i;
const PLACEHOLDER_DBS = /^(dbname|database|your[-_]?db|<db>|\[db\])$/i;

let hostGuess = '';
let userGuess = '';
try {
  const u = new URL(raw.replace(/\s/g, ''));
  hostGuess = u.hostname;
  userGuess = decodeURIComponent(u.username || '');
} catch {
  /* the parse check below reports this properly */
}

if (hostGuess && PLACEHOLDER_HOSTS.test(hostGuess)) {
  problems.push({
    what: `The host is still the placeholder "${hostGuess}"`,
    fix:
      'Replace it with the real host from your provider\'s connection dialog. For Supabase that ' +
      'is the pooler host (aws-N-REGION.pooler.supabase.com) or db.PROJECT-REF.supabase.co — ' +
      'it cannot be guessed, so copy it from the Connect dialog.',
  });
}

if (userGuess && PLACEHOLDER_USERS.test(userGuess)) {
  problems.push({
    what: `The username is still the placeholder "${userGuess}"`,
    fix:
      'Use the real username. Supabase\'s pooler uses postgres.PROJECT-REF (note the dot); the ' +
      'direct connection uses just postgres.',
  });
}

const dbName = (() => {
  try {
    return new URL(raw.replace(/\s/g, '')).pathname.replace(/^\//, '');
  } catch {
    return '';
  }
})();

if (dbName && PLACEHOLDER_DBS.test(dbName)) {
  problems.push({
    what: `The database name is still the placeholder "${dbName}"`,
    fix: 'Supabase databases are called "postgres" unless you created another one.',
  });
}

// 9. Base64 in the password. Base64 padding ("=" or "==") is the giveaway, and
//    base64 is NOT a valid way to escape a URL password — it mangles the value
//    into something the server rejects. Percent-encoding is what is needed.
//
//    Note: URL.password comes back still percent-encoded, so "==" arrives as
//    "%3D%3D" and must be decoded before the base64 shape is visible.
const rawPassword = (() => {
  try {
    return decodeURIComponent(new URL(raw.replace(/\s/g, '')).password || '');
  } catch {
    return '';
  }
})();
if (rawPassword && /^[A-Za-z0-9+/]{8,}={1,2}$/.test(rawPassword)) {
  let decoded = '';
  try {
    decoded = Buffer.from(rawPassword, 'base64').toString('utf8');
  } catch {
    /* not valid base64 after all */
  }
  const looksLikeText = decoded && /^[\x20-\x7e]+$/.test(decoded);
  problems.push({
    what: 'The password looks base64-encoded (it ends in "=" or "==")',
    fix:
      'Base64 is not valid here — a URL password must be percent-encoded, and base64 changes ' +
      'the value so the server rejects it. Run ' +
      '`npm run db:check-url -- --encode "<your real password>"` to get the correct form.' +
      (looksLikeText
        ? ` The value decodes to ${decoded.length} characters of readable text, which confirms ` +
          'it was base64-encoded rather than left as the literal password.'
        : ''),
  });
}

// 10. Transaction-pooler URLs need ?pgbouncer=true for Prisma. Transaction mode
//    does not support prepared statements, and without the flag Prisma keeps
//    using them and fails at query time with a confusing protocol error.
if (/pooler\.supabase\.com:6543|:6543\//.test(raw) && !/pgbouncer=true/i.test(raw)) {
  problems.push({
    what: 'Port 6543 (transaction pooler) without ?pgbouncer=true',
    fix:
      'Append ?pgbouncer=true to the URL. Transaction mode does not support prepared ' +
      'statements, and Prisma needs that flag to stop using them.',
  });
}

// 9. Warn about the mode that will not work for schema pushes, without treating
//    it as an error — it is the correct choice for the running app.
const isTransactionPooler = /pooler\.supabase\.com:6543/.test(raw);

// 10. Let the platform parser have a go, and surface its verdict.
let parsed = null;
try {
  parsed = new URL(raw);
} catch (err) {
  problems.push({
    what: `Could not parse the URL: ${err.message}`,
    fix: 'Check for unencoded special characters in the password.',
  });
}

// ── Report ──
console.log('');
console.log('  DATABASE_URL (password masked)');
console.log('  ' + mask(raw));
console.log('');
console.log('  length   : ' + raw.length);
console.log('  scheme   : ' + (scheme || '(none)'));

if (parsed) {
  console.log('  host     : ' + parsed.hostname);
  console.log('  port     : ' + (parsed.port || '(default)'));
  console.log('  database : ' + parsed.pathname.replace(/^\//, '') || '(none)');
  const pw = decodeURIComponent(parsed.password || '');
  console.log('  password : ' + (pw ? `${pw.length} characters` : '(none)'));
}
console.log('');

if (!problems.length) {
  console.log('  No problems found — the string parses as a valid URL.');
  console.log('  If Prisma still rejects it, check that the provider in');
  console.log('  prisma/schema.prisma matches the scheme above.');
  if (isTransactionPooler) {
    console.log('');
    console.log('  NOTE: this is a transaction-pooler URL (port 6543), which is the right');
    console.log('  choice for the running app. It cannot run schema changes though — for');
    console.log('  `prisma db push` use the session pooler URL (port 5432) instead.');
  }
  console.log('');
  process.exit(0);
}

console.log('  PROBLEMS FOUND');
console.log('  ' + '-'.repeat(60));
problems.forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.what}`);
  console.log(`     -> ${p.fix}`);
});
console.log('');
process.exit(1);
