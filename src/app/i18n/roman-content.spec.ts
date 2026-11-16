import { Question } from '../data/schema';
import { isCorrect, shuffleOptions } from '../core/quiz-logic';
import { localizeQuestion } from './roman-content';

const base = { sub: 'Test', diff: 2 as const, exp: 'Why', link: 'https://learn.microsoft.com' };

const mcq: Question = {
  ...base,
  id: 'D1-001',
  type: 'mcq',
  q: 'Which one?',
  opts: ['one', 'two', 'three', 'four'],
  ans: [2],
};

describe('localizeQuestion', () => {
  it('returns the English question when there is no translation', () => {
    expect(localizeQuestion(mcq, undefined)).toBe(mcq);
  });

  it('translates the stem, options and explanation', () => {
    const ro = localizeQuestion(mcq, { q: 'Kaun sa?', opts: ['ek', 'do', 'teen', 'chaar'], exp: 'Kyun' });
    expect(ro.q).toBe('Kaun sa?');
    expect(ro.opts).toEqual(['ek', 'do', 'teen', 'chaar']);
    expect(ro.exp).toBe('Kyun');
    expect(ro.ans).toEqual([2]);
  });

  it('keeps translated options in the shuffled order, so the answer key still matches', () => {
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    const shuffled = shuffleOptions(mcq, rnd);
    const ro = localizeQuestion(shuffled, { opts: ['ek', 'do', 'teen', 'chaar'] });
    const english = ['one', 'two', 'three', 'four'];
    const roman = ['ek', 'do', 'teen', 'chaar'];
    shuffled.opts!.forEach((opt, i) => expect(ro.opts![i]).toBe(roman[english.indexOf(opt)]));
    expect(ro.opts![(shuffled.ans as number[])[0]]).toBe('teen');
    expect(isCorrect(ro, shuffled.ans as number[])).toBeTrue();
  });

  it('falls back to English for a list whose length does not match', () => {
    const ro = localizeQuestion(mcq, { q: 'Kaun sa?', opts: ['ek', 'do'] });
    expect(ro.q).toBe('Kaun sa?');
    expect(ro.opts).toEqual(mcq.opts);
  });

  it('never adds a context paragraph the English question does not have', () => {
    expect(localizeQuestion(mcq, { ctx: 'Extra' }).ctx).toBeUndefined();
  });

  it('translates yes/no statements, ordering items and matching targets', () => {
    const yesno: Question = { ...base, id: 'D1-002', type: 'yesno', q: 'Answer', stmts: ['a', 'b'], ans: [true, false] };
    expect(localizeQuestion(yesno, { stmts: ['A', 'B'] }).stmts).toEqual(['A', 'B']);
    const match: Question = {
      ...base,
      id: 'D1-003',
      type: 'match',
      q: 'Match',
      items: ['x', 'y'],
      targets: ['p', 'q', 'r'],
      ans: [0, 2],
    };
    const ro = localizeQuestion(match, { items: ['X', 'Y'], targets: ['P', 'Q', 'R'] });
    expect(ro.items).toEqual(['X', 'Y']);
    expect(ro.targets).toEqual(['P', 'Q', 'R']);
  });
});
