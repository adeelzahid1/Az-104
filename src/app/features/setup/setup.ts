import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DOMAINS, Difficulty } from '../../data/schema';
import { Progress } from '../../core/progress';
import { QuizService } from '../../core/quiz';
import { SECTIONS } from '../../core/sections';
import { Language } from '../../i18n/language';
import { LoadError } from '../../shared/load-error';
import { CASE_STUDY_MIN_EXAM_SIZE, TypeFilter, domainQuotas } from '../../core/quiz-logic';

/** Every case study in the bank has this many questions (checked by the bank validation script). */
const CASE_STUDY_PARTS = 5;
/** So has every problem-solution set. */
const SET_SIZE = 3;

@Component({
  selector: 'app-setup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, LoadError],
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
  /** Optional ?sub=RBAC query parameter: practise one subtopic of the chosen domain. */
  readonly sub = input<string>();
  /** Optional ?section=1.3 query parameter: practise one study section. */
  readonly section = input<string>();
  /** Optional ?count=20 query parameter. */
  readonly count = input<string>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly quiz = inject(QuizService);
  private readonly router = inject(Router);
  private readonly progress = inject(Progress);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly domains = DOMAINS;
  protected readonly mistakeCount = computed(() => this.progress.mistakeIds().length);
  protected readonly busy = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly unfinished = this.quiz.unfinished;
  private readonly language = inject(Language);
  protected readonly t = this.language.t;
  /** Subtopics to practise, or null for all of them. */
  protected readonly focus = linkedSignal(() => {
    if (this.mode() !== 'practice') return null;
    const section = SECTIONS.find((s) => s.id === this.section());
    if (section) return { section, subs: section.subs };
    const sub = this.sub();
    return sub ? { section: null, subs: [sub] } : null;
  });
  protected readonly focusLabel = computed(() => {
    const f = this.focus();
    if (!f) return '';
    if (!f.section) return this.t().setup.subtopic(f.subs[0]);
    return this.t().setup.section(`${f.section.id} ${this.language.isRoman() ? f.section.ro : f.section.en}`);
  });
  protected readonly error = signal<'' | 'noDomain' | 'noMistakes' | 'noMatch'>('');

  protected readonly form = this.fb.group({
    domains: this.fb.group({ '1': true, '2': true, '3': true, '4': true, '5': true }),
    count: 20,
    diff: 0 as 0 | Difficulty,
    type: 'all' as TypeFilter,
    mistakesOnly: false,
    timed: true,
  });

  protected readonly countOptions = computed(() =>
    this.mode() === 'exam' ? [10, 20, 40, 50, 60] : [5, 10, 20, 30, 50],
  );

  /** Questions per domain id; id 0 is the case study, id -1 the problem-solution set. */
  protected readonly distribution = signal<{ id: number; n: number }[]>([]);

  ngOnInit(): void {
    if (this.mode() === 'exam') this.form.patchValue({ count: 50 });
    const count = Number(this.count());
    if (this.countOptions().includes(count)) this.form.patchValue({ count });
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
    const count = this.form.controls.count.value;
    const large = count >= CASE_STUDY_MIN_EXAM_SIZE;
    const quotas = domainQuotas(this.selectedDomains(), large ? count - CASE_STUDY_PARTS - SET_SIZE : count);
    const rows = DOMAINS.filter((d) => quotas.has(d.id)).map((d) => ({
      id: d.id,
      n: quotas.get(d.id) ?? 0,
    }));
    this.distribution.set(
      large ? [...rows, { id: -1, n: SET_SIZE }, { id: 0, n: CASE_STUDY_PARTS }] : rows,
    );
  }

  protected async start(): Promise<void> {
    const domains = this.selectedDomains();
    if (!domains.length) {
      this.error.set('noDomain');
      return;
    }
    const v = this.form.getRawValue();
    this.error.set('');
    this.loadFailed.set(false);
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
        subs: this.focus()?.subs,
      });
      if (count === 0) {
        this.error.set(
          v.mistakesOnly ? 'noMistakes' : 'noMatch',
        );
        return;
      }
      await this.router.navigate(['/quiz']);
    } catch {
      this.loadFailed.set(true);
    } finally {
      this.busy.set(false);
    }
  }
}
