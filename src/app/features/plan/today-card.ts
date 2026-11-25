import { ChangeDetectionStrategy, Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Plan, TaskProgress } from '../../core/plan';
import { SECTIONS } from '../../core/sections';
import { Language } from '../../i18n/language';

/** Days until the exam and today's tasks. */
@Component({
  selector: 'app-today-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @let tp = t().plan;
    <section class="card">
      <header>
        <h2>{{ tp.todayTitle }}</h2>
        @if (plan.ready()) {
          <strong>{{ tp.daysLeft(plan.daysLeft()) }}</strong>
        }
      </header>
      @if (failed()) {
        <p class="muted">{{ t().loadError.text }}</p>
      } @else if (!plan.ready()) {
        <p class="muted">{{ tp.loading }}</p>
      } @else {
        <p class="muted">{{ tp.phases[plan.phase()] }}</p>
        <ul>
          @for (x of rows(); track $index) {
            <li [class.done]="x.complete">
              <span class="mark" aria-hidden="true">{{ x.complete ? '✓' : '○' }}</span>
              <a [routerLink]="x.path" [queryParams]="x.params">{{ x.label }}</a>
              @if (x.target > 0) {
                <span class="muted">{{ x.done }}/{{ x.target }}</span>
              }
              @if (x.complete) {
                <span class="sr-only">{{ tp.done }}</span>
              }
            </li>
          }
        </ul>
        @if (allDone()) {
          <p>{{ tp.allDone }}</p>
        }
      }
      <ng-content />
    </section>
  `,
  styles: `
    header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 12px;
      flex-wrap: wrap;
    }
    h2,
    p {
      margin: 0 0 8px;
    }
    ul {
      list-style: none;
      margin: 0 0 8px;
      padding: 0;
      display: grid;
      gap: 6px;
    }
    li {
      display: flex;
      gap: 8px;
      align-items: baseline;
    }
    li.done a {
      text-decoration: line-through;
      color: var(--muted);
    }
    li.done .mark {
      color: var(--ok);
      font-weight: 700;
    }
  `,
})
export class TodayCard {
  protected readonly plan = inject(Plan);
  private readonly language = inject(Language);
  protected readonly t = this.language.t;
  protected readonly failed = signal(false);

  protected readonly rows = computed(() => this.plan.tasks().map((x) => this.row(x)));
  protected readonly allDone = computed(() => {
    const rows = this.rows().filter((r) => r.target > 0);
    return rows.length > 0 && rows.every((r) => r.complete);
  });

  constructor() {
    afterNextRender(() => {
      this.plan.load().catch(() => this.failed.set(true));
    });
  }

  private row({ task, done, target }: TaskProgress) {
    const tp = this.t().plan;
    const base = { done, target, complete: target > 0 && done >= target };
    switch (task.kind) {
      case 'section': {
        const s = SECTIONS.find((x) => x.id === task.section);
        const name = s ? `${s.id} ${this.language.isRoman() ? s.ro : s.en}` : task.section;
        return {
          ...base,
          label: tp.taskSection(task.target, name),
          path: '/practice',
          params: { domain: s?.domain, section: task.section, count: task.target },
        };
      }
      case 'cards':
        return { ...base, label: tp.taskCards(task.target), path: '/study', params: { s: 'all', f: 'due', m: 'cards' } };
      case 'mistakes':
        return { ...base, label: tp.taskMistakes(task.ids.length), path: '/practice', params: { mistakes: 1 } };
      case 'mock':
        return { ...base, label: tp.taskMock(task.target), path: '/mock', params: { count: task.target } };
      case 'cheat':
        return { ...base, label: tp.taskCheat, path: '/cheat-sheet', params: {} };
    }
  }
}
