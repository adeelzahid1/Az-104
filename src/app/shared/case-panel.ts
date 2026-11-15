import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CaseStudy } from '../data/schema';

@Component({
  selector: 'app-case-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details class="case" [open]="open()">
      <summary>
        <span class="tag">Case study</span>
        {{ caseStudy().title }}
        @if (partLabel()) {
          <span class="part">· {{ partLabel() }}</span>
        }
      </summary>
      @for (section of caseStudy().sections; track section.heading) {
        <h3>{{ section.heading }}</h3>
        <p>{{ section.body }}</p>
      }
    </details>
  `,
  styles: `
    .case {
      border: 1px solid var(--accent);
      border-radius: 10px;
      background: var(--accent-soft);
      padding: 12px 16px;
      margin-bottom: 14px;
    }
    summary {
      cursor: pointer;
      font-weight: 700;
    }
    .tag {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--accent);
      margin-right: 6px;
    }
    .part {
      font-weight: 400;
      color: var(--muted);
    }
    h3 {
      font-size: 0.95rem;
      margin: 14px 0 4px;
    }
    p {
      margin: 0;
      line-height: 1.55;
      white-space: pre-line;
    }
  `,
})
export class CasePanel {
  readonly caseStudy = input.required<CaseStudy>();
  readonly open = input(true);
  readonly partLabel = input('');
}
