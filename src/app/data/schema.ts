/**
 * AZ-104 question bank data model.
 *
 * Each domain has 4 JSON files of 50 questions (core = converted from the
 * markdown bank, ext1-3 = additional sets). Loaded lazily per domain.
 */

export type QuestionType = 'mcq' | 'multi' | 'yesno' | 'order';

/** 1 = easy, 2 = medium, 3 = hard */
export type Difficulty = 1 | 2 | 3;

export interface Question {
  /** Unique id, e.g. "D1-051" */
  id: string;
  /** Subtopic label used for weak-area grouping, e.g. "RBAC" */
  sub: string;
  type: QuestionType;
  diff: Difficulty;
  /** Optional scenario/context paragraph shown above the question */
  ctx?: string;
  /** Question text. For yesno, the lead-in instruction. */
  q: string;
  /** mcq/multi options. Absent for yesno/order. */
  opts?: string[];
  /** yesno statements. */
  stmts?: string[];
  /** order items, in the scrambled order presented. */
  items?: string[];
  /**
   * Correct answer:
   * - mcq: [index]
   * - multi: [index, index, ...]
   * - yesno: boolean[] aligned with stmts
   * - order: item indices in correct sequence
   */
  ans: number[] | boolean[];
  /** Explanation: why correct is correct (and key wrong-option notes). */
  exp: string;
  /** Official Microsoft Learn/docs link. */
  link: string;
}

export interface DomainInfo {
  /** 1-5 */
  id: number;
  name: string;
  weightLabel: string;
  /** Mid-point of the official weight range; normalize before distributing mock-exam questions. */
  weight: number;
}

export const DOMAINS: DomainInfo[] = [
  { id: 1, name: 'Manage Azure identities and governance', weightLabel: '20–25%', weight: 0.225 },
  { id: 2, name: 'Implement and manage storage', weightLabel: '15–20%', weight: 0.175 },
  { id: 3, name: 'Deploy and manage Azure compute resources', weightLabel: '20–25%', weight: 0.225 },
  { id: 4, name: 'Implement and manage virtual networking', weightLabel: '15–20%', weight: 0.175 },
  { id: 5, name: 'Monitor and maintain Azure resources', weightLabel: '10–15%', weight: 0.125 },
];
