// Checks the question bank in src/app/data for structural errors.
// Run with: npm run validate:bank
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DATA = join(import.meta.dirname, '..', 'src', 'app', 'data');
const CASE_PARTS = 5;
const SET_SIZE = 3;

const cases = JSON.parse(readFileSync(join(DATA, 'cases.json'), 'utf8'));
const caseIds = new Set(cases.map((c) => c.id));
const errors = [];
const ids = new Set();
const byId = new Map();
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
    byId.set(q.id, q);
    if (!q.q || !q.exp || !q.sub) fail('missing question, explanation or subtopic');
    if (!/^https:\/\/(learn\.microsoft\.com|azure\.microsoft\.com|www\.microsoft\.com)\//.test(q.link ?? '')) {
      fail('link must point to Microsoft documentation');
    }
    if ((q.concept === true) !== file.includes('-concept')) fail('concept: true belongs on every question of the concept files');
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

const setsById = new Map();
for (const q of byId.values()) if (q.set) setsById.set(q.set, [...(setsById.get(q.set) ?? []), q]);
for (const [id, qs] of setsById) {
  if (qs.length !== SET_SIZE) errors.push(`set ${id}: has ${qs.length} questions, expected ${SET_SIZE}`);
  if (new Set(qs.map((q) => q.ctx)).size !== 1 || !qs[0].ctx) errors.push(`set ${id}: questions must share the same ctx`);
  if (new Set(qs.map((q) => q.id.charAt(1))).size !== 1) errors.push(`set ${id}: questions must be in one domain`);
  if (qs.some((q) => q.type !== 'mcq' || q.opts.length !== 2)) errors.push(`set ${id}: questions must be Yes/No`);
}
for (const d of [1, 2, 3, 4, 5]) {
  if (![...setsById.values()].some((qs) => qs[0].id.charAt(1) === String(d))) errors.push(`domain ${d}: has no problem-solution set`);
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

// Study sections: every question's subtopic must belong to exactly one section of its domain.
const sections = JSON.parse(readFileSync(join(DATA, 'study-sections.json'), 'utf8'));
const sectionOf = new Map();
for (const s of sections) {
  if (!s.skills?.length) errors.push(`study-sections: ${s.id} lists no official skills`);
  for (const sub of s.subs) {
    const key = `${s.domain}|${sub}`;
    if (sectionOf.has(key)) errors.push(`study-sections: "${sub}" is in both ${sectionOf.get(key)} and ${s.id}`);
    sectionOf.set(key, s.id);
  }
}
const sectionSizes = {};
for (const q of byId.values()) {
  const id = sectionOf.get(`${q.id.charAt(1)}|${q.sub}`);
  if (!id) errors.push(`${q.id}: subtopic "${q.sub}" is not in any study section`);
  else if (!q.caseId) sectionSizes[id] = (sectionSizes[id] ?? 0) + 1;
}

// Roman Urdu translations in src/app/data/roman must line up with the English questions.
const ROMAN = join(DATA, 'roman');
const TEXT_FIELDS = ['ctx', 'q', 'exp', 'tpl'];
const LIST_FIELDS = ['opts', 'stmts', 'items', 'targets', 'blanks'];
// Word order differs between languages, so a translation may place the drop-downs in another order.
const markersOf = (tpl) => [...(tpl ?? '').matchAll(/\[\[(\d+)\]\]/g)].map((m) => m[1]).sort().join(',');
const romanDone = {};
for (let d = 1; d <= 5; d++) {
  const file = `d${d}.json`;
  const set = JSON.parse(readFileSync(join(ROMAN, file), 'utf8'));
  let complete = 0;
  for (const [id, ro] of Object.entries(set)) {
    const fail = (msg) => errors.push(`roman/${file} ${id}: ${msg}`);
    const q = byId.get(id);
    if (!q) {
      fail('no English question with this id');
      continue;
    }
    if (id.charAt(1) !== String(d)) fail('id is in the wrong domain file');
    for (const key of Object.keys(ro)) {
      if (![...TEXT_FIELDS, ...LIST_FIELDS].includes(key)) fail(`unexpected field ${key}`);
      else if (!(key in q)) fail(`${key} has no English counterpart`);
    }
    for (const key of TEXT_FIELDS) {
      if (key in ro && (typeof ro[key] !== 'string' || !ro[key].trim())) fail(`${key} must be non-empty text`);
    }
    for (const key of LIST_FIELDS) {
      if (key in ro && (!Array.isArray(ro[key]) || ro[key].length !== q[key]?.length)) {
        fail(`${key} must have ${q[key]?.length ?? 0} entries`);
      }
    }
    ro.blanks?.forEach((choices, i) => {
      if (choices.length !== q.blanks?.[i]?.length) fail(`blanks[${i}] must have ${q.blanks?.[i]?.length} choices`);
    });
    if (ro.tpl && markersOf(ro.tpl) !== markersOf(q.tpl)) fail('tpl must keep the same [[n]] markers');
    const needed = ['q', 'exp', ...['ctx', 'tpl', 'opts', 'stmts', 'items', 'targets'].filter((k) => k in q)];
    if (needed.every((k) => k in ro)) complete++;
  }
  romanDone[d] = `${complete}/${counts.byDomain[d] ?? 0}`;
}
const romanCases = JSON.parse(readFileSync(join(ROMAN, 'cases.json'), 'utf8'));
for (const [id, ro] of Object.entries(romanCases)) {
  const c = cases.find((x) => x.id === id);
  if (!c) errors.push(`roman/cases.json ${id}: unknown case`);
  else if (!ro.title || ro.sections?.length !== c.sections.length) {
    errors.push(`roman/cases.json ${id}: needs a title and ${c.sections.length} sections`);
  }
}

// Cheat sheet: complete tables, text in both languages, every study section covered.
const cheat = JSON.parse(readFileSync(join(DATA, 'cheatsheet.json'), 'utf8'));
const bilingual = (x) =>
  typeof x === 'string' || (Array.isArray(x) && x.length === 2 && x.every((s) => typeof s === 'string' && s.trim()));
const covered = new Set();
let cheatFacts = 0;
for (const g of cheat) {
  for (const c of g.cards) {
    const fail = (msg) => errors.push(`cheatsheet ${g.id} "${[c.t].flat()[0]}": ${msg}`);
    covered.add(c.s);
    if (!sections.some((s) => s.id === c.s)) fail(`unknown section ${c.s}`);
    if (c.link && !c.link.startsWith('https://learn.microsoft.com/')) fail('link must point to Microsoft Learn');
    const texts = [c.t, ...(c.head ?? []), ...(c.rows ?? []).flat(), ...(c.list ?? []), ...(c.code ?? []).map((x) => x[1])];
    if (!texts.every(bilingual)) fail('text must be a string or [English, Roman]');
    if (c.rows?.some((r) => r.length !== c.head?.length)) fail('every row needs one cell per heading');
    cheatFacts += (c.rows?.length ?? 0) + (c.list?.length ?? 0) + (c.code?.length ?? 0);
  }
}
for (const s of sections) if (!covered.has(s.id)) errors.push(`cheatsheet: section ${s.id} has no card`);

// Labs: known sections and skills, text in both languages, own resource groups only.
const labs = JSON.parse(readFileSync(join(DATA, 'labs.json'), 'utf8'));
const allSkills = new Set(sections.flatMap((s) => s.skills));
const pair = (x) => Array.isArray(x) && x.length === 2 && x.every((s) => typeof s === 'string' && s.trim());
const labSkills = new Set();
labs.forEach((l, i) => {
  const fail = (msg) => errors.push(`labs ${l.id}: ${msg}`);
  if (l.id !== `L${String(i + 1).padStart(2, '0')}`) fail('ids must be L01, L02, … in order');
  if (!sections.some((s) => s.id === l.section)) fail(`unknown section ${l.section}`);
  if (!['free', 'low', 'hourly'].includes(l.cost) || !(l.minutes > 0)) fail('cost or minutes');
  if (![l.t, l.goal, ...l.steps.map((s) => s.t), ...l.remember].every(pair)) fail('text must be [English, Roman]');
  for (const k of l.skills) {
    labSkills.add(k);
    if (!allSkills.has(k)) fail(`unknown skill "${k}"`);
  }
  const groups = [...l.steps.map((s) => s.cli ?? '').join('\n').matchAll(/\b(?:V?RG)=(\S+)/g)].map((m) => m[1]);
  const own = new RegExp(`^az104-lab${l.id.slice(1)}(-vault)?$`);
  if (!groups.length || !groups.every((g) => own.test(g))) fail('must use its own az104-labNN resource group');
  if (!l.cleanup.includes('az group delete -n $RG')) fail('cleanup must delete the resource group');
});

// Notes: every section has bilingual notes with headings, an example, a trap and self-check questions.
let noteWords = 0;
for (const d of [1, 2, 3, 4, 5]) {
  const notes = JSON.parse(readFileSync(join(DATA, 'notes', `d${d}.json`), 'utf8'));
  const wanted = sections.filter((s) => s.domain === d).map((s) => s.id);
  if (Object.keys(notes).join() !== wanted.join()) errors.push(`notes d${d}: sections must be ${wanted}`);
  for (const [id, blocks] of Object.entries(notes)) {
    const fail = (msg) => errors.push(`notes ${id}: ${msg}`);
    const texts = blocks.flatMap((b) => (b.k === 'l' ? b.items : b.k === 'q' ? [b.t, b.a] : [b.t]));
    if (!blocks.every((b) => ['h', 'p', 'e', 't', 'w', 'l', 'q'].includes(b.k))) fail('unknown block');
    if (!texts.length || !texts.every(pair)) fail('text must be [English, Roman]');
    for (const [k, min] of [['h', 2], ['e', 1], ['t', 1], ['w', 1], ['q', 3]]) {
      if (blocks.filter((b) => b.k === k).length < min) fail(`needs at least ${min} of "${k}"`);
    }
    noteWords += texts.reduce((n, x) => n + x[0].split(/\s+/).length, 0);
  }
}

// The correct option must not be recognisable by its length, in English or in Roman Urdu.
const MAX_STANDOUT_SHARE = 0.12;
const romanById = Object.assign(
  {},
  ...[1, 2, 3, 4, 5].map((d) => JSON.parse(readFileSync(join(ROMAN, `d${d}.json`), 'utf8'))),
);
const mcqs = [...byId.values()].filter((q) => q.type === 'mcq');
const standout = {};
for (const [lang, optsOf] of [
  ['English', (q) => q.opts],
  ['Roman', (q) => romanById[q.id]?.opts],
]) {
  let checked = 0;
  let noticeable = 0;
  for (const q of mcqs) {
    const opts = optsOf(q);
    if (!opts) continue;
    checked++;
    const correct = opts[q.ans[0]].length;
    const longestWrong = Math.max(...opts.filter((_, i) => i !== q.ans[0]).map((o) => o.length));
    if (correct > longestWrong + 8 && correct > longestWrong * 1.25) noticeable++;
    if (correct > longestWrong + 25 && correct > longestWrong * 1.6) {
      errors.push(`${q.id} (${lang}): the correct option is far longer than the others`);
    }
  }
  standout[lang] = `${noticeable}/${checked}`;
  if (noticeable > checked * MAX_STANDOUT_SHARE) {
    errors.push(`${lang}: the correct option is noticeably the longest in ${noticeable} of ${checked} mcqs`);
  }
}

console.log(`Questions: ${counts.total}  Case studies: ${caseIds.size}`);
console.log('Roman Urdu translated:', romanDone, `cases ${Object.keys(romanCases).length}/${caseIds.size}`);
console.log('Study sections (excluding case studies):', sectionSizes);
console.log(`Cheat sheet: ${cheat.reduce((n, g) => n + g.cards.length, 0)} cards, ${cheatFacts} entries`);
console.log(`Labs: ${labs.length}, practising ${labSkills.size} of ${allSkills.size} official skills`);
console.log(`Notes: ${sections.length} sections, ${noteWords} words in English`);
console.log('Correct option noticeably longest:', standout);
console.log('By domain:', counts.byDomain);
console.log('By type:  ', counts.byType);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n` + errors.join('\n'));
  process.exit(1);
}
console.log('\nNo problems found.');
