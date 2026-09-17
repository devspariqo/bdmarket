/**
 * Point the client components' admin links at the configured panel path.
 *
 * These cannot await `getAdminBase()` — they are client components — so they take
 * `base` as a prop, supplied by the server component that renders them. This
 * rewrites the links; the prop itself is added by hand because only a human can
 * decide what to name it and where it comes from.
 *
 * Run:  node scripts/apply-admin-base-client.js
 */
const fs = require('fs');

const FILES = [
  'components/admin/AdminShell.tsx',
  'components/admin/LandingBuilder.tsx',
  'components/admin/ProductEditor.tsx',
];

for (const file of FILES) {
  const src = fs.readFileSync(file, 'utf8');
  let out = src;

  // JSX attribute:  href="/admin/orders"  ->  href={`${base}/orders`}
  out = out.replace(/href="\/admin\/([^"]*)"/g, 'href={`${base}/$1`}');
  out = out.replace(/href="\/admin"/g, 'href={base}');

  // Object literal in the nav array:  href: '/admin/orders'  ->  href: `${base}/orders`
  out = out.replace(/href: '\/admin\/([^']*)'/g, 'href: `${base}/$1`');
  out = out.replace(/href: '\/admin'/g, 'href: base');

  // Navigation calls
  out = out.replace(/push\('\/admin\/([^']*)'\)/g, 'push(`${base}/$1`)');
  out = out.replace(/push\('\/admin'\)/g, 'push(base)');
  out = out.replace(/push\(`\/admin\/([^`]*)`\)/g, 'push(`${base}/$1`)');

  if (out !== src) {
    fs.writeFileSync(file, out);
    console.log(`  updated ${file}`);
  }
}

console.log('');
console.log('Now add the `base` prop to each component by hand.');
