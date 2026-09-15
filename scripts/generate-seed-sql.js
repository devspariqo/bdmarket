#!/usr/bin/env node
/**
 * Generates SQL files that can be imported through phpMyAdmin.
 *
 *   node scripts/generate-seed-sql.js
 *
 * Produces two files:
 *   prisma/schema.sql             — DDL only: 27 empty tables
 *   prisma/schema-with-demo.sql   — DDL plus every row from the local demo
 *                                   database, for a populated store in one import
 *
 * Why this exists: Hostinger databases are `localhost`-only, so `prisma db push`
 * from a developer's PC is refused until the IP is allowlisted. phpMyAdmin runs
 * on the server, so importing a file needs no network change at all.
 *
 * Reads the local SQLite database directly with node:sqlite rather than through
 * Prisma — the generated Prisma client targets MySQL now, so it cannot open a
 * SQLite file.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SCHEMA_PRISMA = path.join(ROOT, 'prisma', 'schema.prisma');
const SQLITE_DB = path.join(ROOT, 'prisma', 'dev.db');
const OUT_SCHEMA = path.join(ROOT, 'prisma', 'schema.sql');
const OUT_DEMO = path.join(ROOT, 'prisma', 'schema-with-demo.sql');

/** Tables that hold generated or operational noise, excluded from the demo dump. */
const SKIP_DATA = new Set(['AuditLog', 'SearchQuery', 'PageView']);

// ── 1. Generate the DDL ──────────────────────────────────────────────────────
function generateDdl() {
  // shell:true is required on Windows — Node 22 refuses to spawn .cmd shims
  // directly (EINVAL) since the CVE-2024-27980 fix. Arguments are all static.
  const sql = execFileSync(
    'npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script',
    {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      shell: true,
    }
  );
  return sql;
}

/**
 * Map table -> { column: MYSQL_TYPE } by parsing the DDL.
 *
 * The target types matter, not the SQLite ones: DateTime is an epoch integer in
 * SQLite but a DATETIME(3) in MySQL, and the conversion depends on knowing that.
 *
 * Column lines are identified structurally — they are the only lines that begin
 * with a backtick-quoted name followed by a type. Constraint lines begin with a
 * bare keyword (`PRIMARY KEY ...`, `UNIQUE INDEX ...`), so they never match.
 *
 * Do NOT filter by column name here. An earlier version skipped any column
 * called `key` to avoid constraint lines, which silently dropped the real
 * `Setting.key` column — the INSERT then omitted it and every row got the
 * default '', so the second row failed with
 *   #1062 - Duplicate entry '' for key 'Setting_key_key'
 */
function parseColumnTypes(ddl) {
  const tables = {};
  const tableRe = /CREATE TABLE `([^`]+)` \(([\s\S]*?)\n\)/g;
  let m;
  while ((m = tableRe.exec(ddl))) {
    const cols = {};
    for (const line of m[2].split('\n')) {
      const cm = line.match(/^\s*`([^`]+)`\s+([A-Za-z0-9(),]+)/);
      if (cm) cols[cm[1]] = cm[2].toUpperCase();
    }
    tables[m[1]] = cols;
  }
  return tables;
}

/**
 * Cross-check the parsed columns against the DDL, so a parser that silently
 * drops a column is caught before it produces an INSERT missing that column.
 * Returns a list of problems; empty means the parse is complete.
 */
