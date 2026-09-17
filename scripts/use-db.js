#!/usr/bin/env node
/**
 * Switches the Prisma datasource between SQLite / PostgreSQL / MySQL.
 *
 *   node scripts/use-db.js sqlite      (default — local development)
 *   node scripts/use-db.js postgres    (Vercel, Neon, Supabase, Railway, VPS)
 *   node scripts/use-db.js mysql       (cPanel, most shared hosts, VPS)
 *
 * It rewrites the `datasource db` provider in prisma/schema.prisma and keeps a
 * matching `binaryTargets` list. Your data is NOT touched — this only edits the schema.
 *
 * After switching, run:
 *   npx prisma generate
 *   npx prisma db push        (or `npx prisma migrate deploy` in production)
 */

const fs = require('fs');
const path = require('path');

const SCHEMA = path.join(__dirname, '..', 'prisma', 'schema.prisma');

/**
 * Columns that carry an explicit MySQL native type.
 *
 * Prisma maps a plain `String` to VARCHAR(191) on MySQL and silently truncates
 * anything longer. SQLite does not enforce the limit, so the failure is invisible
 * in local development and appears only in production — long values come back
 * cut to 191 characters, and when the value is JSON it no longer parses and the
 * UI renders empty. `Menu.items`, `Setting.value` and `Product.images` all failed
 * that way.
 *
 * SQLite rejects the annotation outright ("Native type Text is not supported for
 * sqlite connector"), so it has to be removed for that provider and restored for
 * the others. See scripts/gen-column-types.js.
 */
let COLUMN_TYPES = {};
try {
  COLUMN_TYPES = require('./column-types');
} catch {
  /* not generated yet — the schema is then used exactly as written */
}

/**
 * Apply or remove the native type annotations for the chosen provider.
 *
 * SQLite takes the plain form; MySQL and Postgres take the annotated one.
 */
function syncColumnTypes(src, provider) {
  const strip = provider === 'sqlite';

  if (strip) {
    /**
     * Refuse to strip an annotation the list cannot put back.
     *
     * Stripping is a regex sweep, but restoring reads COLUMN_TYPES — so anything
     * annotated after that list was last generated would be removed here and
     * never restored. Switching to SQLite and back would then leave the column as
     * VARCHAR(191), which on MySQL truncates long values and, when they are JSON,
     * makes the UI render empty. That is exactly what happened to
     * `LandingPage.blocks`, and it is silent until a page goes blank in
     * production. Failing loudly here costs one command.
     */
    const missing = [];
    let model = null;
    for (const line of src.split('\n')) {
      const m = line.match(/^model\s+(\w+)\s*\{/);
      if (m) {
        model = m[1];
        continue;
      }
      if (/^\}/.test(line)) {
        model = null;
        continue;
      }
      if (!model) continue;
      const f = line.match(/^\s+(\w+)\s+String\??\s+@db\.(?:Text|LongText)/);
      if (!f) continue;
      if (!COLUMN_TYPES[model] || !COLUMN_TYPES[model][f[1]]) {
        missing.push(`${model}.${f[1]}`);
      }
    }

    if (missing.length) {
      console.error(
        `Refusing to switch to SQLite: these columns carry a native type that\n` +
          `scripts/column-types.js does not know about, so it could not be restored:\n\n  ` +
          missing.join('\n  ') +
          `\n\nRun  npm run db:column-types  to refresh the list from the schema, then try again.`
      );
      process.exit(1);
    }

    // Drop the annotation but keep any trailing comment where it is.
    return src.replace(/(\bString\??)\s+@db\.(?:Text|LongText)\b/g, '$1');
  }

  // Re-apply from the list. Walk model blocks so a field name that appears in
  // two models cannot be annotated in the wrong one.
  const lines = src.split('\n');
  let model = null;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^model\s+(\w+)\s*\{/);
    if (m) {
      model = m[1];
      continue;
    }
    if (/^\}/.test(lines[i])) {
      model = null;
      continue;
    }
    if (!model || !COLUMN_TYPES[model]) continue;
    if (lines[i].includes('@db.')) continue;

    const field = lines[i].match(/^(\s+)(\w+)(\s+)String(\??)(.*)$/);
    if (!field) continue;
    const [, indent, name, gap, optional, rest] = field;
    const type = COLUMN_TYPES[model][name];
    if (!type) continue;

    const commentIdx = rest.indexOf('//');
    const attrs = (commentIdx >= 0 ? rest.slice(0, commentIdx) : rest).replace(/\s+$/, '');
    const comment = commentIdx >= 0 ? ' ' + rest.slice(commentIdx) : '';
    lines[i] = `${indent}${name}${gap}String${optional} ${type}${attrs}${comment}`;
  }
  return lines.join('\n');
}

