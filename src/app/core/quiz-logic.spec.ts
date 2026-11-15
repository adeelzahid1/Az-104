import { Question } from '../data/schema';
import {
  QuizConfig,
  domainQuotas,
  initialAnswer,
  isAnswered,
  isCorrect,
  pickQuestions,
  shuffleOptions,
} from './quiz-logic';

const base = { sub: 'Test', diff: 2 as const, q: 'Q', exp: 'E', link: 'https://learn.microsoft.com' };

const mcq: Question = { ...base, id: 'D1-001', type: 'mcq', opts: ['a', 'b', 'c', 'd'], ans: [1] };
const multi: Question = { ...base, id: 'D2-001', type: 'multi', opts: ['a', 'b', 'c', 'd'], ans: [0, 2] };
const yesno: Question = { ...base, id: 'D3-001', type: 'yesno', stmts: ['x', 'y', 'z'], ans: [true, false, true] };
const order: Question = { ...base, id: 'D4-001', type: 'order', items: ['w', 'x', 'y', 'z'], ans: [2, 0, 3, 1] };

/** Deterministic pseudo-random generator so shuffles are repeatable in tests. */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe('isCorrect', () => {
  it('checks single-answer questions', () => {
    expect(isCorrect(mcq, [1])).toBeTrue();
    expect(isCorrect(mcq, [0])).toBeFalse();
    expect(isCorrect(mcq, null)).toBeFalse();
  });

  it('accepts multi-select answers in any order but requires the exact set', () => {
    expect(isCorrect(multi, [2, 0])).toBeTrue();
    expect(isCorrect(multi, [0])).toBeFalse();
    expect(isCorrect(multi, [0, 1, 2])).toBeFalse();
  });

  it('requires every yes/no statement to match', () => {
    expect(isCorrect(yesno, [true, false, true])).toBeTrue();
    expect(isCorrect(yesno, [true, true, true])).toBeFalse();
    expect(isCorrect(yesno, [true, false, null])).toBeFalse();
  });

  it('requires the exact sequence for ordering questions', () => {
    expect(isCorrect(order, [2, 0, 3, 1])).toBeTrue();
    expect(isCorrect(order, [0, 2, 3, 1])).toBeFalse();
  });
});

describe('isAnswered', () => {
  it('treats partially answered yes/no series as unanswered', () => {
    expect(isAnswered(yesno, [true, null, false])).toBeFalse();
    expect(isAnswered(yesno, [true, true, false])).toBeTrue();
  });
});

describe('domainQuotas', () => {
  it('splits a 50-question mock exam by official weight and sums exactly', () => {
    const quotas = domainQuotas([1, 2, 3, 4, 5], 50);
    const total = [...quotas.values()].reduce((a, b) => a + b, 0);
    expect(total).toBe(50);
    expect(quotas.get(1)).toBeGreaterThan(quotas.get(5) ?? 0);
    expect(quotas.get(3)).toBeGreaterThan(quotas.get(4) ?? 0);
  });

  it('gives everything to a single selected domain', () => {
    expect(domainQuotas([4], 20).get(4)).toBe(20);
  });
});

describe('pickQuestions', () => {
  const pool: Question[] = Array.from({ length: 5 }, (_, d) =>
    Array.from({ length: 30 }, (_, i): Question => ({
      ...mcq,
      id: `D${d + 1}-${String(i).padStart(3, '0')}`,
      diff: ((i % 3) + 1) as 1 | 2 | 3,
    })),
  ).flat();

  const config: QuizConfig = {
    mode: 'practice',
    domains: [1, 2],
    count: 10,
    diff: 0,
    type: 'all',
    mistakesOnly: false,
    timed: false,
  };

  it('respects domain and difficulty filters without duplicates', () => {
    const picked = pickQuestions(pool, { ...config, diff: 3 }, new Set(), seeded(1));
    expect(picked.length).toBe(10);
    expect(new Set(picked.map((q) => q.id)).size).toBe(10);
    expect(picked.every((q) => q.diff === 3 && ['1', '2'].includes(q.id.charAt(1)))).toBeTrue();
  });

  it('only returns saved mistakes when asked', () => {
    const mistakes = new Set(['D1-004', 'D2-007']);
    const picked = pickQuestions(pool, { ...config, mistakesOnly: true }, mistakes, seeded(2));
    expect(picked.map((q) => q.id).sort()).toEqual(['D1-004', 'D2-007']);
  });

  it('distributes exam questions by domain weight', () => {
    const picked = pickQuestions(
      pool,
      { ...config, mode: 'exam', domains: [1, 2, 3, 4, 5], count: 50 },
      new Set(),
      seeded(3),
    );
    expect(picked.length).toBe(50);
    const fromDomain1 = picked.filter((q) => q.id.startsWith('D1')).length;
    expect(fromDomain1).toBe(domainQuotas([1, 2, 3, 4, 5], 50).get(1) ?? -1);
  });
});

describe('shuffleOptions', () => {
  it('keeps the same correct option text after shuffling', () => {
    for (let seed = 1; seed < 20; seed++) {
      const shuffled = shuffleOptions(multi, seeded(seed));
      const correctText = (shuffled.ans as number[]).map((i) => shuffled.opts?.[i]).sort();
      expect(correctText).toEqual(['a', 'c']);
      expect([...(shuffled.opts ?? [])].sort()).toEqual(['a', 'b', 'c', 'd']);
    }
  });

  it('spreads the correct answer across positions', () => {
    const positions = new Set<number>();
    const rnd = seeded(7);
    for (let i = 0; i < 40; i++) positions.add((shuffleOptions(mcq, rnd).ans as number[])[0]);
    expect(positions.size).toBe(4);
  });

  it('does not touch yes/no or ordering questions', () => {
    expect(shuffleOptions(yesno)).toBe(yesno);
    expect(shuffleOptions(order)).toBe(order);
  });
});

describe('initialAnswer', () => {
  it('scrambles ordering questions so they do not start already correct', () => {
    for (let seed = 1; seed < 30; seed++) {
      const start = initialAnswer(order, seeded(seed)) as number[];
      expect([...start].sort()).toEqual([0, 1, 2, 3]);
      expect(isCorrect(order, start)).toBeFalse();
    }
  });

  it('leaves other question types unanswered', () => {
    expect(initialAnswer(mcq)).toBeNull();
  });
});
