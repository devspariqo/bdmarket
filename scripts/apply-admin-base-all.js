/**
 * Point EVERY admin link at the configured panel path.
 *
 * The first pass only handled `href="/admin/..."` and `href: '/admin/...'`, which
 * missed 29 references in three other shapes:
 *
 *   href={`/admin/x?y=${z}`}      template literals
 *   action="/admin/x"             form actions
 *   push(`/admin/x/${id}`)        navigation calls
 *
 * A missed reference is invisible until the merchant moves the panel, at which
 * point that one link — a filter, a pagination button, a search form — silently
 * 404s while everything around it works. That is exactly the report this fixes.
 *
 * Run:  node scripts/apply-admin-base-all.js
 */
const fs = require('fs');
const path = require('path');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walk(full, out);
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

/** Does this file still point at /admin in any of the four shapes? */
const NEEDLE = /(href=\{`\/admin|href="\/admin|action="\/admin|action=\{`\/admin|push\(`\/admin|href: '\/admin|push\('\/admin|href="\/admin")/;

const files = [...walk('app'), ...walk('components'), ...walk('lib')].filter((f) => {
  const src = fs.readFileSync(f, 'utf8');
  if (f.includes('api/panel-path') || f.includes('lib/admin-path')) return false;
  return NEEDLE.test(src);
});

const clientSkipped = [];
let changed = 0;

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const isClient = /^['"]use client['"]/.test(src.trimStart());
  let out = src;

  // 1. Make sure `base` exists in scope.
  if (isClient) {
    // Client components take it as a prop; the server page that renders them is
    // handled below by the caller, so only the link rewrite happens here.
    if (!/\bbase\b\s*[,}:]/.test(src) && !src.includes('base: string')) {
      clientSkipped.push(file);
      continue;
    }
  } else if (!src.includes('getAdminBase')) {
    const imports = out.match(/^import .*?;$/gm) || [];
    if (!imports.length) {
      clientSkipped.push(file);
      continue;
    }
    out = out.replace(
      imports[imports.length - 1],
      `${imports[imports.length - 1]}\nimport { getAdminBase } from '@/lib/admin-path';`
    );
    const comp = out.match(/export default async function \w+\s*\([^)]*\)\s*\{/);
    if (!comp) {
      clientSkipped.push(file);
      continue;
    }
    out = out.replace(comp[0], `${comp[0]}\n  const base = await getAdminBase();`);
  }

  // 2. Rewrite every shape.
  out = out.replace(/href=\{`\/admin\/([^`]*)`\}/g, 'href={`${base}/$1`}');
  out = out.replace(/href=\{`\/admin`\}/g, 'href={base}');
  out = out.replace(/action=\{`\/admin\/([^`]*)`\}/g, 'action={`${base}/$1`}');
  out = out.replace(/action="\/admin\/([^"]*)"/g, 'action={`${base}/$1`}');
  out = out.replace(/push\(`\/admin\/([^`]*)`\)/g, 'push(`${base}/$1`)');
  out = out.replace(/push\('\/admin\/([^']*)'\)/g, 'push(`${base}/$1`)');
  out = out.replace(/href="\/admin\/([^"]*)"/g, 'href={`${base}/$1`}');
  out = out.replace(/href="\/admin"/g, 'href={base}');
  out = out.replace(/href: '\/admin\/([^']*)'/g, 'href: `${base}/$1`');

  if (out !== src) {
    fs.writeFileSync(file, out);
    changed++;
    console.log(`  ${isClient ? 'client' : 'server'}  ${file}`);
  }
}

console.log('');
console.log(`Rewrote ${changed} file(s).`);
if (clientSkipped.length) {
  console.log('Needs `base` in scope first (add the prop / the await, then re-run):');
  for (const f of clientSkipped) console.log(`  ${f}`);
}
