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

// 8. Let the platform parser have a go, and surface its verdict.
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
