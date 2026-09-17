/**
 * Re-apply the @db.Text annotations to prisma/schema.prisma using sed.
 *
 * Exists because the file cannot be written by Node or by `git checkout` on this
 * machine — both fail with EPERM / "Permission denied" while OneDrive holds it —
 * but `sed -i` succeeds. The provider switcher and the annotation list stay the
 * source of truth; this only emits the sed commands.
 *
 * Run:  node scripts/reapply-column-types.js
 */
const fs = require('fs');
const TARGETS = require('./column-types');

const lines = fs.readFileSync('prisma/schema.prisma', 'utf8').split('\n');
let model = null;
const commands = [];

for (let i = 0; i < lines.length; i++) {
  const modelMatch = lines[i].match(/^model\s+(\w+)\s*\{/);
  if (modelMatch) {
    model = modelMatch[1];
    continue;
  }
  if (/^\}/.test(lines[i])) {
    model = null;
    continue;
  }
  if (!model || !TARGETS[model]) continue;
  if (lines[i].includes('@db.')) continue;

  const field = lines[i].match(/^(\s+)(\w+)(\s+)String(\??)(.*)$/);
  if (!field) continue;

  const type = TARGETS[model][field[2]];
  if (!type) continue;

  /**
   * Anchored on the field name, so it cannot match a different line.
   *
   * Uses `&` (the whole match) rather than a `\1` backreference, and `[?]\{0,1\}`
   * rather than `\?` — GNU sed rejects a backreference on a pattern containing
   * `\?` with "invalid reference \1 on `s' command's RHS".
   */
  commands.push(`${i + 1}s/^[[:space:]]*${field[2]}[[:space:]]\\+String[?]\\{0,1\\}/& ${type}/`);
}

const out = process.argv[2] || 'C:/Users/WALTON/AppData/Local/Temp/annot.sed';
fs.writeFileSync(out, commands.join('\n') + '\n');
console.log(`Wrote ${out} — ${commands.length} sed command(s)`);
