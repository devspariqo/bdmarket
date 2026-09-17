/**
 * Point every admin link at the configured panel path.
 *
 * The panel can be served on a merchant-chosen path (Settings → Advanced), so a
 * hardcoded `/admin/orders` breaks the navigation the moment it is changed. This
 * rewrites the server components to build their hrefs from `getAdminBase()`.
 *
 * Client components are deliberately skipped — they cannot await a server helper,
 * so they take `base` as a prop and are edited by hand.
 *
 * Run:  node scripts/apply-admin-base.js
 */
const fs = require('fs');
const path = require('path');

/** Every .tsx under a directory, recursively. */
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walk(full, out);
    } else if (entry.name.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out;
}

const files = [...walk('app'), ...walk('components')].filter((f) =>
  fs.readFileSync(f, 'utf8').includes('href="/admin')
);

let changed = 0;
const skipped = [];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');

  if (src.startsWith("'use client'") || src.startsWith('"use client"')) {
    skipped.push(file);
    continue;
  }
  if (src.includes('getAdminBase')) continue;

  let out = src;

  // 1. Import the helper, after the last existing import.
  const importLines = out.match(/^import .*?;$/gm) || [];
  const lastImport = importLines[importLines.length - 1];
  if (!lastImport) {
    skipped.push(file);
    continue;
  }
  out = out.replace(lastImport, `${lastImport}\nimport { getAdminBase } from '@/lib/admin-path';`);

  // 2. Read the base once, at the top of the component body.
  const comp = out.match(/export default async function \w+\s*\([^)]*\)\s*\{/);
  if (!comp) {
    skipped.push(file);
    continue;
  }
  out = out.replace(comp[0], `${comp[0]}\n  const base = await getAdminBase();`);

  // 3. Rewrite the hrefs. `href="/admin/orders"` becomes `href={`${base}/orders`}`.
  out = out.replace(/href="\/admin\/([^"]*)"/g, 'href={`${base}/$1`}');
  // The panel root itself has no trailing segment.
  out = out.replace(/href="\/admin"/g, 'href={base}');

  if (out !== src) {
    fs.writeFileSync(file, out);
    changed++;
    console.log(`  updated ${file}`);
  }
}

console.log('');
console.log(`Rewrote ${changed} file(s).`);
if (skipped.length) {
  console.log('Skipped (client components — take `base` as a prop instead):');
  for (const f of skipped) console.log(`  ${f}`);
}
