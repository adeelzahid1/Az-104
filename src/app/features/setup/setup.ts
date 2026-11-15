import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DOMAINS, Difficulty, QuestionType } from '../../data/schema';
import { Progress } from '../../core/progress';
import { QuizService } from '../../core/quiz';
import { domainQuotas } from '../../core/quiz-logic';

@Component({
  selector: 'app-setup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './setup.html',
  styleUrl: './setup.css',
})
export class Setup implements OnInit {
  /** Route data: practice or mock exam. */
  readonly mode = input<'practice' | 'exam'>('practice');
  /** Optional ?domain=N query parameter to preselect a single domain. */
  readonly domain = input<string>();
  /** Optional ?mistakes=1 query parameter. */
  readonly mistakes = input<string>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly quiz = inject(QuizService);
  private readonly router = inject(Router);
  private readonly progress = inject(Progress);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly domains = DOMAINS;
  protected readonly mistakeCount = computed(() => this.progress.mistakeIds().length);
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected readonly form = this.fb.group({
    domains: this.fb.group({ '1': true, '2': true, '3': true, '4': true, '5': true }),
    count: 20,
    diff: 0 as 0 | Difficulty,
    type: 'all' as 'all' | QuestionType,
    mistakesOnly: false,
    timed: true,
  });

  protected readonly countOptions = computed(() =>
    this.mode() === 'exam' ? [10, 20, 40, 50, 60] : [5, 10, 20, 30, 50],
  );

  protected readonly distribution = signal<{ name: string; n: number }[]>([]);

  ngOnInit(): void {
    if (this.mode() === 'exam') this.form.patchValue({ count: 50 });
    const preselect = Number(this.domain());
    if (preselect >= 1 && preselect <= 5) {
      for (const d of DOMAINS) {
        this.form.controls.domains.get(String(d.id))?.setValue(d.id === preselect);
      }
    }
    if (this.mistakes() === '1') this.form.patchValue({ mistakesOnly: true });
    this.updateDistribution();
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateDistribution());
  }

  private selectedDomains(): number[] {
    return DOMAINS.map((d) => d.id).filter(
      (id) => this.form.controls.domains.get(String(id))?.value === true,
    );
  }

  private updateDistribution(): void {
    if (this.mode() !== 'exam') return;
    const quotas = domainQuotas(this.selectedDomains(), this.form.controls.count.value);
    this.distribution.set(
      DOMAINS.filter((d) => quotas.has(d.id)).map((d) => ({
        name: d.name,
        n: quotas.get(d.id) ?? 0,
      })),
    );
  }

  protected async start(): Promise<void> {
    const domains = this.selectedDomains();
    if (!domains.length) {
      this.error.set('Pick at least one domain.');
      return;
    }
    const v = this.form.getRawValue();
    this.error.set('');
    this.busy.set(true);
    try {
      const count = await this.quiz.start({
        mode: this.mode(),
        domains,
        count: v.count,
        diff: Number(v.diff) as 0 | Difficulty,
        type: v.type,
        mistakesOnly: this.mode() === 'practice' && v.mistakesOnly,
        timed: this.mode() === 'exam' && v.timed,
      });
      if (count === 0) {
        this.error.set(
          v.mistakesOnly
            ? 'No saved mistakes match these filters yet. Answer some questions first, or clear the filter.'
            : 'No questions match these filters. Try widening them.',
        );
        return;
      }
      await this.router.navigate(['/quiz']);
    } finally {
      this.busy.set(false);
    }
  }
}
