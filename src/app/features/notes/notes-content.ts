import { Injectable, inject, signal } from '@angular/core';
import { Busy } from '../../core/busy';
import { mayPreload } from '../../core/preload';
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
  private readonly busy = inject(Busy);
  private readonly loaded = signal<NotesFile>({});
  private readonly failure = signal(false);
  private readonly pending = new Map<number, Promise<void>>();

  /** Notes of the sections loaded so far, by section id. */
  readonly notes = this.loaded.asReadonly();
  readonly failed = this.failure.asReadonly();

  /** Quiet: in the background, without the loading bar and without an error message. */
  load(domain: number, quiet = false): Promise<void> {
    let pending = this.pending.get(domain);
    if (!pending) {
      const download = withRetry(LOADERS[domain]);
      if (!quiet) this.busy.track(download);
      pending = download.then(
        (m) => this.loaded.update((all) => ({ ...all, ...(m.default as NotesFile) })),
        () => {
          this.pending.delete(domain);
          if (!quiet) this.failure.set(true);
        },
      );
      this.pending.set(domain, pending);
    } else if (!quiet) {
      // It may have started in the background and fail silently there: then try again for the reader.
      return pending.then(() => (this.pending.has(domain) ? undefined : this.load(domain)));
    }
    return pending;
  }

  async loadAll(quiet = false): Promise<void> {
    if (quiet && !mayPreload()) return;
    await Promise.all(Object.keys(LOADERS).map((d) => this.load(Number(d), quiet)));
  }
}
