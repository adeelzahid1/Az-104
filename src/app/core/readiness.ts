/** What the app knows about one answered question. */
export interface AnswerStat {
  seen: number;
  correct: number;
  /** Result of the most recent attempt. */
  last: boolean;
}

/** Number of answered questions and the sum of their scores (0 to 1 each). */
export interface Evidence {
  n: number;
  sum: number;
}

export interface MockResult {
  /** When the exam ended. */
  t: number;
  total: number;
  correct: number;
}

export interface Readiness {
  /** 0 to 100, or null while a domain has too few answers. */
  overall: number | null;
  domains: { id: number; n: number; value: number | null; missing: number }[];
  /** Average of the recent mock exams, 0 to 100. */
  mocks: number | null;
}

/** Answers needed in a domain before it gets a number. */
export const MIN_ANSWERS = 15;
/** Mock exams shorter than this say too little. */
export const MIN_MOCK = 20;
const RECENT_MOCKS = 3;
const MOCK_SHARE = 0.4;

/** The most recent answer counts most; older attempts still count a little. */
export function questionScore(s: AnswerStat): number {
  return 0.7 * (s.last ? 1 : 0) + 0.3 * (s.seen ? s.correct / s.seen : 0);
}

export function addEvidence(e: Evidence | undefined, s: AnswerStat): Evidence {
  return { n: (e?.n ?? 0) + 1, sum: (e?.sum ?? 0) + questionScore(s) };
}

/** Estimated share of correct answers; pulled toward one half while there are few answers. */
export function estimate(e: Evidence | undefined): number {
  const pull = 10;
  return ((e?.sum ?? 0) + 0.5 * pull) / ((e?.n ?? 0) + pull);
}

const percent = (x: number) => Math.round(x * 100);

/** How ready the learner is, weighted like the exam. Recent mock exams count for 40%. */
export function readiness(
  domains: { id: number; weight: number }[],
  evidence: ReadonlyMap<number, Evidence>,
  mocks: readonly MockResult[],
): Readiness {
  const rows = domains.map((d) => {
    const e = evidence.get(d.id);
    const n = e?.n ?? 0;
    return {
      id: d.id,
      n,
      value: n >= MIN_ANSWERS ? percent(estimate(e)) : null,
      missing: Math.max(0, MIN_ANSWERS - n),
    };
  });
  const recent = [...mocks]
    .filter((m) => m.total >= MIN_MOCK)
    .sort((a, b) => b.t - a.t)
    .slice(0, RECENT_MOCKS);
  const mockAverage = recent.length
    ? recent.reduce((sum, m) => sum + m.correct / m.total, 0) / recent.length
    : null;
  if (rows.some((r) => r.value === null)) {
    return { overall: null, domains: rows, mocks: mockAverage === null ? null : percent(mockAverage) };
  }
  const totalWeight = domains.reduce((sum, d) => sum + d.weight, 0);
  const practice =
    domains.reduce((sum, d) => sum + d.weight * estimate(evidence.get(d.id)), 0) / totalWeight;
  const overall =
    mockAverage === null ? practice : (1 - MOCK_SHARE) * practice + MOCK_SHARE * mockAverage;
  return {
    overall: percent(overall),
    domains: rows,
    mocks: mockAverage === null ? null : percent(mockAverage),
  };
}
