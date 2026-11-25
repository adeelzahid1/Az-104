import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { QuizService } from '../../core/quiz';
import { Answer, domainOf, isAnswered } from '../../core/quiz-logic';
import { registerShortcuts } from '../../core/shortcuts';
import { CasePanel } from '../../shared/case-panel';
import { FullScreenButton } from '../../shared/full-screen-button';
import { QuestionView } from '../../shared/question-view';
import { Language } from '../../i18n/language';
import { ExamReview, ReviewRow } from './exam-review';

@Component({
  selector: 'app-quiz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuestionView, CasePanel, ExamReview, FullScreenButton, RouterLink],
  templateUrl: './quiz.html',
  styleUrl: './quiz.css',
})
export class Quiz {
  private readonly quiz = inject(QuizService);
  private readonly router = inject(Router);
  private readonly now = signal(Date.now());
  protected readonly t = inject(Language).t;

  protected readonly session = this.quiz.session;
  protected readonly isExam = computed(() => this.session()?.config.mode === 'exam');
  protected readonly index = computed(() => this.session()?.current ?? 0);
  protected readonly total = computed(() => this.session()?.questions.length ?? 0);
  protected readonly question = computed(() => {
    const s = this.session();
    return s ? s.questions[s.current] : null;
  });
  protected readonly currentAnswer = computed(() => {
    const s = this.session();
    return s ? s.answers[s.current] : null;
  });
  protected readonly checked = computed(() => {
    const s = this.session();
    return s ? s.checked[s.current] : false;
  });
  protected readonly canCheck = computed(() => {
    const q = this.question();
    return !!q && isAnswered(q, this.currentAnswer());
  });
  protected readonly answered = computed(() => {
    const s = this.session();
    return s ? s.questions.map((q, i) => isAnswered(q, s.answers[i])) : [];
  });
  protected readonly answeredCount = computed(() => this.answered().filter(Boolean).length);
  protected readonly caseStudy = computed(() => {
    const id = this.question()?.caseId;
    return id ? (this.quiz.cases()[id] ?? null) : null;
  });
  /** e.g. "question 2 of 5" within the current case study. */
  protected readonly casePart = computed(() => {
    const s = this.session();
    const id = this.question()?.caseId;
    if (!s || !id) return '';
    const parts = s.questions.map((q, i) => ({ q, i })).filter((x) => x.q.caseId === id);
    const position = parts.findIndex((x) => x.i === s.current) + 1;
    return this.t().quiz.casePart(position, parts.length);
  });
  protected readonly meta = computed(() => {
    const q = this.question();
    if (!q) return '';
    const t = this.t();
    return `${t.domainN(domainOf(q))} · ${q.sub} · ${t.diff[q.diff]}`;
  });
  protected readonly part = computed(() => {
    const s = this.session();
    return s ? s.parts[s.part] : null;
  });
  protected readonly partNumber = computed(() => (this.session()?.part ?? 0) + 1);
  protected readonly partCount = computed(() => this.session()?.parts.length ?? 1);
  protected readonly lastPart = computed(() => this.partNumber() === this.partCount());
  protected readonly atEnd = computed(() => this.index() === (this.part()?.end ?? 1) - 1);
  protected readonly flagged = computed(() => {
    const s = this.session();
    return s ? s.flagged[s.current] : false;
  });
  /** The review screen of the current part is open. */
  protected readonly reviewing = linkedSignal({ source: this.partNumber, computation: () => false });
  protected readonly confirmSubmit = signal(false);
  /** Questions of the current part. */
  protected readonly rows = computed<ReviewRow[]>(() => {
    const s = this.session();
    const p = this.part();
    if (!s || !p) return [];
    return s.questions
      .map((q, index) => ({ index, answered: isAnswered(q, s.answers[index]), flagged: s.flagged[index] }))
      .slice(p.start, p.end);
  });

