#!/usr/bin/env node
/*
 * Copy flyer content from the kiosk HTML into the Apps Script, so the two never drift apart.
 * Usage:  node tools/sync-content.js <kiosk.html> <mailer.gs>
 * Reads `const BRAND … const ACTIVITIES = [ … ];` from the kiosk, keeps type 'flyer' entries, and
 * rewrites the block between `// <CONTENT>` and `// </CONTENT>` in the .gs file.
 */
const fs = require('fs');
const [, , htmlPath, gsPath] = process.argv;
if (!htmlPath || !gsPath) { console.error('usage: node tools/sync-content.js <kiosk.html> <mailer.gs>'); process.exit(1); }

const html = fs.readFileSync(htmlPath, 'utf8');
const start = html.indexOf('const BRAND');
const actStart = html.indexOf('const ACTIVITIES = [', start);
const end = html.indexOf('\n];', actStart);
if (start < 0 || actStart < 0 || end < 0) { console.error('ACTIVITIES block not found'); process.exit(1); }
const ACTIVITIES = new Function(html.slice(start, end + 3) + '\nreturn ACTIVITIES;')();

const FIELDS = ['title', 'tagline', 'summary', 'points', 'support', 'quote', 'getInvolved', 'link'];
const content = {};
for (const a of ACTIVITIES.filter(x => x.type === 'flyer')) {
  content[a.id] = {};
  for (const f of FIELDS) if (a[f] !== undefined) content[a.id][f] = a[f];
}

const gs = fs.readFileSync(gsPath, 'utf8');
const re = /(\/\/ <CONTENT>[^\n]*\n)[\s\S]*?(\/\/ <\/CONTENT>)/;
if (!re.test(gs)) { console.error('CONTENT markers not found in ' + gsPath); process.exit(1); }
const block = 'const CONTENT = ' + JSON.stringify(content, null, 2) + ';\n';
fs.writeFileSync(gsPath, gs.replace(re, (_, open, close) => open + block + close));
console.log(`synced ${Object.keys(content).length} flyers: ${Object.keys(content).join(', ')}`);
