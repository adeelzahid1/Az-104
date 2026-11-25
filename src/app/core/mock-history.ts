import { Injectable, signal } from '@angular/core';
import { MockResult } from './readiness';

const STORAGE_KEY = 'az104-mocks-v1';
const KEEP = 50;

function valid(value: unknown): MockResult[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (m): m is MockResult =>
        Number.isFinite(m?.t) && Number.isInteger(m?.total) && m.total > 0 && Number.isInteger(m?.correct),
    )
    .map(({ t, total, correct }) => ({ t, total, correct: Math.min(Math.max(correct, 0), total) }))
    .sort((a, b) => a.t - b.t)
    .slice(-KEEP);
}

function readStorage(): MockResult[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    return valid(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'));
  } catch {
    return [];
  }
}

/** Results of finished mock exams, oldest first, saved in this browser. */
@Injectable({ providedIn: 'root' })
export class MockHistory {
  private readonly state = signal(readStorage());
  readonly results = this.state.asReadonly();

  add(result: MockResult): void {
    this.replace([...this.state(), result]);
  }

  /** Replaces the history, leaving out entries that aren't valid. */
  replace(results: unknown): void {
    const next = valid(results);
    this.state.set(next);
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable: the history lasts for this visit only.
    }
  }
}