  protected readonly remainingMs = computed(() => {
    const deadline = this.session()?.deadline;
    return deadline ? Math.max(0, deadline - this.now()) : null;
  });
  protected readonly remainingLabel = computed(() => {
    const ms = this.remainingMs();
    if (ms === null) return '';
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  });
  protected readonly lowTime = computed(() => {
    const ms = this.remainingMs();
    return ms !== null && ms < 5 * 60 * 1000;
  });

  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private shownIndex = -1;

  constructor() {
    registerShortcuts(
      () => this.t().keys.quiz,
      () => {
        const tk = this.t().keys;
        const te = this.t().exam;
        const tq = this.t().quiz;
        const series = () => this.part()?.kind === 'series';
        return [
          {
            keys: ['Enter'],
            label: this.isExam() ? tq.next : tk.checkNext,
            run: () => this.enter(),
            // In a problem-solution set the next question can't be undone: only with an answer.
            when: () => this.active() && !this.reviewing() && (!series() || this.canCheck()),
          },
          {
            keys: ['ArrowRight'],
            label: tq.next,
            run: () => (this.isExam() ? this.next() : this.goTo(this.index() + 1)),
            when: () => this.active() && !series() && !this.reviewing() && (this.isExam() || this.index() < this.total() - 1),
          },
          {
            keys: ['ArrowLeft'],
            label: tq.previous,
            run: () => this.goTo(this.reviewing() ? this.index() : this.index() - 1),
            when: () => this.active() && !series() && (this.reviewing() || this.index() > (this.part()?.start ?? 0)),
          },
          ...(this.isExam()
            ? [{ keys: ['m'], label: te.flag, run: () => this.toggleFlag(), when: () => this.active() && !series() }]
            : []),
        ];
      },
    );
    // A new question takes the focus, so that Enter checks it instead of pressing the last button again.
    effect(() => {
      const index = this.index();
      const heading = this.heading()?.nativeElement;
      if (!heading) return;
      untracked(() => {
        if (this.shownIndex !== -1 && this.shownIndex !== index) heading.focus();
        this.shownIndex = index;
      });
    });
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const timer = setInterval(() => this.now.set(Date.now()), 1000);
      destroyRef.onDestroy(() => clearInterval(timer));
    });
    effect(() => {
      if (this.remainingMs() === 0 && this.session()?.finishedAt === null) this.finish();
    });
  }

  private readonly touched = linkedSignal({ source: this.index, computation: () => false });

  private active(): boolean {
    return this.session()?.finishedAt === null;
  }

  /** Enter: check the answer, then go on. */
  private enter(): void {
    if (this.isExam()) this.next();
    else if (!this.checked()) {
      // Ordering questions start filled in: Enter must not check an order nobody touched.
      if (this.canCheck() && (this.question()?.type !== 'order' || this.touched())) this.check();
    } else if (this.index() < this.total() - 1) this.goTo(this.index() + 1);
    else this.finish();
  }

  protected onAnswer(value: Answer): void {
    this.touched.set(true);
    this.quiz.answer(value);
  }

  protected check(): void {
    this.quiz.check();
  }

  protected goTo(i: number): void {
    this.reviewing.set(false);
    this.confirmSubmit.set(false);
    this.quiz.goTo(i);
  }

  protected toggleFlag(): void {
    this.quiz.toggleFlag();
  }

  /** Exam: the next question, the review screen, or the next part. */
  protected next(): void {
    if (!this.atEnd()) this.goTo(this.index() + 1);
    else if (this.part()?.kind === 'series' && !this.lastPart()) this.proceed();
    else this.reviewing.set(true);
  }

  /** Leaves the current part: opens the next one, or submits the exam. */
  protected proceed(): void {
    if (this.lastPart()) this.finish();
    else this.quiz.nextPart();
  }

  protected submitNow(): void {
    if (this.confirmSubmit()) this.finish();
    else this.confirmSubmit.set(true);
  }

  protected finish(): void {
    this.quiz.finish();
    this.router.navigate(['/results']);
  }
}
