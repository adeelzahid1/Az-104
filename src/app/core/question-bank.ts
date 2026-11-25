import { Injectable } from '@angular/core';
import { CaseStudy, Question } from '../data/schema';
import { withRetry } from './retry';

type JsonModule = { default: unknown };

const toQuestions = (modules: JsonModule[]): Question[] =>
  modules.flatMap((m) => m.default as Question[]);

const LOADERS: Record<number, () => Promise<Question[]>> = {
  1: () =>
    Promise.all([
      import('../data/d1-core.json'),
      import('../data/d1-ext1.json'),
      import('../data/d1-ext2.json'),
      import('../data/d1-ext3.json'),
      import('../data/d1-exam.json'),
      import('../data/d1-concept.json'),
    ]).then(toQuestions),
  2: () =>
    Promise.all([
      import('../data/d2-core.json'),
      import('../data/d2-ext1.json'),
      import('../data/d2-ext2.json'),
      import('../data/d2-ext3.json'),
      import('../data/d2-exam.json'),
      import('../data/d2-concept.json'),
    ]).then(toQuestions),
  3: () =>
    Promise.all([
      import('../data/d3-core.json'),
      import('../data/d3-ext1.json'),
      import('../data/d3-ext2.json'),
      import('../data/d3-ext3.json'),
      import('../data/d3-exam.json'),
      import('../data/d3-concept.json'),
    ]).then(toQuestions),
  4: () =>
    Promise.all([
      import('../data/d4-core.json'),
      import('../data/d4-ext1.json'),
      import('../data/d4-ext2.json'),
      import('../data/d4-ext3.json'),
      import('../data/d4-exam.json'),
      import('../data/d4-concept.json'),
    ]).then(toQuestions),
  5: () =>
    Promise.all([
      import('../data/d5-core.json'),
      import('../data/d5-ext1.json'),
      import('../data/d5-ext2.json'),
      import('../data/d5-ext3.json'),
      import('../data/d5-exam.json'),
      import('../data/d5-concept.json'),
    ]).then(toQuestions),
};

/** Lazily loads the question bank, one chunk per exam domain. */
@Injectable({ providedIn: 'root' })
export class QuestionBank {
  private readonly cache = new Map<number, Promise<Question[]>>();
  private casesPromise: Promise<Record<string, CaseStudy>> | null = null;

  domain(id: number): Promise<Question[]> {
    let pending = this.cache.get(id);
    if (!pending) {
      const loader = LOADERS[id];
      pending = loader ? withRetry(loader) : Promise.resolve([]);
      this.cache.set(id, pending);
      // A failed download must not be remembered, so the next call can try again.
      pending.catch(() => this.cache.delete(id));
    }
    return pending;
  }

  async domains(ids: number[]): Promise<Question[]> {
    const sets = await Promise.all(ids.map((id) => this.domain(id)));
    return sets.flat();
  }

  /** Case study texts, keyed by id. */
  cases(): Promise<Record<string, CaseStudy>> {
    if (!this.casesPromise) {
      this.casesPromise = withRetry(() => import('../data/cases.json')).then((m) =>
        Object.fromEntries((m.default as CaseStudy[]).map((c) => [c.id, c])),
      );
      this.casesPromise.catch(() => (this.casesPromise = null));
    }
    return this.casesPromise;
  }
}
