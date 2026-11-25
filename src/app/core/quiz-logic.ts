import { DOMAINS, Difficulty, Question, QuestionType } from '../data/schema';

/**
 * mcq/multi/order: option or item indices.
 * dropdown/match: one chosen index (or null) per blank or item.
 * yesno: one boolean (or null) per statement.
 */
export type Answer = (number | null)[] | (boolean | null)[];

/**
 * 'case' selects whole case studies, 'concept' the concept questions; a question type selects
 * standalone questions of that type.
 */
export type TypeFilter = 'all' | 'case' | 'concept' | QuestionType;

export interface QuizConfig {
  mode: 'practice' | 'exam';
  domains: number[];
  count: number;
  /** 0 = any difficulty */
  diff: 0 | Difficulty;
  type: TypeFilter;
  mistakesOnly: boolean;
  timed: boolean;
  /** Practice only: the subtopics of the chosen domains to pick from. */
  subs?: string[];
}

/** Mock exams of at least this many questions include one case study, like the real exam. */
export const CASE_STUDY_MIN_EXAM_SIZE = 30;

export const domainOf = (q: Question): number => Number(q.id.charAt(1));

function matchesType(q: Question, type: TypeFilter): boolean {
  switch (type) {
    case 'all':
      return true;
    case 'case':
      return !!q.caseId;
    case 'concept':
      return !!q.concept;
    default:
      return q.type === type;
  }
}

/** Number of separate answers a question needs, or undefined when one selection is enough. */
function slotCount(q: Question): number | undefined {
  switch (q.type) {
    case 'yesno':
      return q.stmts?.length ?? 0;
    case 'dropdown':
      return q.blanks?.length ?? 0;
    case 'match':
      return q.items?.length ?? 0;
    default:
      return undefined;
  }
}

export function isAnswered(q: Question, a: Answer | null): boolean {
  if (!a || a.length === 0) return false;
  const slots = slotCount(q);
  if (slots === undefined) return true;
  return a.length === slots && a.every((v) => v !== null);
}

export function isCorrect(q: Question, a: Answer | null): boolean {
  if (!isAnswered(q, a) || !a) return false;
  const expected = q.ans as (number | boolean)[];
  if (q.type === 'multi') {
    const got = [...(a as number[])].sort((x, y) => x - y);
    const want = [...(expected as number[])].sort((x, y) => x - y);
    return got.length === want.length && got.every((v, i) => v === want[i]);
  }
  return a.length === expected.length && a.every((v, i) => v === expected[i]);
}

