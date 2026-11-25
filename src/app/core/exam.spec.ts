import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Question } from '../data/schema';
import { earnedPoints, examParts, maxPoints } from './exam';
import { MockHistory } from './mock-history';
import { QuestionBank } from './question-bank';
import { QuizService } from './quiz';
import { QuizConfig, pickQuestions } from './quiz-logic';

const KEYS = ['az104-session-v1', 'az104-progress-v1', 'az104-mocks-v1'];

const mcq = (id: string, extra: Partial<Question> = {}): Question => ({
  id,
  sub: 'RBAC',
  type: 'mcq',
  diff: 2,
  q: 'Q',
  opts: ['a', 'b', 'c', 'd'],
  ans: [1],
  exp: 'E',
  link: 'https://learn.microsoft.com',
  ...extra,
});

const id = (d: number, n: number) => `D${d}-${String(n).padStart(3, '0')}`;

const bank: Question[] = [
  ...[1, 2, 3, 4, 5].flatMap((d) => Array.from({ length: 20 }, (_, i) => mcq(id(d, i)))),
  ...[1, 2, 3].map((n) => mcq(id(1, 100 + n), { set: 'S1', opts: ['Yes', 'No'] })),
  ...[1, 2, 3].map((n) => mcq(id(2, 100 + n), { set: 'S2', opts: ['Yes', 'No'] })),
  ...[1, 2, 3, 4, 5].map((n) => mcq(id(3, 100 + n), { caseId: 'C1' })),
];

const config: QuizConfig = {
  mode: 'exam',
  domains: [1, 2, 3, 4, 5],
  count: 30,
  diff: 0,
  type: 'all',
  mistakesOnly: false,
  timed: true,
};

describe('partial credit', () => {
  const multi = mcq('D1-001', { type: 'multi', ans: [0, 2] });
  const yesno = mcq('D1-002', { type: 'yesno', opts: undefined, stmts: ['x', 'y', 'z'], ans: [true, false, true] });

  it('gives a point for every correct choice', () => {
    expect(maxPoints(multi)).toBe(2);
    expect(earnedPoints(multi, [0, 2])).toBe(2);
    expect(earnedPoints(multi, [0, 1])).toBe(1);
    expect(earnedPoints(multi, null)).toBe(0);
  });

  it('gives nothing for picking everything', () => {
    expect(earnedPoints(multi, [0, 1, 2, 3])).toBe(0);
  });

  it('counts each statement, also when some are unanswered', () => {
    expect(maxPoints(yesno)).toBe(3);
    expect(earnedPoints(yesno, [true, true, true])).toBe(2);
    expect(earnedPoints(yesno, [true, null, null])).toBe(1);
  });

  it('has no partial credit for ordering and single answers', () => {
    const order = mcq('D1-003', { type: 'order', items: ['a', 'b', 'c'], ans: [2, 0, 1] });
    expect(earnedPoints(order, [2, 0, 1])).toBe(1);
    expect(earnedPoints(order, [2, 1, 0])).toBe(0);
    expect(earnedPoints(mcq('D1-004'), [0])).toBe(0);
  });
});

describe('exam questions', () => {
  it('ends a large exam with one series and one case study', () => {
    const picked = pickQuestions(bank, config, new Set());
    expect(picked.length).toBe(30);
    expect(examParts(picked)).toEqual([
      { kind: 'main', start: 0, end: 22 },
      { kind: 'series', start: 22, end: 25 },
      { kind: 'case', start: 25, end: 30 },
    ]);
    expect(new Set(picked.slice(22, 25).map((q) => q.set)).size).toBe(1);
  });

  it('has neither in a small exam', () => {
    const picked = pickQuestions(bank, { ...config, count: 20 }, new Set());
    expect(picked.length).toBe(20);
    expect(picked.some((q) => q.set || q.caseId)).toBeFalse();
  });

  it('takes questions that were not answered before', () => {
    const answered = new Set(bank.filter((q) => Number(q.id.slice(3)) < 10 || q.set === 'S1').map((q) => q.id));
    for (let i = 0; i < 5; i++) {
      const picked = pickQuestions(bank, config, new Set(), Math.random, answered);
      expect(picked.filter((q) => answered.has(q.id))).toEqual([]);
    }
  });
});

