import { AGAIN_DELAY, DAY, isDue, nextInterval, schedule } from './srs';

describe('spaced repetition', () => {
  const now = 1_000_000;

  it('brings a card back in 10 minutes after Again and resets the streak', () => {
    const card = schedule({ due: 0, ivl: 8, reps: 3 }, 'again', now);
    expect(card).toEqual({ due: now + AGAIN_DELAY, ivl: 0, reps: 0 });
  });

  it('grows Good intervals 1, 3, then about 2.5 times', () => {
    let card = schedule(undefined, 'good', now);
    expect(card.ivl).toBe(1);
    expect(card.due).toBe(now + DAY);
    card = schedule(card, 'good', now);
    expect(card.ivl).toBe(3);
    card = schedule(card, 'good', now);
    expect(card.ivl).toBe(8);
    expect(card.reps).toBe(3);
  });

  it('grows Hard intervals slowly but never below 1 day', () => {
    expect(nextInterval(undefined, 'hard')).toBe(1);
    expect(nextInterval({ due: 0, ivl: 10, reps: 2 }, 'hard')).toBe(12);
  });

  it('reports a card as due once its time has come', () => {
    expect(isDue(undefined, now)).toBeFalse();
    expect(isDue({ due: now, ivl: 1, reps: 1 }, now)).toBeTrue();
    expect(isDue({ due: now + 1, ivl: 1, reps: 1 }, now)).toBeFalse();
  });
});
