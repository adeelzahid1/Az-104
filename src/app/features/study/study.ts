import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import sectionsJson from '../../data/study-sections.json';
import { CaseStudy, DOMAINS, Question } from '../../data/schema';
import { Progress } from '../../core/progress';
import { QuestionBank } from '../../core/question-bank';
import { domainOf, shuffleOptions } from '../../core/quiz-logic';
import { Rating, nextInterval } from '../../core/srs';
import { StudyProgress } from '../../core/study-progress';
import { Language } from '../../i18n/language';
import { RomanContent } from '../../i18n/roman-content';
import { CasePanel } from '../../shared/case-panel';
import { QuestionView } from '../../shared/question-view';

interface Section {
  id: string;
  domain: number;
  en: string;
  ro: string;
  subs: string[];
  /** Sub-skills of the official outline (April 17, 2026) that this section covers. */
  skills: string[];
}

type Filter = 'all' | 'todo' | 'bookmarked' | 'due' | 'mistakes';
type Level = 0 | 1 | 2 | 3;

const SECTIONS = sectionsJson as Section[];
/** Id of the sidebar entry that lists every case study. */
export const CASES = 'cases';
const PAGE = 20;
const FILTERS: Filter[] = ['all', 'todo', 'bookmarked', 'due', 'mistakes'];

@Component({
  selector: 'app-study',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuestionView, CasePanel, RouterLink],
  templateUrl: './study.html',
  styleUrl: './study.css',
})
export class Study {
  /** Optional ?s=1.1 query parameter: the section to open. */
  readonly s = input<string>();

  private readonly bank = inject(QuestionBank);
  private readonly progress = inject(Progress);
  private readonly roman = inject(RomanContent);
  private readonly router = inject(Router);
  private readonly language = inject(Language);
  protected readonly study = inject(StudyProgress);

  protected readonly t = this.language.t;
  protected readonly isRoman = this.language.isRoman;
  protected readonly cases = CASES;
  protected readonly filters = FILTERS;
  protected readonly levels: Level[] = [0, 1, 2, 3];
  protected readonly sections = SECTIONS;
  protected readonly domains = DOMAINS.map((d) => ({
    ...d,
    sections: SECTIONS.filter((s) => s.domain === d.id),
  }));

  private readonly sectionOf = new Map(
    SECTIONS.flatMap((s) => s.subs.map((sub) => [`${s.domain}|${sub}`, s.id] as const)),
  );

  /** All questions, options shuffled once per visit; null while loading. */
  protected readonly all = signal<Question[] | null>(null);
  private readonly caseStudies = signal<Record<string, CaseStudy>>({});
  private readonly now = signal(Date.now());

  protected readonly selected = linkedSignal(() => {
    const wanted = this.s();
    return wanted === CASES || SECTIONS.some((s) => s.id === wanted) ? (wanted as string) : '1.1';
  });
  protected readonly search = signal('');
  protected readonly level = signal<Level>(0);
  protected readonly filter = signal<Filter>('all');
  protected readonly mode = signal<'list' | 'cards'>('list');

  private readonly view = computed(() => ({
    section: this.selected(),
    search: this.search(),
    level: this.level(),
    filter: this.filter(),
    mode: this.mode(),
    loaded: this.all() !== null,
  }));

  protected readonly limit = linkedSignal({ source: this.view, computation: () => PAGE });
  protected readonly revealed = linkedSignal<unknown, ReadonlySet<string>>({
    source: this.view,
    computation: () => new Set<string>(),
  });

  protected readonly bySection = computed(() => {
    const map = new Map<string, Question[]>();
    for (const q of this.all() ?? []) {
      const id = this.sectionIdOf(q);
      map.set(id, [...(map.get(id) ?? []), q]);
    }
    return map;
  });

  /** "understood/total" for every sidebar entry. */
  protected readonly stats = computed(() => {
    const understood = this.study.understoodIds();
    const out = new Map<string, string>();
    for (const [id, qs] of this.bySection()) {
      out.set(id, `${qs.filter((q) => understood.has(q.id)).length}/${qs.length}`);
    }
    return out;
  });

