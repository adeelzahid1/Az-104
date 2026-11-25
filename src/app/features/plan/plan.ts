import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MockHistory } from '../../core/mock-history';
import { Plan as PlanService, SkillMarks } from '../../core/plan';
import { Minutes, dayKey } from '../../core/plan-logic';
import { MIN_MOCK, mockShare } from '../../core/readiness';
import { SECTIONS } from '../../core/sections';
import labsJson from '../../data/labs.json';
import { DOMAINS } from '../../data/schema';
import { Language } from '../../i18n/language';
import { TodayCard } from './today-card';

const SHOWN_MOCKS = 10;

/** The labs that practise a skill of each section. */
const LABS_OF = new Map(
  SECTIONS.map((s) => [s.id, labsJson.filter((l) => l.skills.some((k) => s.skills.includes(k))).map((l) => l.id)]),
);

@Component({
  selector: 'app-plan',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TodayCard],
  templateUrl: './plan.html',
  styleUrl: './plan.css',
})
export class Plan {
  protected readonly plan = inject(PlanService);
  private readonly history = inject(MockHistory);
  private readonly language = inject(Language);

  protected readonly t = this.language.t;
  protected readonly minutesOptions: Minutes[] = [30, 60, 90];
  protected readonly marks: (keyof SkillMarks)[] = ['read', 'understood', 'lab'];
  protected readonly minMock = MIN_MOCK;

  protected readonly band = computed(() => {
    const value = this.plan.readiness().overall;
    if (value === null) return '';
    return value >= 80 ? 'good' : value >= 70 ? 'close' : 'low';
  });

  protected readonly mocks = computed(() =>
    this.history
      .results()
      .slice(-SHOWN_MOCKS)
      .reverse()
      .map((m) => ({ ...m, day: dayKey(m.t), pct: Math.round(mockShare(m) * 100) })),
  );

  protected readonly checklist = computed(() => {
    const marks = this.plan.skills();
    const strong = this.plan.strongSections();
    const roman = this.language.isRoman();
    return DOMAINS.map((d) => {
      const sections = SECTIONS.filter((s) => s.domain === d.id).map((s) => ({
        id: s.id,
        name: roman ? s.ro : s.en,
        strong: strong.has(s.id),
        labs: LABS_OF.get(s.id) ?? [],
        skills: s.skills.map((name) => ({ name, marks: marks[name] ?? ({} as SkillMarks) })),
      }));
      const skills = sections.flatMap((s) => s.skills);
      return {
        id: d.id,
        sections,
        total: skills.length,
        done: skills.filter((x) => x.marks.understood).length,
      };
    });
  });

  protected readonly skillsTotal = computed(() => this.checklist().reduce((n, d) => n + d.total, 0));
  protected readonly skillsDone = computed(() => this.checklist().reduce((n, d) => n + d.done, 0));

  protected domainName(id: number): string {
    return `${id}. ${this.t().domains[id]}`;
  }
}
