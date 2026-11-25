import { Injectable, signal } from '@angular/core';

const SEEN_KEY = 'az104-guide-seen';

/** The guide opens at the topic of the page it is opened from. */
const TOPIC_OF_PATH: Record<string, string> = {
  notes: 'notes',
  study: 'study',
  practice: 'practice',
  quiz: 'practice',
  mock: 'mock',
  labs: 'labs',
  'weak-areas': 'weak',
  'cheat-sheet': 'weak',
};

export function topicOf(url: string): string {
  const [path, query = ''] = url.split('?');
  const page = path.split('/')[1] ?? '';
  return page === 'study' && /\bm=cards\b/.test(query) ? 'cards' : (TOPIC_OF_PATH[page] ?? 'start');
}

function readSeen(): boolean {
  try {
    return typeof localStorage === 'undefined' || localStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return true;
  }
}

/** The "how to study" popup. */
@Injectable({ providedIn: 'root' })
export class Guide {
  readonly topic = signal('start');
  readonly isOpen = signal(false);
  /** Stays true after the first opening, so that the popup is downloaded only when it is needed. */
  readonly wanted = signal(false);
  /** False until the guide was opened once: its button then shows a dot. */
  readonly seen = signal(readSeen());

  open(url: string): void {
    this.topic.set(topicOf(url));
    this.wanted.set(true);
    this.isOpen.set(true);
    this.seen.set(true);
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // Storage unavailable: the dot comes back on the next visit.
    }
  }
}
