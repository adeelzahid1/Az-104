import { Injectable, inject, signal } from '@angular/core';
import { Question } from '../data/schema';
import { Language } from '../i18n/language';
import { Busy } from './busy';
import { domainOf } from './quiz-logic';
import { withRetry } from './retry';

/** Question id → original option index → why that option is wrong, [English, Roman Urdu]. */
export type WhyFile = Record<string, Record<string, [string, string]>>;
const asFile = (m: { default: unknown }) => m.default as WhyFile;

const LOADERS: Record<number, () => Promise<WhyFile>> = {
  1: () => import('../data/why/d1.json').then(asFile),
};

/** The reasons in the order in which the options are shown; '' where there is none. */
export function reasonsFor(q: Question, file: WhyFile, lang: 0 | 1): string[] {
  const reasons = file[q.id];
  if (!reasons || !q.opts) return [];
  const order = q.optOrder ?? q.opts.map((_, i) => i);
  return order.map((i) => reasons[i]?.[lang] ?? '');
}

/** Short reasons why options are wrong, for the Study page. Downloaded when an answer is first shown. */
@Injectable({ providedIn: 'root' })
export class WhyWrong {
  private readonly language = inject(Language);
  private readonly busy = inject(Busy);
  private readonly texts = signal<WhyFile>({});
  private readonly requested = new Set<number>();

  reasons(q: Question): string[] {
    this.load(domainOf(q));
    return reasonsFor(q, this.texts(), this.language.isRoman() ? 1 : 0);
  }

  private load(domain: number): void {
    const loader = LOADERS[domain];
    if (!loader || this.requested.has(domain)) return;
    this.requested.add(domain);
    this.busy.track(withRetry(loader)).then(
      (file) => this.texts.update((all) => ({ ...all, ...file })),
      () => this.requested.delete(domain),
    );
  }
}