function auditParsedColumns(ddl, columnTypes) {
  const problems = [];

  const declared = (ddl.match(/^\s+`[^`]+`\s+[A-Za-z0-9(),]+/gm) || []).length;
  const parsed = Object.values(columnTypes).reduce(
    (n, cols) => n + Object.keys(cols).length,
    0
  );

  if (declared !== parsed) {
    problems.push(
      `parsed ${parsed} columns but the DDL declares ${declared} — ` +
        'some column is being dropped by the parser'
    );
  }

  return problems;
}

/** Quote a JavaScript value as a MySQL literal. */
function toLiteral(value, mysqlType) {
  if (value === null || value === undefined) return 'NULL';

  if (mysqlType && mysqlType.startsWith('DATETIME')) {
    const ms = typeof value === 'number' ? value : Date.parse(String(value));
    if (!Number.isNaN(ms)) {
      // Prisma stores DateTime as UTC; keep it UTC so reads round-trip.
      const iso = new Date(ms).toISOString(); // 2026-09-14T10:22:14.534Z
      return `'${iso.slice(0, 23).replace('T', ' ')}'`;
    }
  }

  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 'NULL';
    return String(value);
  }
  if (typeof value === 'bigint') return String(value);
  if (Buffer.isBuffer(value)) return `X'${value.toString('hex')}'`;
  if (typeof value === 'object') value = JSON.stringify(value);

  // Backslash first, then the quote — otherwise the escape characters get escaped.
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

// ── 2. Dump the demo data ────────────────────────────────────────────────────
function dumpData(columnTypes) {
  let DatabaseSync;
  try {
    ({ DatabaseSync } = require('node:sqlite'));
  } catch {
    return { error: 'node:sqlite is not available in this Node version.' };
  }

  if (!fs.existsSync(SQLITE_DB)) {
    return { error: `No demo database at ${SQLITE_DB}. Run \`npm run db:seed\` first.` };
  }

  const db = new DatabaseSync(SQLITE_DB, { readOnly: true });
  const present = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' " +
        "AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%' ORDER BY name"
    )
    .all()
    .map((r) => r.name);

  const blocks = [];
  let rows = 0;
  let tables = 0;

  for (const table of present) {
    if (SKIP_DATA.has(table)) continue;

    const all = db.prepare(`SELECT * FROM "${table}"`).all();
    if (!all.length) continue;

    const cols = columnTypes[table];
    if (!cols) {
      blocks.push(`-- skipped ${table}: not present in the generated DDL`);
      continue;
    }

    const names = Object.keys(cols);
    const lines = all.map((row) => {
      const values = names.map((c) => toLiteral(row[c], cols[c]));
      return `(${values.join(',')})`;
    });

    blocks.push(
      `-- ${table}: ${all.length} row${all.length === 1 ? '' : 's'}\n` +
        `INSERT INTO \`${table}\` (${names.map((c) => `\`${c}\``).join(', ')}) VALUES\n` +
        lines.join(',\n') +
        ';'
    );

    rows += all.length;
    tables += 1;
  }

  db.close();
  return { blocks, rows, tables };
}

// ── 3. Verify the generated SQL ──────────────────────────────────────────────

/**
 * Split the inside of a VALUES tuple on top-level commas.
 *
 * A naive `split(',')` breaks on any comma inside a string — and these rows are
 * full of them (addresses, JSON blobs, product descriptions). Handles both
 * quote-doubling ('') and backslash escapes.
 */
function splitTopLevel(input) {
  const out = [];
  let cur = '';
  let inStr = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inStr) {
      if (ch === '\\') {
        cur += ch + (input[++i] ?? '');
        continue;
      }
      if (ch === "'") {
        if (input[i + 1] === "'") {
          cur += ch + input[++i];
          continue;
        }
        inStr = false;
      }
      cur += ch;
      continue;
    }
    if (ch === "'") {
      inStr = true;
      cur += ch;
      continue;
    }
    if (ch === ',') {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

/**
 * Re-read the file and check that every INSERT has as many values as columns.
 *
 * The values are built from the column list, so they cannot drift — but the
 * escaping could produce a string that swallows the following delimiter. A
 * mismatch here means a malformed literal, which would fail on import with a
 * syntax error that is tedious to trace back. Cheaper to catch it now.
 */
function verifySql(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const problems = [];
  let checked = 0;

  // Ordering guard. This shipped broken once: the DROP statements sat above the
  // SET FOREIGN_KEY_CHECKS = 0, so dropping a parent table failed with
  // "#1451 - Cannot delete or update a parent row" while children still
  // referenced it. Assert the disable comes first.
  const disableAt = sql.search(/SET\s+FOREIGN_KEY_CHECKS\s*=\s*0/i);
  const firstDropAt = sql.search(/DROP\s+TABLE/i);
  if (firstDropAt !== -1 && (disableAt === -1 || disableAt > firstDropAt)) {
    problems.push(
      'ORDERING: SET FOREIGN_KEY_CHECKS = 0 must appear before the first DROP TABLE, ' +
        'otherwise dropping a parent table fails with #1451'
    );
  }

  // Every disable must be matched by a re-enable at the end.
  const disables = (sql.match(/SET\s+FOREIGN_KEY_CHECKS\s*=\s*0/gi) || []).length;
  const enables = (sql.match(/SET\s+FOREIGN_KEY_CHECKS\s*=\s*1/gi) || []).length;
  if (disables !== enables) {
    problems.push(
      `ORDERING: ${disables} disable(s) of FOREIGN_KEY_CHECKS but ${enables} re-enable(s)`
    );
  }

  const insertRe = /INSERT INTO `([^`]+)` \(([^)]*)\) VALUES\n([\s\S]*?);\n/g;
  let m;
  while ((m = insertRe.exec(sql))) {
    const table = m[1];
    const columnCount = splitTopLevel(m[2]).length;
    const body = m[3];

    // Walk the tuple list, respecting string literals.
    let depth = 0;
    let start = -1;
    let inStr = false;
    for (let i = 0; i < body.length; i++) {
      const ch = body[i];
      if (inStr) {
        if (ch === '\\') { i++; continue; }
        if (ch === "'") {
          if (body[i + 1] === "'") { i++; continue; }
          inStr = false;
        }
        continue;
      }
      if (ch === "'") { inStr = true; continue; }
      if (ch === '(') {
        if (depth === 0) start = i + 1;
        depth++;
        continue;
      }
      if (ch === ')') {
        depth--;
        if (depth === 0 && start >= 0) {
          const values = splitTopLevel(body.slice(start, i));
          checked++;
          if (values.length !== columnCount) {
            problems.push(
              `${table}: ${values.length} values for ${columnCount} columns`
            );
          }
          start = -1;
        }
      }
    }
  }

  return { problems, checked };
}

