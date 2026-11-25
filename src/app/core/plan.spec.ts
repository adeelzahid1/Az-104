import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Question } from '../data/schema';
import { BackupService, parseBackup } from './backup';
import { MockHistory } from './mock-history';
import { Plan } from './plan';
import { PlanInput, SectionState, buildTasks, dayKey, dayStart, daysBetween, phaseOf, priority } from './plan-logic';
import { Progress } from './progress';
import { QuestionBank } from './question-bank';
import { QuizConfig, pickQuestions } from './quiz-logic';
import { estimate, questionScore, readiness } from './readiness';
import { StudyProgress } from './study-progress';

const KEYS = ['az104-session-v1', 'az104-progress-v1', 'az104-study-v1', 'az104-plan-v1', 'az104-mocks-v1'];

const domains = [
  { id: 1, weight: 0.6 },
  { id: 2, weight: 0.4 },
];

const section = (id: string, weight: number, n = 0, sum = 0): SectionState => ({
  id,
  weight,
  size: 40,
  evidence: n ? { n, sum } : undefined,
});

const input = (over: Partial<PlanInput> = {}): PlanInput => ({
  daysLeft: 40,
  minutes: 60,
  sections: [section('1.1', 0.05), section('1.2', 0.03), section('1.3', 0.04)],
  due: 0,
  mistakeIds: [],
  lastMockDays: 1,
  ...over,
});

const question = (id: string, sub: string): Question => ({
  id,
  sub,
  type: 'mcq',
  diff: 2,
  q: 'Q',
  opts: ['a', 'b', 'c', 'd'],
  ans: [1],
  exp: 'E',
  link: 'https://learn.microsoft.com',
});

describe('readiness', () => {
  it('lets the last answer count most', () => {
    expect(questionScore({ seen: 2, correct: 1, last: true })).toBeCloseTo(0.85);
    expect(questionScore({ seen: 2, correct: 1, last: false })).toBeCloseTo(0.15);
  });

  it('gives no number while a domain has too few answers', () => {
    const r = readiness(domains, new Map([[1, { n: 50, sum: 50 }], [2, { n: 4, sum: 4 }]]), []);
    expect(r.overall).toBeNull();
    expect(r.domains[1]).toEqual({ id: 2, n: 4, value: null, missing: 11 });
  });

  it('weights domains like the exam and is careful with few answers', () => {
    const evidence = new Map([[1, { n: 90, sum: 90 }], [2, { n: 90, sum: 0 }]]);
    expect(readiness(domains, evidence, []).overall).toBe(59);
    expect(estimate({ n: 10, sum: 10 })).toBe(0.75);
  });

  it('counts the last three long mock exams for 40%', () => {
    const evidence = new Map([[1, { n: 990, sum: 990 }], [2, { n: 990, sum: 990 }]]);
    const mocks = [
      { t: 1, total: 50, correct: 0 },
      { t: 2, total: 50, correct: 25 },
      { t: 3, total: 50, correct: 25 },
      { t: 4, total: 50, correct: 25 },
      { t: 5, total: 10, correct: 0 },
    ];
    const r = readiness(domains, evidence, mocks);
    expect(r.mocks).toBe(50);
    expect(r.overall).toBe(80);
  });
});

describe('plan rules', () => {
  it('counts calendar days', () => {
    expect(daysBetween('2026-11-25', '2027-01-11')).toBe(47);
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(dayKey(dayStart('2027-01-11'))).toBe('2027-01-11');
  });

  it('knows the phase', () => {
    expect([40, 15, 14, 3, 2, 1, 0, -1].map(phaseOf)).toEqual([
      'learn', 'learn', 'review', 'review', 'light', 'light', 'exam', 'past',
    ]);
  });

  it('starts with a mock exam when there was none', () => {
    expect(buildTasks(input({ lastMockDays: null }))).toEqual([{ kind: 'mock', target: 20 }]);
    expect(buildTasks(input({ lastMockDays: 7, minutes: 90 }))).toEqual([{ kind: 'mock', target: 40 }]);
  });

  it('puts the heaviest and weakest sections first', () => {
    expect(priority(section('a', 0.05, 30, 30))).toBeLessThan(priority(section('b', 0.03)));
    expect(buildTasks(input())).toEqual([
      { kind: 'section', section: '1.1', target: 10 },
      { kind: 'section', section: '1.3', target: 10 },
    ]);
  });

  it('mixes domains', () => {
    const sections = [section('3.1', 0.05), section('3.2', 0.04), section('1.1', 0.03)];
    expect(buildTasks(input({ sections })).map((t) => t.kind === 'section' && t.section)).toEqual(['3.1', '1.1']);
  });

  it('keeps within the time available', () => {
    for (const minutes of [30, 60, 90] as const) {
      const mistakeIds = Array.from({ length: 50 }, (_, i) => `D1-${String(i).padStart(3, '0')}`);
      const spent = buildTasks(input({ minutes, due: 100, mistakeIds })).reduce((sum, t) => {
        if (t.kind === 'cards') return sum + t.target * 0.5;
        if (t.kind === 'mistakes') return sum + t.ids.length * 1.5;
        return t.kind === 'section' ? sum + t.target * 2 : sum;
      }, 0);
      expect(spent).toBeLessThanOrEqual(minutes);
    }
  });

  it('starts nothing new in the last two weeks, and only revises at the very end', () => {
    const sections = [section('1.1', 0.05), section('1.2', 0.03, 5, 2)];
    expect(buildTasks(input({ daysLeft: 10, sections }))).toEqual([{ kind: 'section', section: '1.2', target: 20 }]);
    expect(buildTasks(input({ daysLeft: 1, due: 4 }))).toEqual([{ kind: 'cards', target: 4 }, { kind: 'cheat' }]);
    expect(buildTasks(input({ daysLeft: 0 }))).toEqual([{ kind: 'cheat' }]);
    expect(buildTasks(input({ daysLeft: -1 }))).toEqual([]);
  });
});

