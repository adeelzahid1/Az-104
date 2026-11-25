import { Injectable, signal } from '@angular/core';
import { withRetry } from '../../core/retry';
import { NotesFile } from './notes-data';

const LOADERS: Record<number, () => Promise<{ default: unknown }>> = {
  1: () => import('../../data/notes/d1.json'),
  2: () => import('../../data/notes/d2.json'),
  3: () => import('../../data/notes/d3.json'),
  4: () => import('../../data/notes/d4.json'),
  5: () => import('../../data/notes/d5.json'),
};

/** The study notes, downloaded per domain when they are needed. */
@Injectable({ providedIn: 'root' })
export class NotesContent {
  private readonly loaded = signal<NotesFile>({});
  private readonly failure = signal(false);
  private readonly pending = new Map<number, Promise<void>>();

  /** Notes of the sections loaded so far, by section id. */
  readonly notes = this.loaded.asReadonly();
  readonly failed = this.failure.asReadonly();

  load(domain: number): Promise<void> {
    let pending = this.pending.get(domain);
    if (!pending) {
      pending = withRetry(LOADERS[domain]).then(
        (m) => this.loaded.update((all) => ({ ...all, ...(m.default as NotesFile) })),
        () => {
          this.pending.delete(domain);
          this.failure.set(true);
        },
      );
      this.pending.set(domain, pending);
    }
    return pending;
  }

  async loadAll(): Promise<void> {
    await Promise.all(Object.keys(LOADERS).map((d) => this.load(Number(d))));
  }
}
