import { Injectable, computed, signal } from '@angular/core';
import { Question } from '../data/schema';

interface QuestionStat {
  sub: string;
  seen: number;
  correct: number;
  /** Result of the most recent attempt; false keeps the question in the mistakes pool. */
  last: boolean;
  /** When it was last answered; missing on answers from older versions. */
  t?: number;
}

type ProgressState = Record<string, QuestionStat>;

export interface AccuracyRow {
  attempts: number;
  correct: number;
  unique: number;
  mistakes: number;
}

export interface SubtopicRow extends AccuracyRow {
  domain: number;
  sub: string;
  accuracy: number;
}

const STORAGE_KEY = 'az104-progress-v1';

function readStorage(): ProgressState {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressState) : {};
  } catch {
    return {};
  }
}

function writeStorage(state: ProgressState): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode, quota); progress then lasts only this session.
  }
}

const emptyRow = (): AccuracyRow => ({ attempts: 0, correct: 0, unique: 0, mistakes: 0 });

function addTo(row: AccuracyRow, stat: QuestionStat): void {
  row.attempts += stat.seen;
  row.correct += stat.correct;
  row.unique += 1;
  if (!stat.last) row.mistakes += 1;
}

/** Per-question answer history, saved in this browser's localStorage. */
@Injectable({ providedIn: 'root' })
export class Progress {
  private readonly state = signal<ProgressState>(readStorage());

  /** Every answered question, by question id. */
  readonly stats = this.state.asReadonly();

  readonly mistakeIds = computed(() =>
    Object.entries(this.state())
      .filter(([, s]) => !s.last)
      .map(([id]) => id),
  );

  readonly overall = computed(() => {
    const row = emptyRow();
    for (const stat of Object.values(this.state())) addTo(row, stat);
    return row;
  });

  readonly byDomain = computed(() => {
    const rows = new Map<number, AccuracyRow>();
    for (const [id, stat] of Object.entries(this.state())) {
      const d = Number(id.charAt(1));
      const row = rows.get(d) ?? emptyRow();
      addTo(row, stat);
      rows.set(d, row);
    }
    return rows;
  });

  readonly bySubtopic = computed<SubtopicRow[]>(() => {
    const rows = new Map<string, SubtopicRow>();
    for (const [id, stat] of Object.entries(this.state())) {
      const domain = Number(id.charAt(1));
      const key = `${domain}|${stat.sub}`;
      const row = rows.get(key) ?? { ...emptyRow(), domain, sub: stat.sub, accuracy: 0 };
      addTo(row, stat);
      rows.set(key, row);
    }
    return [...rows.values()]
      .map((r) => ({ ...r, accuracy: r.attempts ? r.correct / r.attempts : 0 }))
      .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts);
  });

  record(entries: { q: Question; correct: boolean }[]): void {
    if (!entries.length) return;
    const t = Date.now();
    this.state.update((prev) => {
      const next = { ...prev };
      for (const { q, correct } of entries) {
        const old = next[q.id];
        next[q.id] = {
          sub: q.sub,
          seen: (old?.seen ?? 0) + 1,
          correct: (old?.correct ?? 0) + (correct ? 1 : 0),
          last: correct,
          t,
        };
      }
      writeStorage(next);
      return next;
    });
  }

  snapshot(): Record<string, unknown> {
    return { ...this.state() };
  }

  /** Replaces all progress. Entries that aren't valid are left out. */
  restore(data: Record<string, unknown>): void {
    const next: ProgressState = {};
    for (const [id, value] of Object.entries(data)) {
      const s = value as Partial<QuestionStat> | null;
      if (
        /^D[1-5]-\d{3}$/.test(id) &&
        typeof s?.sub === 'string' &&
        Number.isInteger(s.seen) &&
        Number.isInteger(s.correct) &&
        typeof s.last === 'boolean'
      ) {
        next[id] = { sub: s.sub, seen: s.seen!, correct: s.correct!, last: s.last };
        if (Number.isFinite(s.t)) next[id].t = s.t;
      }
    }
    this.state.set(next);
    writeStorage(next);
  }

  reset(): void {
    this.state.set({});
    writeStorage({});
  }
}
