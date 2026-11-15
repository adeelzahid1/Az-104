// Checks the question bank in src/app/data for structural errors.
// Run with: npm run validate:bank
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DATA = join(import.meta.dirname, '..', 'src', 'app', 'data');
const CASE_PARTS = 5;

const cases = JSON.parse(readFileSync(join(DATA, 'cases.json'), 'utf8'));
const caseIds = new Set(cases.map((c) => c.id));
const errors = [];
const ids = new Set();
const partsPerCase = new Map();
const counts = { total: 0, byType: {}, byDomain: {} };

const inRange = (values, size) =>
  values.every((v) => Number.isInteger(v) && v >= 0 && v < size);

for (const file of readdirSync(DATA).filter((f) => /^d\d-.+\.json$/.test(f))) {
  const questions = JSON.parse(readFileSync(join(DATA, file), 'utf8'));
  const domain = file.charAt(1);
  questions.forEach((q, index) => {
    const where = `${file} #${index} (${q.id})`;
    const fail = (msg) => errors.push(`${where}: ${msg}`);

    if (!/^D\d-\d{3}$/.test(q.id)) fail('bad id');
    if (q.id.charAt(1) !== domain) fail('id does not match file domain');
    if (ids.has(q.id)) fail('duplicate id');
    ids.add(q.id);
    if (!q.q || !q.exp || !q.sub) fail('missing question, explanation or subtopic');
    if (!/^https:\/\/(learn\.microsoft\.com|azure\.microsoft\.com|www\.microsoft\.com)\//.test(q.link ?? '')) {
      fail('link must point to Microsoft documentation');
    }
    if (![1, 2, 3].includes(q.diff)) fail('diff must be 1, 2 or 3');

    switch (q.type) {
      case 'mcq':
        if (q.ans.length !== 1 || !inRange(q.ans, q.opts?.length ?? 0)) fail('mcq answer out of range');
        break;
      case 'multi':
        if (q.ans.length < 2 || !inRange(q.ans, q.opts?.length ?? 0)) fail('multi answer out of range');
        break;
      case 'yesno':
        if (q.ans.length !== q.stmts?.length || q.ans.some((v) => typeof v !== 'boolean')) {
          fail('yesno answers must be one boolean per statement');
        }
        break;
      case 'order': {
        const sorted = [...q.ans].sort((a, b) => a - b);
        if (q.ans.length !== q.items?.length || sorted.some((v, i) => v !== i)) {
          fail('order answer must be a permutation of the items');
        }
        break;
      }
      case 'dropdown': {
        const markers = [...(q.tpl ?? '').matchAll(/\[\[(\d+)\]\]/g)].map((m) => Number(m[1]));
        const blanks = q.blanks ?? [];
        if (markers.length !== blanks.length || markers.some((m, i) => m !== i)) {
          fail('template markers must be [[0]]..[[n]] in order, one per blank');
        }
        if (q.ans.length !== blanks.length || q.ans.some((a, i) => !inRange([a], blanks[i]?.length ?? 0))) {
          fail('dropdown answer out of range');
        }
        break;
      }
      case 'match':
        if (q.ans.length !== q.items?.length || !inRange(q.ans, q.targets?.length ?? 0)) {
          fail('match answer out of range');
        }
        break;
      default:
        fail(`unknown type ${q.type}`);
    }

    if (q.caseId) {
      if (!caseIds.has(q.caseId)) fail(`unknown caseId ${q.caseId}`);
      const parts = partsPerCase.get(q.caseId) ?? [];
      parts.push(`${file}:${index}`);
      partsPerCase.set(q.caseId, parts);
    }

    counts.total++;
    counts.byType[q.type] = (counts.byType[q.type] ?? 0) + 1;
    counts.byDomain[domain] = (counts.byDomain[domain] ?? 0) + 1;
  });
}

for (const [id, parts] of partsPerCase) {
  if (parts.length !== CASE_PARTS) errors.push(`case ${id}: has ${parts.length} parts, expected ${CASE_PARTS}`);
  const files = new Set(parts.map((p) => p.split(':')[0]));
  const indices = parts.map((p) => Number(p.split(':')[1]));
  const consecutive = indices.every((v, i) => i === 0 || v === indices[i - 1] + 1);
  if (files.size !== 1 || !consecutive) errors.push(`case ${id}: parts must be consecutive in one file`);
}
for (const id of caseIds) {
  if (!partsPerCase.has(id)) errors.push(`case ${id}: no questions reference it`);
}

console.log(`Questions: ${counts.total}  Case studies: ${caseIds.size}`);
console.log('By domain:', counts.byDomain);
console.log('By type:  ', counts.byType);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n` + errors.join('\n'));
  process.exit(1);
}
console.log('\nNo problems found.');
