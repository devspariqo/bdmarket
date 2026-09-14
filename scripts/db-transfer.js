#!/usr/bin/env node
/**
 * Exports every table to a single JSON file, or imports it into another database.
 *
 *   node scripts/db-transfer.js export  backup.json
 *   node scripts/db-transfer.js import  backup.json
 *
 * Use this to move your seeded catalogue, orders and settings from local SQLite
 * to a production PostgreSQL / MySQL database.
 *
 * IMPORTANT: run `npx prisma db push` against the TARGET database first so the
 * tables exist. Record ids are preserved, and rows are inserted in dependency
 * order so foreign keys stay valid.
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Insert order matters: parents before children, so foreign keys resolve.
 * A single self-referencing table (Category.parentId) is handled after the first pass.
 */
const ORDER = [
  'setting',
  'user',
  'customer',
  'address',
  'taxRate',
  'shippingZone',
  'paymentMethod',
  'brand',
  'category', // self-referencing — second pass fixes parentId
  'coupon',
  'product',
  'page',
  'post',
  'menu',
  'banner',
  'media',
  'cart',
  'cartItem',
  'wishlist',
  'order',
  'orderItem',
  'orderEvent',
  'review',
  'pageView',
  'searchQuery',
  'newsletter',
  'auditLog',
];

/** Models that are not part of the app's own data. */
const SKIP = new Set(['$queryRaw', '$executeRaw']);

/**
 * `skipDuplicates` is only supported by PostgreSQL, MySQL and SQL Server.
 * SQLite rejects it with a validation error, so we detect the provider and
 * fall back to plain createMany (the target is normally empty anyway).
 */
function supportsSkipDuplicates() {
  const url = process.env.DATABASE_URL || '';
  return /^(postgres|postgresql|mysql)/.test(url) || url.startsWith('prisma+postgres');
}

function modelKeys() {
  return Object.keys(prisma).filter((k) => {
    if (SKIP.has(k)) return false;
    if (k.startsWith('$') || k.startsWith('_')) return false;
    const v = prisma[k];
    return v && typeof v.findMany === 'function';
  });
}

async function exportAll(file) {
  const present = modelKeys();
  const ordered = [
    ...ORDER.filter((m) => present.includes(m)),
    ...present.filter((m) => !ORDER.includes(m)),
  ];

  const dump = { __meta: { exportedAt: new Date().toISOString(), provider: process.env.DATABASE_URL?.split(':')[0] || 'unknown' }, tables: {} };
  let total = 0;

  for (const model of ordered) {
    const rows = await prisma[model].findMany();
    dump.tables[model] = rows;
    total += rows.length;
    if (rows.length) console.log(`  ${model.padEnd(16)} ${rows.length}`);
  }

  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(dump, null, 2));

  console.log('');
  console.log(`✓ Exported ${total} rows from ${ordered.length} tables → ${file}`);
}

async function importAll(file) {
  if (!fs.existsSync(file)) {
    console.error(`File not found: ${file}`);
    process.exit(1);
  }

  const dump = JSON.parse(fs.readFileSync(file, 'utf8'));
  const present = modelKeys();
  const tables = Object.keys(dump.tables || {});

  const ordered = [
    ...ORDER.filter((m) => tables.includes(m) && present.includes(m)),
    ...tables.filter((m) => !ORDER.includes(m) && present.includes(m)),
  ];

  let total = 0;
  const failed = [];

  for (const model of ordered) {
    const rows = dump.tables[model] || [];
    if (!rows.length) continue;

    // Convert ISO date strings back into Date objects.
    const prepared = rows.map((row) => {
      const out = {};
      for (const [k, v] of Object.entries(row)) {
        if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
          out[k] = new Date(v);
        } else {
          out[k] = v;
        }
      }
      return out;
    });

    try {
      const canSkip = supportsSkipDuplicates();
      const res = await prisma[model].createMany({
        data: prepared,
        ...(canSkip ? { skipDuplicates: true } : {}),
      });
      total += res.count;
      console.log(`  ${model.padEnd(16)} ${res.count}/${rows.length}`);
    } catch (e) {
      // Fall back to row-by-row so one bad record cannot lose a whole table.
      let ok = 0;
      for (const row of prepared) {
        try {
          await prisma[model].create({ data: row });
          ok++;
        } catch {
          /* skip conflicting row */
        }
      }
      if (ok) {
        total += ok;
        console.log(`  ${model.padEnd(16)} ${ok}/${rows.length}  (row-by-row)`);
      } else {
        failed.push(model);
        const msg = (e.message || '').split('\n').filter(Boolean).pop() || String(e);
        console.log(`  ${model.padEnd(16)} FAILED — ${msg.slice(0, 90)}`);
      }
    }
  }

  // Second pass: Category.parentId now that all categories exist.
  if (tables.includes('category') && !failed.includes('category')) {
    const cats = dump.tables.category || [];
    let fixed = 0;
    for (const c of cats) {
      if (c.parentId) {
        try {
          await prisma.category.update({ where: { id: c.id }, data: { parentId: c.parentId } });
          fixed++;
        } catch {
          /* parent missing — leave null */
        }
      }
    }
    if (fixed) console.log(`  ${'(category parents)'.padEnd(16)} ${fixed} linked`);
  }

  console.log('');
  console.log(`✓ Imported ${total} rows`);
  if (failed.length) {
    console.log(`⚠ Failed tables: ${failed.join(', ')}`);
    process.exitCode = 1;
  }
}

const [, , action, file] = process.argv;

if (!action || !file) {
  console.error('Usage:');
  console.error('  node scripts/db-transfer.js export backup.json');
  console.error('  node scripts/db-transfer.js import backup.json');
  process.exit(1);
}

(async () => {
  try {
    if (action === 'export') await exportAll(file);
    else if (action === 'import') await importAll(file);
    else {
      console.error(`Unknown action "${action}". Use "export" or "import".`);
      process.exitCode = 1;
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
