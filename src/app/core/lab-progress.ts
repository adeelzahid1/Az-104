import { Injectable, signal } from '@angular/core';

/** Finished steps (their positions) of every lab that was started. */
type LabState = Record<string, number[]>;

const STORAGE_KEY = 'az104-labs-v1';

function clean(value: unknown): LabState {
  const out: LabState = {};
  if (typeof value !== 'object' || value === null) return out;
  for (const [id, steps] of Object.entries(value)) {
    if (!/^L\d{2}$/.test(id) || !Array.isArray(steps)) continue;
    const valid = [...new Set(steps.filter((n) => Number.isInteger(n) && n >= 0))].sort((a, b) => a - b);
    if (valid.length) out[id] = valid;
  }
  return out;
}

function readStorage(): LabState {
  try {
    if (typeof localStorage === 'undefined') return {};
    return clean(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'));
  } catch {
    return {};
  }
}

/** Finished lab steps, saved in this browser. */
@Injectable({ providedIn: 'root' })
export class LabProgress {
  private readonly state = signal(readStorage());

  done(id: string): readonly number[] {
    return this.state()[id] ?? [];
  }

  toggle(id: string, step: number): void {
    const steps = this.done(id);
    this.restore({
      ...this.state(),
      [id]: steps.includes(step) ? steps.filter((n) => n !== step) : [...steps, step],
    });
  }

  snapshot(): LabState {
    return this.state();
  }

  /** Replaces all progress, leaving out entries that aren't valid. */
  restore(value: unknown): void {
    const next = clean(value);
    this.state.set(next);
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable: progress lasts for this visit only.
    }
  }
}
