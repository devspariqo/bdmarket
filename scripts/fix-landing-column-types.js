/**
 * Re-apply the native types to the LandingPage model, then refresh the list.
 *
 * Needed because `scripts/column-types.js` was generated *before* the LandingPage
 * model existed, and `use-db.js` restores annotations only from that list — so a
 * switch to SQLite (which strips them, since SQLite rejects `@db.Text`) and back
 * to MySQL silently lost every LandingPage annotation. `blocks` reverted to
 * VARCHAR(191), which on a real MySQL server truncates the block JSON and makes
 * the page render empty. Exactly the failure this project spent a day chasing.
 *
 * Writes through sed, because Node and `git checkout` cannot write
 * prisma/schema.prisma on this machine while OneDrive holds the file.
 *
 * Run:  node scripts/fix-landing-column-types.js
 */
const fs = require('fs');

/** Field -> native type, for the LandingPage model only. */
const TYPES = {
  title: '@db.Text',
  blocks: '@db.LongText',
  metaTitle: '@db.Text',
  metaDesc: '@db.Text',
  metaKeywords: '@db.Text',
  ogImage: '@db.Text',
  canonical: '@db.Text',
  gaId: '@db.Text',
  fbPixelId: '@db.Text',
  customHead: '@db.LongText',
  customBody: '@db.LongText',
  bgColor: '@db.Text',
  textColor: '@db.Text',
  fontFamily: '@db.Text',
  checkoutHeading: '@db.Text',
  checkoutFields: '@db.Text',
  checkoutButton: '@db.Text',
  thankYouNote: '@db.Text',
};

const lines = fs.readFileSync('prisma/schema.prisma', 'utf8').split('\n');

let inModel = false;
let applied = 0;
let skipped = 0;
const commands = [];

for (let i = 0; i < lines.length; i++) {
  if (/^model\s+LandingPage\s*\{/.test(lines[i])) {
    inModel = true;
    continue;
  }
  if (inModel && /^\}/.test(lines[i])) {
    inModel = false;
    continue;
  }
  if (!inModel) continue;

  const field = lines[i].match(/^(\s+)(\w+)\s+String(\??)(.*)$/);
  if (!field) continue;

  const type = TYPES[field[2]];
  if (!type) continue;

  if (lines[i].includes('@db.')) {
    skipped++;
    continue;
  }

  // `&` rather than a backreference, and `[?]\{0,1\}` rather than `\?`: GNU sed
  // rejects a backreference on a pattern containing `\?`.
  commands.push(`${i + 1}s/^[[:space:]]*${field[2]}[[:space:]]\\+String[?]\\{0,1\\}/& ${type}/`);
  applied++;
}

const out = 'C:/Users/WALTON/AppData/Local/Temp/landing-annot.sed';
fs.writeFileSync(out, commands.join('\n') + '\n');
console.log(`Wrote ${out} — ${applied} to apply, ${skipped} already annotated`);
if (applied !== Object.keys(TYPES).length && skipped === 0) {
  console.warn(`Warning: expected ${Object.keys(TYPES).length} fields, found ${applied}.`);
}