// ── 4. Assemble ──────────────────────────────────────────────────────────────
function main() {
  console.log('\n  Generating SQL for phpMyAdmin import…\n');

  const ddl = generateDdl();
  fs.writeFileSync(OUT_SCHEMA, ddl);
  console.log(`  ✓ prisma/schema.sql — DDL only (${(ddl.match(/CREATE TABLE/g) || []).length} tables)`);

  const columnTypes = parseColumnTypes(ddl);

  // Fail before dumping if the parser missed a column — an INSERT that omits one
  // still looks well-formed, so this would otherwise only surface as a duplicate
  // key or constraint error partway through the import.
  const audit = auditParsedColumns(ddl, columnTypes);
  if (audit.length) {
    console.log('\n  ✗ Column parse is incomplete:');
    audit.forEach((p) => console.log(`      ${p}`));
    console.log('\n  schema.sql was written; schema-with-demo.sql was not.\n');
    process.exit(1);
  }

  const dump = dumpData(columnTypes);

  if (dump.error) {
    console.log(`  ! ${dump.error}`);
    console.log('  schema.sql was written; schema-with-demo.sql was not.\n');
    return;
  }

  // Make the demo file re-runnable: drop before create, so importing it twice
  // gives a clean populated database rather than a "table already exists" error.
  const ddlWithDrops = ddl.replace(
    /CREATE TABLE `([^`]+)`/g,
    (_match, name) => `DROP TABLE IF EXISTS \`${name}\`;\nCREATE TABLE \`${name}\``
  );

  const header = [
    '-- BD Market — schema + demo data',
    '--',
    `-- Generated ${new Date().toISOString()}`,
    `-- ${dump.tables} tables populated with ${dump.rows} rows.`,
    '--',
    '-- ⚠️  This file DROPS and recreates every table. Import it into an empty',
    '--     database, or one whose contents you do not mind losing.',
    '--',
    '-- Import: hPanel → Databases → phpMyAdmin → select the database →',
    '--         Import → choose this file → Go',
    '--',
    `-- Omitted as operational noise: ${[...SKIP_DATA].join(', ')}`,
    '',
    'SET NAMES utf8mb4;',
    '',
    '-- Foreign key checks MUST be off before the first DROP. Dropping a parent',
    '-- table (User, Product, ...) fails with #1451 while any other table still',
    '-- references it. They stay off for the inserts too, so table order in the',
    '-- file does not matter, and are restored at the very end.',
    'SET FOREIGN_KEY_CHECKS = 0;',
    '',
  ].join('\n');

  const dataSection = [
    '',
    '-- ═══════════════════════════════════════════════════════════',
    '-- Demo data',
    '-- ═══════════════════════════════════════════════════════════',
    '',
    dump.blocks.join('\n\n'),
    '',
    'SET FOREIGN_KEY_CHECKS = 1;',
    '',
  ].join('\n');

  fs.writeFileSync(OUT_DEMO, header + ddlWithDrops + dataSection);
  console.log(
    `  ✓ prisma/schema-with-demo.sql — ${dump.tables} tables, ${dump.rows} rows ` +
      `(${(fs.statSync(OUT_DEMO).size / 1024 / 1024).toFixed(1)} MB)`
  );
  // Verify before declaring success — a malformed literal would otherwise only
  // surface as a phpMyAdmin syntax error, painful to trace back to a row.
  const { problems, checked } = verifySql(OUT_DEMO);
  if (problems.length) {
    console.log(`\n  ✗ Verification failed on ${problems.length} row(s):`);
    problems.slice(0, 10).forEach((p) => console.log(`      ${p}`));
    console.log('\n  The file was written but should not be imported as-is.\n');
    process.exit(1);
  }
  console.log(`  ✓ verified ${checked} rows — every value count matches its columns`);

  console.log('');
  console.log('  Import schema-with-demo.sql for a populated store, or schema.sql for an');
  console.log('  empty one. Then optionally `npm run db:seed` on the server.');
  console.log('');
}

main();
