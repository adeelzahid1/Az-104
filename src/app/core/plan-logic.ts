import { Evidence, estimate } from './readiness';

export interface SectionState {
  id: string;
  /** Share of the exam this section stands for. */
  weight: number;
  /** Questions in the bank. */
  size: number;
  evidence: Evidence | undefined;
}

export type Task =
  | { kind: 'section'; section: string; target: number }
  | { kind: 'cards'; target: number }
  | { kind: 'mistakes'; ids: string[] }
  | { kind: 'mock'; target: number }
  | { kind: 'cheat' };

export type Phase = 'learn' | 'review' | 'light' | 'exam' | 'past';

export type Minutes = 30 | 60 | 90;

export interface PlanInput {
  daysLeft: number;
  minutes: Minutes;
  sections: SectionState[];
  due: number;
  mistakeIds: string[];
  /** Days since the last mock exam, or null when there was none. */
  lastMockDays: number | null;
}

const MIN_PER_QUESTION = 2;
const MIN_PER_CARD = 0.5;
const MIN_PER_MISTAKE = 1.5;
const SIZES = [20, 10, 5];
/** Answered questions at which a section counts as covered. */
const COVERED = 30;

/** Local calendar day as yyyy-mm-dd. */
export function dayKey(time: number): string {
  const d = new Date(time);
  const two = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
}

/** Midnight (local) at the start of a yyyy-mm-dd day. */
export function dayStart(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

/** Whole calendar days from one day to another; rounding absorbs daylight saving changes. */
export function daysBetween(from: string, to: string): number {
  return Math.round((dayStart(to) - dayStart(from)) / 86_400_000);
}

export function phaseOf(daysLeft: number): Phase {
  if (daysLeft < 0) return 'past';
  if (daysLeft === 0) return 'exam';
  if (daysLeft <= 2) return 'light';
  return daysLeft <= 14 ? 'review' : 'learn';
}

/** How much a section needs work: exam weight times what is still missing. */
export function priority(s: SectionState): number {
  const coverage = Math.min(1, (s.evidence?.n ?? 0) / Math.min(COVERED, Math.max(1, s.size)));
  return s.weight * (1 - estimate(s.evidence) * coverage);
}

/** Today's work, within the minutes available. */
export function buildTasks(input: PlanInput): Task[] {
  const { minutes, sections, due, mistakeIds, lastMockDays } = input;
  const phase = phaseOf(input.daysLeft);
  if (phase === 'past') return [];
  if (phase === 'exam') return [{ kind: 'cheat' }];

  const tasks: Task[] = [];
  let left: number = minutes;
  const cards = Math.min(due, Math.floor((minutes * (phase === 'learn' ? 0.25 : 0.3)) / MIN_PER_CARD));
  if (cards) tasks.push({ kind: 'cards', target: cards });
  left -= cards * MIN_PER_CARD;

  const mistakes = mistakeIds.slice(0, Math.floor((minutes * (phase === 'learn' ? 0.2 : 0.4)) / MIN_PER_MISTAKE));
  if (phase === 'light') {
    if (mistakes.length) tasks.push({ kind: 'mistakes', ids: mistakes });
    return [...tasks, { kind: 'cheat' }];
  }

  const everyDays = phase === 'learn' ? 7 : 3;
  if (lastMockDays === null || lastMockDays >= everyDays) {
    return [...tasks, { kind: 'mock', target: minutes >= 90 ? 40 : 20 }];
  }

  if (mistakes.length) tasks.push({ kind: 'mistakes', ids: mistakes });
  left -= mistakes.length * MIN_PER_MISTAKE;

  // In the last two weeks nothing new is started, as long as something was started before.
  const started = sections.filter((s) => s.evidence);
  const pool = phase === 'review' && started.length ? started : sections;
  const wanted = phase === 'review' ? 1 : minutes / 30;
  const per = SIZES.find((n) => n * MIN_PER_QUESTION <= left / wanted) ?? 5;
  // One section per domain first, so that a day isn't all about the same topic.
  const ranked = [...pool].sort((a, b) => priority(b) - priority(a));
  const domain = (s: SectionState) => s.id.charAt(0);
  const best = ranked.filter((s, i) => ranked.findIndex((x) => domain(x) === domain(s)) === i);
  const chosen = [...best, ...ranked.filter((s) => !best.includes(s))].slice(0, wanted);
  return [
    ...tasks,
    ...chosen.map((s): Task => ({ kind: 'section', section: s.id, target: Math.min(per, s.size) })),
  ];
}
