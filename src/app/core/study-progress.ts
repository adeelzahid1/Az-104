import { Injectable, computed, signal } from '@angular/core';
import { CardState, Rating, isDue, schedule } from './srs';

/** Study state for one question. Missing fields mean "not set". */
interface StudyEntry {
  /** The learner ticked "I understand this". */
  u?: true;
  /** Bookmarked. */
  b?: true;
  /** Flashcard schedule. */
  c?: CardState;
}

type StudyState = Record<string, StudyEntry>;

const STORAGE_KEY = 'az104-study-v1';

function readStorage(): StudyState {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StudyState) : {};
  } catch {
    return {};
  }
}

function writeStorage(state: StudyState): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable: study progress lasts for this visit only.
  }
}

/** Study-mode progress (understood, bookmarks, flashcard schedule), saved in this browser. */
@Injectable({ providedIn: 'root' })
export class StudyProgress {
  private readonly state = signal<StudyState>(readStorage());

  readonly understoodIds = computed(
    () => new Set(Object.keys(this.state()).filter((id) => this.state()[id].u)),
  );
  readonly bookmarkedIds = computed(
    () => new Set(Object.keys(this.state()).filter((id) => this.state()[id].b)),
  );

  isUnderstood(id: string): boolean {
    return !!this.state()[id]?.u;
  }

  isBookmarked(id: string): boolean {
    return !!this.state()[id]?.b;
  }

  card(id: string): CardState | undefined {
    return this.state()[id]?.c;
  }

  isDue(id: string, now: number): boolean {
    return isDue(this.state()[id]?.c, now);
  }

  /** Number of flashcards due at the given time. */
  dueCount(now: number): number {
    return Object.values(this.state()).filter((e) => isDue(e.c, now)).length;
  }

  toggleUnderstood(id: string): void {
    this.patch(id, (e) => ({ ...e, u: e.u ? undefined : true }));
  }

  toggleBookmark(id: string): void {
    this.patch(id, (e) => ({ ...e, b: e.b ? undefined : true }));
  }

  rate(id: string, rating: Rating, now = Date.now()): void {
    this.patch(id, (e) => ({ ...e, c: schedule(e.c, rating, now) }));
  }

  snapshot(): Record<string, unknown> {
    return { ...this.state() };
  }

  /** Replaces all study progress. Entries that aren't valid are left out. */
  restore(data: Record<string, unknown>): void {
    const next: StudyState = {};
    for (const [id, value] of Object.entries(data)) {
      const e = value as StudyEntry | null;
      if (!/^D[1-5]-\d{3}$/.test(id) || !e) continue;
      const entry: StudyEntry = {};
      if (e.u === true) entry.u = true;
      if (e.b === true) entry.b = true;
      if ([e.c?.due, e.c?.ivl, e.c?.reps].every((n) => Number.isFinite(n))) {
        entry.c = { due: e.c!.due, ivl: e.c!.ivl, reps: e.c!.reps };
      }
      if (Object.keys(entry).length) next[id] = entry;
    }
    this.state.set(next);
    writeStorage(next);
  }

  private patch(id: string, fn: (entry: StudyEntry) => StudyEntry): void {
    this.state.update((all) => {
      const entry = JSON.parse(JSON.stringify(fn(all[id] ?? {}))) as StudyEntry;
      const next = { ...all };
      if (Object.keys(entry).length) next[id] = entry;
      else delete next[id];
      writeStorage(next);
      return next;
    });
  }
}
