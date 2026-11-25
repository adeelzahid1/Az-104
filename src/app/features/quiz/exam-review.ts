import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Language } from '../../i18n/language';

export interface ReviewRow {
  index: number;
  answered: boolean;
  flagged: boolean;
}

/** The review screen at the end of an exam part. */
@Component({
  selector: 'app-exam-review',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let te = t().exam;
    <section class="card">
      <h2>{{ te.reviewTitle }}</h2>
      <p>{{ te.summary(rows().length - open(), rows().length, flagged()) }}</p>
      <ul>
        @for (r of rows(); track r.index) {
          <li>
            <button type="button" [class.open]="!r.answered" (click)="jump.emit(r.index)">
              <strong>{{ r.index + 1 }}</strong>
              <span>{{ r.answered ? te.answered : te.unanswered }}</span>
              @if (r.flagged) {
                <span class="flag">⚑ {{ te.flagged }}</span>
              }
            </button>
          </li>
        }
      </ul>
      <p class="muted">{{ last() ? te.submitNote : te.partNote }}</p>
      <button type="button" class="btn primary" (click)="proceed.emit()">
        {{ last() ? t().quiz.submitExam : te.nextPart }}
      </button>
    </section>
  `,
  styles: `
    ul {
      list-style: none;
      margin: 12px 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 8px;
    }
    li button {
      width: 100%;
      height: 100%;
      display: flex;
      flex-wrap: wrap;
      gap: 4px 8px;
      padding: 8px 10px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface);
      color: var(--text);
      font: inherit;
      font-size: 0.88rem;
      text-align: left;
      cursor: pointer;
    }
    li button.open {
      border-color: var(--warn);
      background: var(--warn-soft);
    }
    .flag {
      color: var(--accent);
      font-weight: 600;
    }
  `,
})
export class ExamReview {
  readonly rows = input.required<ReviewRow[]>();
  /** The last part: continuing submits the exam. */
  readonly last = input(false);
  readonly jump = output<number>();
  readonly proceed = output<void>();

  protected readonly t = inject(Language).t;
  protected readonly open = computed(() => this.rows().filter((r) => !r.answered).length);
  protected readonly flagged = computed(() => this.rows().filter((r) => r.flagged).length);
}