const PROVIDERS = {
  sqlite: {
    provider: 'sqlite',
    // Only the container's native engine plus the standard Linux ones.
    binaryTargets: ['native', 'debian-openssl-3.0.x', 'debian-openssl-1.1.x', 'linux-musl-openssl-3.0.x'],
    example: 'file:./dev.db',
  },
  postgres: {
    provider: 'postgresql',
    // "native" covers local + most Linux hosts; rhel-openssl-3.0.x is required by Vercel/Netlify.
    binaryTargets: [
      'native',
      'debian-openssl-3.0.x',
      'debian-openssl-1.1.x',
      'linux-musl-openssl-3.0.x',
      'rhel-openssl-3.0.x',
    ],
    example: 'postgresql://user:password@host:5432/bdmarket?sslmode=require',
  },
  mysql: {
    provider: 'mysql',
    binaryTargets: ['native', 'debian-openssl-3.0.x', 'debian-openssl-1.1.x', 'linux-musl-openssl-3.0.x'],
    example: 'mysql://user:password@host:3306/bdmarket',
  },
};

const target = (process.argv[2] || '').toLowerCase();
if (!PROVIDERS[target]) {
  console.error(`Usage: node scripts/use-db.js <${Object.keys(PROVIDERS).join('|')}>`);
  process.exit(1);
}

if (!fs.existsSync(SCHEMA)) {
  console.error(`Schema not found at ${SCHEMA}`);
  process.exit(1);
}

const cfg = PROVIDERS[target];
let src = fs.readFileSync(SCHEMA, 'utf8');
const before = src;

// 1. Replace the generator block
src = src.replace(
  /generator client \{[\s\S]*?\n\}/,
  `generator client {
  provider = "prisma-client-js"
  // Generated for every platform this project may build or run on, so a local
  // build can be deployed to Linux without "Query engine library not found".
  binaryTargets = [${cfg.binaryTargets.map((t) => `"${t}"`).join(', ')}]
}`,
);

// 2. Replace the datasource block
src = src.replace(
  /datasource db \{[\s\S]*?\n\}/,
  `datasource db {
  provider = "${cfg.provider}"
  url      = env("DATABASE_URL")
}`,
);

// 3. Keep the column types valid for this provider
src = syncColumnTypes(src, cfg.provider);

if (src === before) {
  console.log(`Schema already set to ${cfg.provider} — nothing to change.`);
  process.exit(0);
}

fs.writeFileSync(SCHEMA, src);

console.log(`✓ Switched prisma/schema.prisma to "${cfg.provider}"`);
console.log('');
console.log('Next steps:');
console.log('  1. Set DATABASE_URL in .env, e.g.');
console.log(`       DATABASE_URL="${cfg.example}"`);
console.log('  2. npx prisma generate');
console.log('  3. npx prisma db push          # create the tables');
console.log('     npm run db:seed             # optional: load demo data');
console.log('  4. npm run build');
if (target !== 'sqlite') {
  console.log('');
  console.log('Note: switching between providers does NOT migrate existing rows.');
  console.log('      On SQLite the file prisma/dev.db still holds your current data.');
}
