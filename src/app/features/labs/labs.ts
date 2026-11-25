import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import labsJson from '../../data/labs.json';
import { LabProgress } from '../../core/lab-progress';
import { Plan } from '../../core/plan';
import { Language } from '../../i18n/language';

type Bilingual = string[];

interface Lab {
  id: string;
  section: string;
  t: Bilingual;
  minutes: number;
  cost: 'free' | 'low' | 'hourly';
  goal: Bilingual;
  /** Official skills this lab practises, as written in the checklist. */
  skills: string[];
  steps: { t: Bilingual; cli?: string }[];
  remember: Bilingual[];
  cleanup: string;
}

const LABS = labsJson as Lab[];

@Component({
  selector: 'app-labs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './labs.html',
  styleUrl: './labs.css',
})
export class Labs {
  /** Optional ?lab=L03 query parameter: the lab to open. */
  readonly lab = input<string>();

  private readonly progress = inject(LabProgress);
  private readonly plan = inject(Plan);
  private readonly language = inject(Language);
  private readonly document = inject(DOCUMENT);

  protected readonly t = this.language.t;
  /** The text that was copied last, to confirm it on its button. */
  protected readonly copied = signal('');

  protected readonly labs = computed(() => {
    const lang = this.language.isRoman() ? 1 : 0;
    return LABS.map((l) => {
      const done = this.progress.done(l.id).filter((n) => n < l.steps.length);
      return {
        ...l,
        title: l.t[lang],
        goalText: l.goal[lang],
        rows: l.steps.map((s, i) => ({ text: s.t[lang], cli: s.cli, done: done.includes(i) })),
        notes: l.remember.map((r) => r[lang]),
        doneCount: done.length,
        complete: done.length === l.steps.length,
      };
    });
  });

  protected readonly finished = computed(() => this.labs().filter((l) => l.complete).length);

  protected toggle(id: string, step: number): void {
    this.progress.toggle(id, step);
    const lab = this.labs().find((l) => l.id === id);
    // Finishing a lab ticks "Lab done" for its skills in the checklist.
    if (lab?.complete) this.plan.markLab(lab.skills);
  }

  protected async copy(text: string): Promise<void> {
    try {
      await this.document.defaultView?.navigator.clipboard.writeText(text);
      this.copied.set(text);
    } catch {
      // No permission to copy: the text can still be selected by hand.
      this.copied.set('');
    }
  }
}
