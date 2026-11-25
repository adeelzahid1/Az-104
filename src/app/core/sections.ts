import sectionsJson from '../data/study-sections.json';

export interface Section {
  id: string;
  domain: number;
  en: string;
  ro: string;
  subs: string[];
  /** Sub-skills of the official outline (April 17, 2026) that this section covers. */
  skills: string[];
}

export const SECTIONS = sectionsJson as Section[];

const BY_SUB = new Map(
  SECTIONS.flatMap((s) => s.subs.map((sub) => [`${s.domain}|${sub}`, s.id] as const)),
);

/** Section of a subtopic, or '' when there is none. */
export const sectionOf = (domain: number, sub: string): string => BY_SUB.get(`${domain}|${sub}`) ?? '';
