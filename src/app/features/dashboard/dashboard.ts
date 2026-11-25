import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DOMAINS } from '../../data/schema';
import { Progress } from '../../core/progress';
import { QuestionBank } from '../../core/question-bank';
import { StudyProgress } from '../../core/study-progress';
import { QuizService } from '../../core/quiz';
import { Language } from '../../i18n/language';
import { TodayCard } from '../plan/today-card';
import { BackupPanel } from './backup-panel';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, BackupPanel, TodayCard],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly progress = inject(Progress);
  private readonly bank = inject(QuestionBank);
  private readonly quiz = inject(QuizService);
  /** False on the server and during hydration, where saved data isn't known. */
  private readonly inBrowser = signal(false);
  protected readonly showPlan = this.inBrowser.asReadonly();
  protected readonly unfinished = computed(() => (this.inBrowser() ? this.quiz.unfinished() : null));
  private readonly sizes = signal<Record<number, number>>({});

  protected readonly t = inject(Language).t;
  private readonly study = inject(StudyProgress);
  protected readonly studyUnderstood = computed(() => this.study.understoodIds().size);
  protected readonly studyBookmarked = computed(() => this.study.bookmarkedIds().size);
  protected readonly studyDue = computed(() => this.study.dueCount(Date.now()));
  protected readonly overall = this.progress.overall;
  protected readonly mistakeCount = computed(() => this.progress.mistakeIds().length);
  protected readonly totalQuestions = computed(() =>
    Object.values(this.sizes()).reduce((a, b) => a + b, 0),
  );

  protected readonly cards = computed(() => {
    const rows = this.progress.byDomain();
    const sizes = this.sizes();
    return DOMAINS.map((d) => {
      const row = rows.get(d.id);
      const size = sizes[d.id] ?? 0;
      const answered = row?.unique ?? 0;
      return {
        ...d,
        size,
        answered,
        coverage: size ? Math.round((answered / size) * 100) : 0,
        accuracy: row && row.attempts ? Math.round((row.correct / row.attempts) * 100) : null,
        priority: d.weight >= 0.2 ? 'High' : d.weight >= 0.15 ? 'Medium' : 'Low',
      };
    });
  });

  constructor() {
    afterNextRender(() => {
      this.inBrowser.set(true);
      // A domain that can't be downloaded keeps showing "…".
      for (const d of DOMAINS) {
        this.bank.domain(d.id).then(
          (questions) => this.sizes.update((all) => ({ ...all, [d.id]: questions.length })),
          () => undefined,
        );
      }
    });
  }
}
