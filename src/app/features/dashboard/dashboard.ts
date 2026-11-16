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
import { Language } from '../../i18n/language';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly progress = inject(Progress);
  private readonly bank = inject(QuestionBank);
  private readonly sizes = signal<Record<number, number>>({});

  protected readonly t = inject(Language).t;
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
    afterNextRender(async () => {
      const entries = await Promise.all(
        DOMAINS.map(async (d) => [d.id, (await this.bank.domain(d.id)).length] as const),
      );
      this.sizes.set(Object.fromEntries(entries));
    });
  }
}
