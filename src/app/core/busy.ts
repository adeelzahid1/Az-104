import { Injectable, computed, signal } from '@angular/core';

/** Counts the downloads that are running, for the loading bar at the top of the page. */
@Injectable({ providedIn: 'root' })
export class Busy {
  private readonly count = signal(0);

  readonly active = computed(() => this.count() > 0);

  track<T>(work: Promise<T>): Promise<T> {
    // Downloads can start inside a computed signal, where other signals must not change.
    queueMicrotask(() => this.count.update((n) => n + 1));
    const done = () => this.count.update((n) => n - 1);
    work.then(done, done);
    return work;
  }
}
