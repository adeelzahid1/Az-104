import { Injectable, computed, inject, signal } from '@angular/core';
import { DOMAINS } from '../data/schema';
import { MockHistory } from './mock-history';
import { Minutes, Task, buildTasks, dayKey, dayStart, daysBetween, phaseOf } from './plan-logic';
import { Progress } from './progress';
import { QuestionBank } from './question-bank';
import { domainOf } from './quiz-logic';
import { Evidence, addEvidence, readiness } from './readiness';
import { SECTIONS, sectionOf } from './sections';
import { StudyProgress } from './study-progress';

/** Marks the learner sets by hand: read, understood, lab done. */
export interface SkillMarks {
  read?: true;
  understood?: true;
  lab?: true;
}

interface Today {
  key: string;
  exam: string;
  minutes: Minutes;
  tasks: Task[];
}

interface PlanState {
  exam: string;
  minutes: Minutes;
  skills: Record<string, SkillMarks>;
  /** The day's tasks stay the same while the learner works through them. */
  today: Today | null;
}

export interface TaskProgress {
  task: Task;
  done: number;
  target: number;
}

const STORAGE_KEY = 'az104-plan-v1';
const DEFAULT_EXAM = '2027-01-11';
/** Answers a section needs, and the share that must be right, for the automatic mark. */
const SECTION_ANSWERS = 10;
const SECTION_SHARE = 0.8;
const MINUTES: Minutes[] = [30, 60, 90];

const isDay = (v: unknown): v is string =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && dayKey(dayStart(v)) === v;

function clean(value: unknown): PlanState {
  const v = (value ?? {}) as Partial<PlanState>;
  const skills: Record<string, SkillMarks> = {};
  for (const [name, m] of Object.entries(v.skills ?? {})) {
    const marks: SkillMarks = {};
    if (m?.read === true) marks.read = true;
    if (m?.understood === true) marks.understood = true;
    if (m?.lab === true) marks.lab = true;
    if (Object.keys(marks).length) skills[name] = marks;
  }
  const t = v.today;
  return {
    exam: isDay(v.exam) ? v.exam : DEFAULT_EXAM,
    minutes: MINUTES.find((m) => m === v.minutes) ?? 60,
    skills,
    today: t && isDay(t.key) && Array.isArray(t.tasks) ? t : null,
  };
}

function readStorage(): PlanState {
  try {
    if (typeof localStorage === 'undefined') return clean(null);
    return clean(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));
  } catch {
    return clean(null);
  }
}

/** Exam date, daily plan, skill checklist and readiness. */
@Injectable({ providedIn: 'root' })
export class Plan {
  private readonly progress = inject(Progress);
  private readonly study = inject(StudyProgress);
  private readonly mocks = inject(MockHistory);
  private readonly bank = inject(QuestionBank);
  private readonly state = signal(readStorage());
  private readonly now = signal(Date.now());
  private readonly sizes = signal<ReadonlyMap<string, number> | null>(null);

  readonly exam = computed(() => this.state().exam);
  readonly minutes = computed(() => this.state().minutes);
  readonly skills = computed(() => this.state().skills);
  readonly today = computed(() => dayKey(this.now()));
  readonly daysLeft = computed(() => daysBetween(this.today(), this.exam()));
  readonly phase = computed(() => phaseOf(this.daysLeft()));
  readonly ready = computed(() => this.sizes() !== null);

  /** Answers per domain (key is the domain id) and per section (key is the section id). */
  private readonly evidence = computed(() => {
    const domains = new Map<number, Evidence>();
    const sections = new Map<string, Evidence>();
    for (const [id, stat] of Object.entries(this.progress.stats())) {
      const d = Number(id.charAt(1));
      domains.set(d, addEvidence(domains.get(d), stat));
      const section = sectionOf(d, stat.sub);
      if (section) sections.set(section, addEvidence(sections.get(section), stat));
    }
    return { domains, sections };
  });

  readonly readiness = computed(() =>
    readiness(DOMAINS, this.evidence().domains, this.mocks.results()),
  );

  /** Sections with enough answers, at least 80% of them right. */
  readonly strongSections = computed(
    () =>
      new Set(
        [...this.evidence().sections]
          .filter(([, e]) => e.n >= SECTION_ANSWERS && e.sum / e.n >= SECTION_SHARE)
          .map(([id]) => id),
      ),
  );