describe('exam session', () => {
  let before: (string | null)[];
  let quiz: QuizService;

  const create = () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: QuestionBank, useValue: { domains: async () => bank, cases: async () => ({}) } },
      ],
    });
    quiz = TestBed.inject(QuizService);
  };

  beforeEach(async () => {
    before = KEYS.map((k) => localStorage.getItem(k));
    KEYS.forEach((k) => localStorage.removeItem(k));
    create();
    await quiz.start(config);
  });

  afterEach(() => {
    KEYS.forEach((k, i) => (before[i] === null ? localStorage.removeItem(k) : localStorage.setItem(k, before[i]!)));
  });

  const current = () => quiz.session()!.current;

  it('stays inside the current part and never goes back to a finished one', () => {
    quiz.goTo(25);
    expect(current()).toBe(21);
    quiz.nextPart();
    expect(current()).toBe(22);
    quiz.goTo(3);
    expect(current()).toBe(22);
  });

  it('only goes forward in a series', () => {
    quiz.nextPart();
    quiz.goTo(23);
    quiz.goTo(22);
    expect(current()).toBe(23);
    quiz.goTo(30);
    expect(current()).toBe(24);
    quiz.nextPart();
    quiz.goTo(27);
    quiz.goTo(25);
    expect(current()).toBe(25);
    quiz.nextPart();
    expect(quiz.session()!.part).toBe(2);
  });

  it('keeps flags and parts across a refresh', () => {
    quiz.toggleFlag();
    quiz.nextPart();
    create();
    expect(quiz.session()!.flagged[0]).toBeTrue();
    expect(quiz.session()!.part).toBe(1);
  });

  it('opens a session saved by an older version', () => {
    const saved = JSON.parse(localStorage.getItem('az104-session-v1')!);
    for (const key of ['parts', 'part', 'flagged', 'times', 'enteredAt']) delete saved.session[key];
    localStorage.setItem('az104-session-v1', JSON.stringify(saved));
    create();
    expect(quiz.session()!.parts).toEqual([{ kind: 'main', start: 0, end: 30 }]);
    quiz.goTo(29);
    expect(current()).toBe(29);
    quiz.finish();
    expect(quiz.result()!.items.length).toBe(30);
  });

  it('measures the time spent on each question', () => {
    const t0 = quiz.session()!.startedAt;
    const clock = spyOn(Date, 'now');
    clock.and.returnValue(t0 + 40_000);
    quiz.goTo(1);
    clock.and.returnValue(t0 + 50_000);
    quiz.goTo(0);
    clock.and.returnValue(t0 + 55_000);
    quiz.finish();
    expect(quiz.result()!.items.slice(0, 2).map((x) => x.ms)).toEqual([45_000, 10_000]);
  });

  it('scores by points and saves the mock only when at least half was answered', () => {
    const history = TestBed.inject(MockHistory);
    const answerAll = (n: number) => {
      for (let p = 0; p < 3; p++) {
        const { start, end } = quiz.session()!.parts[p];
        for (let i = start; i < end && i < n; i++) {
          quiz.goTo(i);
          quiz.answer(quiz.session()!.questions[i].ans as number[]);
        }
        if (p < 2) quiz.nextPart();
      }
      quiz.finish();
    };
    answerAll(15);
    expect(quiz.result()!.score).toBe(500);
    expect(history.results()).toEqual([jasmine.objectContaining({ total: 30, correct: 15, score: 0.5 })]);
  });

  it('does not save an exam that was mostly skipped', () => {
    quiz.answer([0]);
    quiz.finish();
    expect(TestBed.inject(MockHistory).results()).toEqual([]);
  });
});
