import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DOMAINS } from '../../data/schema';
import { PASS_MARK, QuizService } from '../../core/quiz';
import { Language } from '../../i18n/language';
import { CasePanel } from '../../shared/case-panel';
import { LoadError } from '../../shared/load-error';
import { QuestionView } from '../../shared/question-view';

@Component({
  selector: 'app-results',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuestionView, CasePanel, LoadError, RouterLink],
  templateUrl: './results.html',
  styleUrl: './results.css',
})
export class Results {
  private readonly quiz = inject(QuizService);
  private readonly router = inject(Router);
  protected readonly t = inject(Language).t;

  protected readonly result = this.quiz.result;
  protected readonly passMark = PASS_MARK;
  protected readonly onlyWrong = signal(true);
  protected readonly busy = signal(false);
  protected readonly loadFailed = signal(false);

  protected readonly reviewItems = computed(() => {
    const r = this.result();
    if (!r) return [];
    const cases = this.quiz.cases();
    const numbered = r.items.map((item, i) => ({
      ...item,
      n: i + 1,
      caseStudy: item.q.caseId ? (cases[item.q.caseId] ?? null) : null,
    }));
    return this.onlyWrong() ? numbered.filter((i) => !i.correct) : numbered;
  });

  protected readonly duration = computed(() => {
    const ms = this.result()?.durationMs ?? 0;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return this.t().results.duration(minutes, seconds);
  });

  protected readonly timePerQuestion = computed(() => {
    const r = this.result();
    if (!r || !r.total) return '';
    return this.t().results.perQuestion(Math.round(r.durationMs / r.total / 1000));
  });

  protected pct(correct: number, total: number): number {
    return total ? Math.round((correct / total) * 100) : 0;
  }

  protected async practiceMistakes(): Promise<void> {
    this.busy.set(true);
    try {
      const n = await this.quiz.start({
        mode: 'practice',
        domains: DOMAINS.map((d) => d.id),
        count: 20,
        diff: 0,
        type: 'all',
        mistakesOnly: true,
        timed: false,
      });
      if (n) await this.router.navigate(['/quiz']);
    } catch {
      this.loadFailed.set(true);
    } finally {
      this.busy.set(false);
    }
  }
}
