import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DOMAINS } from '../../data/schema';
import { QuizService } from '../../core/quiz';
import { Answer, domainOf, isAnswered } from '../../core/quiz-logic';
import { QuestionView } from '../../shared/question-view';

const DIFFICULTY = ['', 'Easy', 'Medium', 'Hard'];

@Component({
  selector: 'app-quiz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuestionView, RouterLink],
  templateUrl: './quiz.html',
  styleUrl: './quiz.css',
})
export class Quiz {
  private readonly quiz = inject(QuizService);
  private readonly router = inject(Router);
  private readonly now = signal(Date.now());

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
  protected readonly meta = computed(() => {
    const q = this.question();
    if (!q) return '';
    const domain = DOMAINS.find((d) => d.id === domainOf(q));
    return `Domain ${domain?.id} · ${q.sub} · ${DIFFICULTY[q.diff]}`;
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

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const timer = setInterval(() => this.now.set(Date.now()), 1000);
      destroyRef.onDestroy(() => clearInterval(timer));
    });
    effect(() => {
      if (this.remainingMs() === 0 && this.session()?.finishedAt === null) this.finish();
    });
  }

  protected onAnswer(value: Answer): void {
    this.quiz.answer(value);
  }

  protected check(): void {
    this.quiz.check();
  }

  protected goTo(i: number): void {
    this.quiz.goTo(i);
  }

  protected finish(): void {
    this.quiz.finish();
    this.router.navigate(['/results']);
  }
}
