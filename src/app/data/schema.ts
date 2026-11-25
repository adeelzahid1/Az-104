/**
 * AZ-104 question bank data model.
 *
 * Each domain has JSON files loaded lazily: core (converted from the markdown bank),
 * ext1-3 (additional sets) and exam (exam-style formats: drop-downs, matching, code reading
 * and case studies). Case study texts live in cases.json.
 */

export type QuestionType = 'mcq' | 'multi' | 'yesno' | 'order' | 'dropdown' | 'match';

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
  /** Code, command or output shown with the question (Bicep, JSON, KQL, CLI, tables). */
  code?: string;
  /** Tests understanding of a concept rather than recall (the d*-concept.json files). */
  concept?: true;
  /** Problem-solution set: the same problem (ctx) with different solutions, three per set. */
  set?: string;
  /** Case study this question belongs to (see cases.json). Parts of a case are served together. */
  caseId?: string;
  /** mcq/multi options. */
  opts?: string[];
  /** Runtime only: after shuffling, the original index of each option shown (see shuffleOptions). */
  optOrder?: number[];
  /** yesno statements. */
  stmts?: string[];
  /** order: items in the scrambled order presented. match: the items to be matched. */
  items?: string[];
  /** match: the choices each item can be matched to (a choice may be used more than once). */
  targets?: string[];
  /** dropdown: text with [[0]], [[1]], … where each drop-down appears. */
  tpl?: string;
  /** dropdown: render the template as code (monospace, line breaks kept). */
  mono?: boolean;
  /** dropdown: the options for each drop-down, in [[n]] order. */
  blanks?: string[][];
  /**
   * Correct answer:
   * - mcq: [index]
   * - multi: [index, index, ...]
   * - yesno: boolean[] aligned with stmts
   * - order: item indices in correct sequence
   * - dropdown: chosen option index for each blank
   * - match: target index for each item
   */
  ans: number[] | boolean[];
  /** Explanation: why correct is correct (and key wrong-option notes). */
  exp: string;
  /** Official Microsoft Learn/docs link. */
  link: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  sections: { heading: string; body: string }[];
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
