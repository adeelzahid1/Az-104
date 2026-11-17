/**
 * Simple spaced-repetition scheduling for flashcards.
 *
 * - Again: the card comes back in 10 minutes (and again later in the same session).
 * - Hard: the interval grows slowly (at least 1 day).
 * - Good: 1 day, then 3 days, then about 2.5 times the previous interval.
 */

export type Rating = 'again' | 'hard' | 'good';

export interface CardState {
  /** When the card is next due (epoch milliseconds). */
  due: number;
  /** Current interval in days (0 after Again). */
  ivl: number;
  /** Successful reviews in a row. */
  reps: number;
}

export const MINUTE = 60_000;
export const DAY = 86_400_000;
export const AGAIN_DELAY = 10 * MINUTE;

/** Interval in days for a rating, given the card's previous state. */
export function nextInterval(prev: CardState | undefined, rating: Rating): number {
  if (rating === 'again') return 0;
  const ivl = prev?.ivl ?? 0;
  if (rating === 'hard') return Math.max(1, Math.round(ivl * 1.2));
  if (ivl < 1) return 1;
  if (ivl < 3) return 3;
  return Math.round(ivl * 2.5);
}

export function schedule(prev: CardState | undefined, rating: Rating, now: number): CardState {
  const ivl = nextInterval(prev, rating);
  return {
    ivl,
    reps: rating === 'again' ? 0 : (prev?.reps ?? 0) + 1,
    due: now + (ivl === 0 ? AGAIN_DELAY : ivl * DAY),
  };
}

export const isDue = (card: CardState | undefined, now: number): boolean =>
  !!card && card.due <= now;