  /** Today's tasks with what has been done of each. */
  readonly tasks = computed<TaskProgress[]>(() => {
    const today = this.state().today;
    if (!today || today.key !== this.today()) return [];
    const start = dayStart(today.key);
    return today.tasks.map((task): TaskProgress => {
      switch (task.kind) {
        case 'section': {
          const done = Object.entries(this.progress.stats()).filter(
            ([id, s]) => (s.t ?? 0) >= start && sectionOf(Number(id.charAt(1)), s.sub) === task.section,
          ).length;
          return { task, target: task.target, done: Math.min(done, task.target) };
        }
        case 'cards':
          return { task, target: task.target, done: Math.min(this.study.ratedSince(start), task.target) };
        case 'mistakes': {
          // Any question that was wrong before and answered right today counts.
          const done = Object.values(this.progress.stats()).filter(
            (x) => (x.t ?? 0) >= start && x.last && x.correct < x.seen,
          ).length;
          return { task, target: task.ids.length, done: Math.min(done, task.ids.length) };
        }
        case 'mock': {
          const done = this.mocks.results().some((m) => m.t >= start && m.total >= task.target);
          return { task, target: 1, done: done ? 1 : 0 };
        }
        case 'cheat':
          return { task, target: 0, done: 0 };
      }
    });
  });

  /** Loads the question bank and makes sure there is a plan for today. */
  async load(): Promise<void> {
    this.now.set(Date.now());
    if (!this.sizes()) {
      const sizes = new Map<string, number>();
      for (const q of await this.bank.domains(DOMAINS.map((d) => d.id))) {
        const id = sectionOf(domainOf(q), q.sub);
        sizes.set(id, (sizes.get(id) ?? 0) + 1);
      }
      this.sizes.set(sizes);
    }
    this.ensureToday();
  }

  setExam(exam: string): void {
    if (!isDay(exam)) return;
    this.update((s) => ({ ...s, exam }));
    this.ensureToday();
  }

  setMinutes(minutes: Minutes): void {
    this.update((s) => ({ ...s, minutes }));
    this.ensureToday();
  }

  /** Makes a new plan for the rest of today. */
  renew(): void {
    this.now.set(Date.now());
    this.update((s) => ({ ...s, today: null }));
    this.ensureToday();
  }

  toggleSkill(skill: string, mark: keyof SkillMarks): void {
    this.update((s) => {
      const marks = { ...s.skills[skill] };
      if (marks[mark]) delete marks[mark];
      else marks[mark] = true;
      const skills = { ...s.skills, [skill]: marks };
      if (!Object.keys(marks).length) delete skills[skill];
      return { ...s, skills };
    });
  }

  snapshot(): Record<string, unknown> {
    const { exam, minutes, skills } = this.state();
    return { exam, minutes, skills };
  }

  /** Replaces exam date, minutes and checklist. Values that aren't valid are left out. */
  restore(value: unknown): void {
    this.update(() => ({ ...clean(value), today: null }));
    this.ensureToday();
  }

  private ensureToday(): void {
    const sizes = this.sizes();
    if (!sizes) return;
    const { exam, minutes, today } = this.state();
    const key = this.today();
    if (today && today.key === key && today.exam === exam && today.minutes === minutes) return;
    const perDomain = new Map<number, number>();
    for (const s of SECTIONS) perDomain.set(s.domain, (perDomain.get(s.domain) ?? 0) + 1);
    const weightOf = new Map(DOMAINS.map((d) => [d.id, d.weight]));
    const last = this.mocks.results().at(-1);
    const tasks = buildTasks({
      daysLeft: this.daysLeft(),
      minutes,
      sections: SECTIONS.map((s) => ({
        id: s.id,
        weight: (weightOf.get(s.domain) ?? 0) / (perDomain.get(s.domain) ?? 1),
        size: sizes.get(s.id) ?? 0,
        evidence: this.evidence().sections.get(s.id),
      })),
      due: this.study.dueCount(this.now()),
      mistakeIds: this.progress.mistakeIds(),
      lastMockDays: last ? daysBetween(dayKey(last.t), key) : null,
    });
    this.update((s) => ({ ...s, today: { key, exam, minutes, tasks } }));
  }

  private update(fn: (s: PlanState) => PlanState): void {
    this.state.update(fn);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
      }
    } catch {
      // Storage unavailable: the plan lasts for this visit only.
    }
  }
}
