import { Injectable, effect, inject, signal } from '@angular/core';
import { CaseStudy, Question } from '../data/schema';
import { QuizService } from '../core/quiz';
import { withRetry } from '../core/retry';
import { domainOf } from '../core/quiz-logic';
import { Language } from './language';

/**
 * Roman Urdu text for one question. Every field is optional; anything missing falls back to
 * English. Arrays must have the same length and order as the English ones (before shuffling).
 * Code blocks, links and answer keys are never translated.
 */
export type RomanQuestion = Partial<
  Pick<Question, 'ctx' | 'q' | 'opts' | 'stmts' | 'items' | 'targets' | 'tpl' | 'blanks' | 'exp'>
>;

export type RomanCase = Pick<CaseStudy, 'title' | 'sections'>;

type RomanSet = Record<string, RomanQuestion>;
const asSet = (m: { default: unknown }) => m.default as RomanSet;

const LOADERS: Record<number, () => Promise<RomanSet>> = {
  1: () => import('../data/roman/d1.json').then(asSet),
  2: () => import('../data/roman/d2.json').then(asSet),
  3: () => import('../data/roman/d3.json').then(asSet),
  4: () => import('../data/roman/d4.json').then(asSet),
  5: () => import('../data/roman/d5.json').then(asSet),
};

/** Uses the translation only when it lines up item for item with the English list. */
function sameShape<T>(english: T[] | undefined, roman: T[] | undefined): T[] | undefined {
  return english && roman && roman.length === english.length ? roman : english;
}

/** Applies Roman Urdu text to a question, keeping its (possibly shuffled) option order. */
export function localizeQuestion(q: Question, ro: RomanQuestion | undefined): Question {
  if (!ro) return q;
  let opts = q.opts;
  if (q.opts && ro.opts?.length === q.opts.length) {
    const order = q.optOrder ?? q.opts.map((_, i) => i);
    opts = order.map((i) => ro.opts![i]);
  }
  return {
    ...q,
    ctx: q.ctx && ro.ctx ? ro.ctx : q.ctx,
    q: ro.q ?? q.q,
    exp: ro.exp ?? q.exp,
    tpl: q.tpl && ro.tpl ? ro.tpl : q.tpl,
    opts,
    stmts: sameShape(q.stmts, ro.stmts),
    items: sameShape(q.items, ro.items),
    targets: sameShape(q.targets, ro.targets),
    blanks: sameShape(q.blanks, ro.blanks),
  };
}

/**
 * Loads Roman Urdu question text for the domains in the current quiz, only while Roman Urdu is
 * selected, and applies it on top of the English questions.
 */
@Injectable({ providedIn: 'root' })
export class RomanContent {
  private readonly language = inject(Language);
  private readonly quiz = inject(QuizService);
  private readonly texts = signal<RomanSet>({});
  private readonly caseTexts = signal<Record<string, RomanCase>>({});
  private readonly requested = new Set<number | 'cases'>();

  constructor() {
    effect(() => {
      if (!this.language.isRoman()) return;
      for (const d of this.quiz.session()?.config.domains ?? []) this.load(d);
      this.loadCases();
    });
  }

  question(q: Question): Question {
    if (!this.language.isRoman()) return q;
    const ro = this.texts()[q.id];
    if (!ro) this.load(domainOf(q));
    return localizeQuestion(q, ro);
  }

  caseStudy(c: CaseStudy): CaseStudy {
    if (!this.language.isRoman()) return c;
    const ro = this.caseTexts()[c.id];
    if (!ro) return c;
    return {
      ...c,
      title: ro.title || c.title,
      sections: ro.sections.length === c.sections.length ? ro.sections : c.sections,
    };
  }

  private load(domain: number): void {
    const loader = LOADERS[domain];
    if (!loader || this.requested.has(domain)) return;
    this.requested.add(domain);
    withRetry(loader).then(
      (set) => this.texts.update((all) => ({ ...all, ...set })),
      () => this.requested.delete(domain),
    );
  }

  private loadCases(): void {
    if (this.requested.has('cases')) return;
    this.requested.add('cases');
    withRetry(() => import('../data/roman/cases.json')).then(
      (m) => this.caseTexts.set(m.default as Record<string, RomanCase>),
      () => this.requested.delete('cases'),
    );
  }
}
