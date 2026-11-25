import { Injectable, computed, inject, signal } from '@angular/core';
import { CaseStudy, DOMAINS, Question } from '../data/schema';
import { MockHistory } from './mock-history';
import { Progress } from './progress';
import { QuestionBank } from './question-bank';
import { readSession, writeSession } from './session-store';
import {
  Answer,
  QuizConfig,
  domainOf,
  initialAnswer,
  isAnswered,
  isCorrect,
  pickQuestions,
  shuffleOptions,
} from './quiz-logic';

export interface Session {
  config: QuizConfig;
  questions: Question[];
  answers: (Answer | null)[];
  /** Practice mode: answer already checked (feedback shown and recorded). */
  checked: boolean[];
  current: number;
  startedAt: number;
  deadline: number | null;
  finishedAt: number | null;
}

export interface QuizResult {
  mode: QuizConfig['mode'];
  total: number;
  correct: number;
  /** Simple percentage scaled to 1000; the real exam uses a non-linear scale. */
  score: number;
  passed: boolean;
  durationMs: number;
  byDomain: { id: number; name: string; total: number; correct: number }[];
  items: { q: Question; answer: Answer | null; correct: boolean }[];
}

/** The real exam allows roughly 100 minutes for about 50 questions. */
const SECONDS_PER_QUESTION = 120;
export const PASS_MARK = 700;

@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly bank = inject(QuestionBank);
  private readonly progress = inject(Progress);
  private readonly mocks = inject(MockHistory);
  private readonly saved = readSession();
  private readonly state = signal<Session | null>(this.saved?.session ?? null);
  private readonly caseStudies = signal<Record<string, CaseStudy>>(this.saved?.cases ?? {});

  readonly session = this.state.asReadonly();
  /** Case study texts for the questions in the current session. */
  readonly cases = this.caseStudies.asReadonly();

  /** A quiz that was started but not finished; it survives a page refresh. */
  readonly unfinished = computed(() => {
    const s = this.state();
    return s && s.finishedAt === null ? s : null;
  });

  readonly result = computed<QuizResult | null>(() => {
    const s = this.state();
    if (!s || s.finishedAt === null) return null;
    const items = s.questions.map((q, i) => ({
      q,
      answer: s.answers[i],
      correct: isCorrect(q, s.answers[i]),
    }));
    const correct = items.filter((i) => i.correct).length;
    const score = Math.round((correct / items.length) * 1000);
    const byDomain = DOMAINS.map((d) => {
      const inDomain = items.filter((i) => domainOf(i.q) === d.id);
      return {
        id: d.id,
        name: d.name,
        total: inDomain.length,
        correct: inDomain.filter((i) => i.correct).length,
      };
    }).filter((d) => d.total > 0);
    return {
      mode: s.config.mode,
      total: items.length,
      correct,
      score,
      passed: score >= PASS_MARK,
      durationMs: s.finishedAt - s.startedAt,
      byDomain,
      items,
    };
  });

  /** Builds a new session. Resolves to the number of questions selected (0 = none matched). */
  async start(config: QuizConfig): Promise<number> {
    const [pool, cases] = await Promise.all([
      this.bank.domains(config.domains),
      this.bank.cases(),
    ]);
    const questions = pickQuestions(
      pool,
      config,
      new Set(this.progress.mistakeIds()),
      Math.random,
      new Set(Object.keys(this.progress.stats())),
    ).map((q) => shuffleOptions(q));
    if (!questions.length) return 0;
    const used = new Set(questions.map((q) => q.caseId));
    this.caseStudies.set(Object.fromEntries(Object.entries(cases).filter(([id]) => used.has(id))));
    const now = Date.now();
    this.state.set({
      config,
      questions,
      answers: questions.map((q) => initialAnswer(q)),
      checked: questions.map(() => false),
      current: 0,
      startedAt: now,
      deadline:
        config.mode === 'exam' && config.timed
          ? now + questions.length * SECONDS_PER_QUESTION * 1000
          : null,
      finishedAt: null,
    });
    this.save();
    return questions.length;
  }

  answer(value: Answer): void {
    this.patch((s) =>
      s.checked[s.current]
        ? s
        : { ...s, answers: s.answers.map((a, i) => (i === s.current ? value : a)) },
    );
  }

  goTo(index: number): void {
    this.patch((s) => ({ ...s, current: Math.min(Math.max(index, 0), s.questions.length - 1) }));
  }

  /** Practice mode: reveal the answer for the current question and record the attempt. */
  check(): void {
    const s = this.state();
    if (!s || s.finishedAt !== null || s.checked[s.current]) return;
    const q = s.questions[s.current];
    const a = s.answers[s.current];
    if (!isAnswered(q, a)) return;
    this.progress.record([{ q, correct: isCorrect(q, a) }]);
    this.patch((cur) => ({
      ...cur,
      checked: cur.checked.map((c, i) => (i === cur.current ? true : c)),
    }));
  }

  finish(): void {
    const s = this.state();
    if (!s || s.finishedAt !== null) return;
    const unrecorded = s.questions
      .map((q, i) => ({ q, a: s.answers[i], i }))
      .filter((x) => !s.checked[x.i] && (s.config.mode === 'exam' || isAnswered(x.q, x.a)));
    this.progress.record(unrecorded.map((x) => ({ q: x.q, correct: isCorrect(x.q, x.a) })));
    // When the time ran out while the page was closed, the exam ended at the deadline.
    const finishedAt = Math.min(Date.now(), s.deadline ?? Infinity);
    this.patch((cur) => ({ ...cur, finishedAt }));
    const answered = s.questions.filter((q, i) => isAnswered(q, s.answers[i])).length;
    // An exam that was mostly skipped says nothing about the learner.
    if (s.config.mode === 'exam' && answered * 2 >= s.questions.length) {
      const correct = s.questions.filter((q, i) => isCorrect(q, s.answers[i])).length;
      this.mocks.add({ t: finishedAt, total: s.questions.length, correct });
    }
  }

  private patch(fn: (s: Session) => Session): void {
    this.state.update((s) => (s ? fn(s) : s));
    this.save();
  }

  private save(): void {
    const session = this.state();
    if (session) writeSession({ session, cases: this.caseStudies() });
  }
}
