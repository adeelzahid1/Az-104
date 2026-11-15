import { Injectable } from '@angular/core';
import { Question } from '../data/schema';

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
    ]).then(toQuestions),
  2: () =>
    Promise.all([
      import('../data/d2-core.json'),
      import('../data/d2-ext1.json'),
      import('../data/d2-ext2.json'),
      import('../data/d2-ext3.json'),
    ]).then(toQuestions),
  3: () =>
    Promise.all([
      import('../data/d3-core.json'),
      import('../data/d3-ext1.json'),
      import('../data/d3-ext2.json'),
      import('../data/d3-ext3.json'),
    ]).then(toQuestions),
  4: () =>
    Promise.all([
      import('../data/d4-core.json'),
      import('../data/d4-ext1.json'),
      import('../data/d4-ext2.json'),
      import('../data/d4-ext3.json'),
    ]).then(toQuestions),
  5: () =>
    Promise.all([
      import('../data/d5-core.json'),
      import('../data/d5-ext1.json'),
      import('../data/d5-ext2.json'),
      import('../data/d5-ext3.json'),
    ]).then(toQuestions),
};

/** Lazily loads the question bank, one chunk per exam domain. */
@Injectable({ providedIn: 'root' })
export class QuestionBank {
  private readonly cache = new Map<number, Promise<Question[]>>();

  domain(id: number): Promise<Question[]> {
    let pending = this.cache.get(id);
    if (!pending) {
      const loader = LOADERS[id];
      pending = loader ? loader() : Promise.resolve([]);
      this.cache.set(id, pending);
    }
    return pending;
  }

  async domains(ids: number[]): Promise<Question[]> {
    const sets = await Promise.all(ids.map((id) => this.domain(id)));
    return sets.flat();
  }
}
