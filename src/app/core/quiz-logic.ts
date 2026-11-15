import { DOMAINS, Difficulty, Question, QuestionType } from '../data/schema';

/** mcq/multi/order: option or item indices. yesno: one boolean (or null if unanswered) per statement. */
export type Answer = number[] | (boolean | null)[];

export interface QuizConfig {
  mode: 'practice' | 'exam';
  domains: number[];
  count: number;
  /** 0 = any difficulty */
  diff: 0 | Difficulty;
  type: 'all' | QuestionType;
  mistakesOnly: boolean;
  timed: boolean;
}

export const domainOf = (q: Question): number => Number(q.id.charAt(1));

export function isAnswered(q: Question, a: Answer | null): boolean {
  if (!a || a.length === 0) return false;
  if (q.type === 'yesno') return a.length === (q.stmts?.length ?? 0) && a.every((v) => v !== null);
  return true;
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

export function pickQuestions(
  pool: Question[],
  config: QuizConfig,
  mistakes: ReadonlySet<string>,
  rnd: () => number = Math.random,
): Question[] {
  const eligible = pool.filter(
    (q) =>
      config.domains.includes(domainOf(q)) &&
      (config.diff === 0 || q.diff === config.diff) &&
      (config.type === 'all' || q.type === config.type) &&
      (!config.mistakesOnly || mistakes.has(q.id)),
  );
  if (config.mode === 'practice') return shuffle(eligible, rnd).slice(0, config.count);

  const quotas = domainQuotas(config.domains, config.count);
  const picked = config.domains.flatMap((d) =>
    shuffle(
      eligible.filter((q) => domainOf(q) === d),
      rnd,
    ).slice(0, quotas.get(d) ?? 0),
  );
  return shuffle(picked, rnd);
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