  protected readonly title = computed(() => {
    const id = this.selected();
    if (id === CASES) return this.t().study.caseStudies;
    const section = SECTIONS.find((s) => s.id === id);
    return section ? `${section.id} ${this.isRoman() ? section.ro : section.en}` : '';
  });

  protected readonly skills = computed(() => SECTIONS.find((s) => s.id === this.selected())?.skills ?? []);

  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const level = this.level();
    const filter = this.filter();
    const now = this.now();
    const understood = this.study.understoodIds();
    const bookmarked = this.study.bookmarkedIds();
    const mistakes = new Set(this.progress.mistakeIds());
    return (this.bySection().get(this.selected()) ?? []).filter(
      (q) =>
        (level === 0 || q.diff === level) &&
        (filter === 'all' ||
          (filter === 'todo' && !understood.has(q.id)) ||
          (filter === 'bookmarked' && bookmarked.has(q.id)) ||
          (filter === 'due' && this.study.isDue(q.id, now)) ||
          (filter === 'mistakes' && mistakes.has(q.id))) &&
        (!term || this.searchText(q).includes(term)),
    );
  });

  /** Study list page: questions shown so far, with the case text before each case's first part. */
  protected readonly visible = computed(() =>
    this.filtered()
      .slice(0, this.limit())
      .map((q, i, list) => ({
        q,
        caseStudy:
          q.caseId && (i === 0 || list[i - 1].caseId !== q.caseId)
            ? (this.caseStudies()[q.caseId] ?? null)
            : null,
      })),
  );

  // Flashcards: a deck built from the filters when they change; ratings don't reshuffle it.
  protected readonly queue = linkedSignal({
    source: this.view,
    computation: () => untracked(() => this.filtered().map((q) => q.id)),
  });
  protected readonly pos = linkedSignal({ source: this.view, computation: () => 0 });
  protected readonly flipped = linkedSignal({ source: this.pos, computation: () => false });

  private readonly byId = computed(() => new Map((this.all() ?? []).map((q) => [q.id, q])));
  protected readonly cardQuestion = computed(() => this.byId().get(this.queue()[this.pos()] ?? '') ?? null);
  protected readonly cardCase = computed(() => {
    const id = this.cardQuestion()?.caseId;
    return id ? (this.caseStudies()[id] ?? null) : null;
  });

  constructor() {
    afterNextRender(async () => {
      const [questions, cases] = await Promise.all([
        this.bank.domains(DOMAINS.map((d) => d.id)),
        this.bank.cases(),
      ]);
      this.caseStudies.set(cases);
      this.all.set(questions.map((q) => shuffleOptions(q)));
    });
  }

  protected sectionIdOf(q: Question): string {
    return q.caseId ? CASES : (this.sectionOf.get(`${domainOf(q)}|${q.sub}`) ?? '');
  }

  protected choose(id: string): void {
    this.selected.set(id);
    this.router.navigate([], { queryParams: { s: id }, replaceUrl: true });
  }

  protected setFilter(value: string): void {
    this.filter.set(FILTERS.includes(value as Filter) ? (value as Filter) : 'all');
  }

  protected toggleReveal(id: string): void {
    this.revealed.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected rate(id: string, rating: Rating): void {
    this.study.rate(id, rating);
    if (rating === 'again') this.queue.update((q) => [...q, id]);
    this.pos.update((p) => p + 1);
    this.now.set(Date.now());
  }

  /** When a card would come back for each rating, e.g. "10 min" or "3 days". */
  protected intervalLabel(id: string, rating: Rating): string {
    const days = nextInterval(this.study.card(id), rating);
    const ts = this.t().study;
    return days === 0 ? ts.inMinutes(10) : ts.inDays(days);
  }

  protected restart(): void {
    this.now.set(Date.now());
    this.queue.set(this.filtered().map((q) => q.id));
    this.pos.set(0);
  }

  /** Text searched for a question, in the language currently shown. */
  private searchText(q: Question): string {
    const shown = this.roman.question(q);
    return [
      q.id,
      q.sub,
      shown.ctx,
      shown.q,
      shown.tpl,
      shown.exp,
      ...(shown.opts ?? []),
      ...(shown.stmts ?? []),
      ...(shown.items ?? []),
      ...(shown.targets ?? []),
    ]
      .join(' ')
      .toLowerCase();
  }
}
