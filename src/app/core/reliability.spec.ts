import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Question } from '../data/schema';
import { BackupService, parseBackup } from './backup';
import { Progress } from './progress';
import { QuestionBank } from './question-bank';
import { QuizService } from './quiz';
import { QuizConfig, pickQuestions } from './quiz-logic';
import { withRetry } from './retry';
import { readSession } from './session-store';
import { StudyProgress } from './study-progress';

const KEYS = ['az104-session-v1', 'az104-progress-v1', 'az104-study-v1'];

const question = (id: string, sub: string, caseId?: string): Question => ({
  id,
  sub,
  caseId,
  type: 'mcq',
  diff: 2,
  q: 'Q',
  opts: ['a', 'b', 'c', 'd'],
  ans: [1],
  exp: 'E',
  link: 'https://learn.microsoft.com',
});

const config: QuizConfig = {
  mode: 'practice',
  domains: [1],
  count: 10,
  diff: 0,
  type: 'all',
  mistakesOnly: false,
  timed: false,
};

describe('withRetry', () => {
  it('tries again after a failure', async () => {
    let calls = 0;
    const load = async () => {
      if (++calls < 3) throw new Error('reset');
      return 'ok';
    };
    expect(await withRetry(load, 2, 1)).toBe('ok');
    expect(calls).toBe(3);
  });

  it('gives up after the last retry', async () => {
    await expectAsync(withRetry(() => Promise.reject(new Error('down')), 1, 1)).toBeRejectedWithError('down');
  });
});

describe('subtopic practice', () => {
  it('picks only the chosen subtopic, including case study parts', () => {
    const pool = [question('D1-001', 'RBAC'), question('D1-002', 'Locks'), question('D1-003', 'RBAC', 'C1')];
    const ids = pickQuestions(pool, { ...config, subs: ['RBAC'] }, new Set()).map((q) => q.id);
    expect(ids.sort()).toEqual(['D1-001', 'D1-003']);
  });
});

describe('saved progress', () => {
  let before: (string | null)[];

  beforeEach(() => {
    before = KEYS.map((k) => localStorage.getItem(k));
    KEYS.forEach((k) => localStorage.removeItem(k));
  });

  afterEach(() => {
    KEYS.forEach((k, i) => (before[i] === null ? localStorage.removeItem(k) : localStorage.setItem(k, before[i]!)));
  });

  const setup = () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: QuestionBank,
          useValue: {
            domains: async () => [question('D1-001', 'RBAC'), question('D1-002', 'RBAC')],
            cases: async () => ({}),
          },
        },
      ],
    });
  };

  it('keeps a quiz across a page refresh', async () => {
    setup();
    const first = TestBed.inject(QuizService);
    await first.start(config);
    first.answer([2]);
    first.goTo(1);

    setup();
    const second = TestBed.inject(QuizService);
    expect(second.unfinished()?.current).toBe(1);
    expect(second.session()?.answers[0]).toEqual([2]);
    second.finish();
    expect(second.unfinished()).toBeNull();
    expect(second.result()?.total).toBe(2);
  });

  it('ends a timed exam at its deadline when the page was closed', async () => {
    setup();
    const quiz = TestBed.inject(QuizService);
    await quiz.start({ ...config, mode: 'exam', timed: true });
    const { startedAt, deadline } = quiz.session()!;
    spyOn(Date, 'now').and.returnValue(deadline! + 3_600_000);
    quiz.finish();
    expect(quiz.result()?.durationMs).toBe(deadline! - startedAt);
  });

  it('ignores a damaged saved quiz', () => {
    localStorage.setItem('az104-session-v1', '{"session":{"questions":[1],"answers":[]}}');
    expect(readSession()).toBeNull();
    localStorage.setItem('az104-session-v1', 'not json');
    expect(readSession()).toBeNull();
  });

  it('restores a backup and leaves out invalid entries', () => {
    setup();
    const progress = TestBed.inject(Progress);
    const study = TestBed.inject(StudyProgress);
    const backups = TestBed.inject(BackupService);
    progress.record([{ q: question('D1-001', 'RBAC'), correct: false }]);
    study.toggleBookmark('D1-002');
    study.rate('D1-001', 'good', 0);
    const file = JSON.parse(JSON.stringify(backups.create()));
    file.progress['bad'] = { sub: 'x' };
    file.study['D1-003'] = { u: 'yes' };

    progress.reset();
    study.toggleBookmark('D1-002');
    backups.restore(parseBackup(JSON.stringify(file))!);

    expect(progress.mistakeIds()).toEqual(['D1-001']);
    expect(study.isBookmarked('D1-002')).toBeTrue();
    expect(study.isDue('D1-001', Date.now())).toBeTrue();
    expect(Object.keys(study.snapshot()).sort()).toEqual(['D1-001', 'D1-002']);
  });

  it('rejects files that are not a backup', () => {
    expect(parseBackup('hello')).toBeNull();
    expect(parseBackup('{"app":"other"}')).toBeNull();
    expect(parseBackup('null')).toBeNull();
  });
});
