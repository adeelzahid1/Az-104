import { Question } from '../data/schema';
import { Answer, isCorrect } from './quiz-logic';

/**
 * Parts of a mock exam, like the real one: once a part is finished it can't be opened again.
 * In a series (the same problem with several solutions) there is no way back to the previous
 * question either.
 */
export interface ExamPart {
  kind: 'main' | 'series' | 'case';
  /** Index of the first question, and the index after the last one. */
  start: number;
  end: number;
}

const kindOf = (q: Question): ExamPart['kind'] => (q.caseId ? 'case' : q.set ? 'series' : 'main');

/** Splits an exam into runs of questions of the same kind. */
export function examParts(questions: readonly Question[]): ExamPart[] {
  const parts: ExamPart[] = [];
  questions.forEach((q, i) => {
    const kind = kindOf(q);
    const last = parts.at(-1);
    if (last && last.kind === kind) last.end = i + 1;
    else parts.push({ kind, start: i, end: i + 1 });
  });
  return parts;
}

/** One point for every separate answer, as Microsoft usually scores multi-part questions. */
export function maxPoints(q: Question): number {
  switch (q.type) {
    case 'multi':
      return q.ans.length;
    case 'yesno':
      return q.stmts?.length ?? 1;
    case 'dropdown':
      return q.blanks?.length ?? 1;
    case 'match':
      return q.items?.length ?? 1;
    default:
      return 1;
  }
}

/** Points earned, with partial credit. Picking too many options cancels out correct ones. */
export function earnedPoints(q: Question, a: Answer | null): number {
  if (!a) return 0;
  switch (q.type) {
    case 'multi': {
      const expected = q.ans as number[];
      const picked = new Set(a as number[]);
      const hits = expected.filter((i) => picked.has(i)).length;
      return Math.max(0, hits - Math.max(0, picked.size - expected.length));
    }
    case 'yesno':
    case 'dropdown':
    case 'match':
      return q.ans.filter((v, i) => v === a[i]).length;
    default:
      return isCorrect(q, a) ? 1 : 0;
  }
}
