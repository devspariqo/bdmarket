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