export function shuffle<T>(items: readonly T[], rnd: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Splits `count` questions across the chosen domains in proportion to the official
 * exam weights, using largest-remainder rounding so the quotas add up exactly.
 */
export function domainQuotas(domains: number[], count: number): Map<number, number> {
  const chosen = DOMAINS.filter((d) => domains.includes(d.id));
  const totalWeight = chosen.reduce((sum, d) => sum + d.weight, 0);
  const exact = chosen.map((d) => ({ id: d.id, value: (count * d.weight) / totalWeight }));
  const quotas = new Map(exact.map((e) => [e.id, Math.floor(e.value)]));
  let left = count - [...quotas.values()].reduce((a, b) => a + b, 0);
  const byRemainder = [...exact].sort((a, b) => (b.value % 1) - (a.value % 1));
  for (const e of byRemainder) {
    if (left <= 0) break;
    quotas.set(e.id, (quotas.get(e.id) ?? 0) + 1);
    left--;
  }
  return quotas;
}

/** Groups case-study parts into one unit (kept in authored order); other questions stand alone. */
export function toUnits(questions: Question[]): Question[][] {
  const units: Question[][] = [];
  const byCase = new Map<string, Question[]>();
  for (const q of questions) {
    if (!q.caseId) {
      units.push([q]);
      continue;
    }
    let unit = byCase.get(q.caseId);
    if (!unit) {
      unit = [];
      byCase.set(q.caseId, unit);
      units.push(unit);
    }
    unit.push(q);
  }
  return units;
}

/** Takes whole units in order until `count` questions are reached, skipping units that would overshoot. */
function fill(units: Question[][], count: number): Question[] {
  const out: Question[] = [];
  for (const unit of units) {
    if (out.length >= count) break;
    if (out.length === 0 || out.length + unit.length <= count) out.push(...unit);
  }
  return out;
}

export function pickQuestions(
  pool: Question[],
  config: QuizConfig,
  mistakes: ReadonlySet<string>,
  rnd: () => number = Math.random,
  /** Questions answered before; practice by subtopic shows the others first. */
  answered: ReadonlySet<string> = new Set(),
): Question[] {
  const inDomains = (q: Question) => config.domains.includes(domainOf(q));
  const diffOk = (q: Question) => config.diff === 0 || q.diff === config.diff;

  if (config.mistakesOnly) {
    const missed = pool.filter(
      (q) =>
        inDomains(q) &&
        diffOk(q) &&
        mistakes.has(q.id) &&
        (!config.subs || config.subs.includes(q.sub)) &&
        matchesType(q, config.type),
    );
    return shuffle(missed, rnd).slice(0, config.count);
  }

  if (config.subs) {
    const subs = config.subs;
    // Case study parts stand alone here; the case text is shown with each of them.
    const matching = pool.filter(
      (q) =>
        inDomains(q) &&
        diffOk(q) &&
        subs.includes(q.sub) &&
        matchesType(q, config.type),
    );
    const mixed = shuffle(matching, rnd);
    return [...mixed.filter((q) => !answered.has(q.id)), ...mixed.filter((q) => answered.has(q.id))].slice(
      0,
      config.count,
    );
  }

  const units = toUnits(pool).filter((u) => u.every(inDomains));
  const caseUnits = units.filter((u) => !!u[0]?.caseId);
  const singles = units
    .filter((u) => !u[0]?.caseId)
    .map((u) => u[0])
    .filter((q) => diffOk(q) && matchesType(q, config.type));

  if (config.mode === 'practice') {
    if (config.type === 'case') return fill(shuffle(caseUnits, rnd), config.count);
    const candidates =
      config.type === 'all' ? [...singles.map((q) => [q]), ...caseUnits] : singles.map((q) => [q]);
    return fill(shuffle(candidates, rnd), config.count);
  }

  const caseUnit =
    config.type === 'all' && config.count >= CASE_STUDY_MIN_EXAM_SIZE
      ? shuffle(caseUnits, rnd)[0]
      : undefined;
  const quotas = domainQuotas(config.domains, config.count - (caseUnit?.length ?? 0));
  const picked = config.domains.flatMap((d) =>
    shuffle(
      singles.filter((q) => domainOf(q) === d),
      rnd,
    ).slice(0, quotas.get(d) ?? 0),
  );
  return [...shuffle(picked, rnd), ...(caseUnit ?? [])];
}

/**
 * Returns a copy of a choice question with its options in random order and the answer key
 * remapped, so the correct option's position carries no information.
 */
export function shuffleOptions(q: Question, rnd: () => number = Math.random): Question {
  const opts = q.opts;
  if (!opts || (q.type !== 'mcq' && q.type !== 'multi')) return q;
  const perm = shuffle(
    opts.map((_, i) => i),
    rnd,
  );
  return {
    ...q,
    opts: perm.map((i) => opts[i]),
    optOrder: perm,
    ans: (q.ans as number[]).map((a) => perm.indexOf(a)).sort((x, y) => x - y),
  };
}

/** Order questions start pre-filled with a scrambled sequence that differs from the answer. */
export function initialAnswer(q: Question, rnd: () => number = Math.random): Answer | null {
  if (q.type !== 'order') return null;
  const indices = (q.items ?? []).map((_, i) => i);
  let attempt = shuffle(indices, rnd);
  for (let tries = 0; tries < 5 && isCorrect(q, attempt); tries++) {
    attempt = shuffle(indices, rnd);
  }
  return attempt;
}
