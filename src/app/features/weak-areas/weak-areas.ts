import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DOMAINS } from '../../data/schema';
import { Progress } from '../../core/progress';
import { Language } from '../../i18n/language';

const WEAK_THRESHOLD = 0.7;

@Component({
  selector: 'app-weak-areas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './weak-areas.html',
  styleUrl: './weak-areas.css',
})
export class WeakAreas {
  private readonly progress = inject(Progress);

  protected readonly t = inject(Language).t;
  protected readonly overall = this.progress.overall;
  protected readonly mistakeCount = computed(() => this.progress.mistakeIds().length);
  protected readonly confirmReset = signal(false);

  protected readonly domainRows = computed(() => {
    const rows = this.progress.byDomain();
    return DOMAINS.map((d) => {
      const row = rows.get(d.id);
      const accuracy = row && row.attempts ? row.correct / row.attempts : null;
      return { ...d, row, accuracy, weak: accuracy !== null && accuracy < WEAK_THRESHOLD };
    });
  });

  protected readonly weakSubtopics = computed(() =>
    this.progress.bySubtopic().filter((r) => r.accuracy < WEAK_THRESHOLD),
  );

  protected readonly strongSubtopics = computed(() =>
    this.progress.bySubtopic().filter((r) => r.accuracy >= WEAK_THRESHOLD),
  );

  protected pct(value: number | null): string {
    return value === null ? '—' : `${Math.round(value * 100)}%`;
  }

  protected reset(): void {
    if (!this.confirmReset()) {
      this.confirmReset.set(true);
      return;
    }
    this.progress.reset();
    this.confirmReset.set(false);
  }
}
