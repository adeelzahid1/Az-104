import { CaseStudy } from '../data/schema';
import type { Session } from './quiz';

const STORAGE_KEY = 'az104-session-v1';

export interface SavedSession {
  session: Session;
  /** Case study texts used by the session. */
  cases: Record<string, CaseStudy>;
}

/** Checks the parts the quiz relies on, so a damaged entry can't break the app. */
function isSaved(value: unknown): value is SavedSession {
  const s = (value as SavedSession | null)?.session;
  const n = s?.questions?.length ?? 0;
  return (
    n > 0 &&
    !!s?.config &&
    s.answers?.length === n &&
    s.checked?.length === n &&
    Number.isInteger(s.current) &&
    s.current >= 0 &&
    s.current < n &&
    typeof s.startedAt === 'number'
  );
}

/** Fills in what sessions saved by older versions don't have, and restarts the clock of the question. */
function upgrade(s: Session): Session {
  const n = s.questions.length;
  const complete =
    Array.isArray(s.parts) &&
    s.parts.at(-1)?.end === n &&
    Number.isInteger(s.part) &&
    !!s.parts[s.part] &&
    s.flagged?.length === n &&
    s.times?.length === n;
  return {
    ...s,
    ...(complete
      ? {}
      : {
          parts: [{ kind: 'main' as const, start: 0, end: n }],
          part: 0,
          flagged: s.questions.map(() => false),
          times: s.questions.map(() => 0),
        }),
    enteredAt: Date.now(),
  };
}

/** The last quiz, kept so that it survives a page refresh. */
export function readSession(): SavedSession | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return isSaved(value) ? { ...value, session: upgrade(value.session) } : null;
  } catch {
    return null;
  }
}

export function writeSession(saved: SavedSession): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // Storage unavailable: the quiz lasts until the page is closed.
  }
}