describe('section practice', () => {
  it('prefers questions that were not answered before', () => {
    const config: QuizConfig = {
      mode: 'practice',
      domains: [1],
      count: 2,
      diff: 0,
      type: 'all',
      mistakesOnly: false,
      timed: false,
      subs: ['RBAC', 'Custom roles'],
    };
    const pool = [question('D1-001', 'RBAC'), question('D1-002', 'Custom roles'), question('D1-003', 'RBAC'), question('D1-004', 'Locks')];
    const ids = pickQuestions(pool, config, new Set(), Math.random, new Set(['D1-001'])).map((q) => q.id);
    expect(ids.sort()).toEqual(['D1-002', 'D1-003']);
  });
});

describe('Plan service', () => {
  let before: (string | null)[];

  beforeEach(() => {
    before = KEYS.map((k) => localStorage.getItem(k));
    KEYS.forEach((k) => localStorage.removeItem(k));
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: QuestionBank, useValue: { domains: async () => [question('D1-001', 'RBAC')], cases: async () => ({}) } },
      ],
    });
  });

  afterEach(() => {
    KEYS.forEach((k, i) => (before[i] === null ? localStorage.removeItem(k) : localStorage.setItem(k, before[i]!)));
  });

  const inDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return dayKey(d.getTime());
  };

  it('keeps the plan of the day while the learner works on it', async () => {
    const plan = TestBed.inject(Plan);
    plan.setExam(inDays(40));
    await plan.load();
    expect(plan.tasks()).toEqual([{ task: { kind: 'mock', target: 20 }, done: 0, target: 1 }]);

    TestBed.inject(MockHistory).add({ t: Date.now(), total: 20, correct: 12 });
    await plan.load();
    expect(plan.tasks()[0].done).toBe(1);

    plan.renew();
    const [first] = plan.tasks();
    expect(first.task.kind).toBe('section');
  });

  it('counts answers, flashcards and cleared mistakes of today', async () => {
    const plan = TestBed.inject(Plan);
    const progress = TestBed.inject(Progress);
    const study = TestBed.inject(StudyProgress);
    TestBed.inject(MockHistory).add({ t: Date.now(), total: 20, correct: 12 });
    progress.record([{ q: question('D1-001', 'RBAC'), correct: false }]);
    study.rate('D1-001', 'good', Date.now() - 3 * 86_400_000);
    plan.setExam(inDays(40));
    await plan.load();
    const kinds = () => Object.fromEntries(plan.tasks().map((x) => [x.task.kind, x.done]));
    expect(kinds()['cards']).toBe(0);
    expect(kinds()['mistakes']).toBe(0);
    study.rate('D1-001', 'again');
    progress.record([{ q: question('D1-001', 'RBAC'), correct: true }]);
    expect(kinds()['cards']).toBe(1);
    expect(kinds()['mistakes']).toBe(1);
  });

  it('is part of the backup, and old backups still work', () => {
    const plan = TestBed.inject(Plan);
    const backups = TestBed.inject(BackupService);
    plan.setExam('2027-02-01');
    plan.setMinutes(90);
    plan.toggleSkill('Create a virtual machine', 'lab');
    TestBed.inject(MockHistory).add({ t: 5, total: 50, correct: 40 });
    const file = JSON.parse(JSON.stringify(backups.create()));

    plan.restore(null);
    TestBed.inject(MockHistory).replace([]);
    expect(plan.skills()).toEqual({});
    backups.restore(parseBackup(JSON.stringify(file))!);
    expect([plan.exam(), plan.minutes()]).toEqual(['2027-02-01', 90]);
    expect(plan.skills()).toEqual({ 'Create a virtual machine': { lab: true } });
    expect(TestBed.inject(MockHistory).results()).toEqual([{ t: 5, total: 50, correct: 40 }]);

    delete file.plan;
    delete file.mocks;
    backups.restore(parseBackup(JSON.stringify(file))!);
    expect(plan.exam()).toBe('2027-02-01');
    expect(TestBed.inject(MockHistory).results().length).toBe(1);
  });

  it('ignores an impossible date', () => {
    const plan = TestBed.inject(Plan);
    plan.setExam('2027-02-01');
    plan.setExam('2027-02-31');
    plan.setExam('');
    expect(plan.exam()).toBe('2027-02-01');
  });
});
