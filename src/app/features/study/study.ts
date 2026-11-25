import { DOCUMENT } from '@angular/common';
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
import { CaseStudy, DOMAINS, Question } from '../../data/schema';
import { Progress } from '../../core/progress';
import { QuestionBank } from '../../core/question-bank';
import { domainOf, shuffleOptions } from '../../core/quiz-logic';
import { Rating, nextInterval } from '../../core/srs';
import { SECTIONS, sectionOf } from '../../core/sections';
import { Shortcut, registerShortcuts } from '../../core/shortcuts';
import { StudyProgress } from '../../core/study-progress';
import { Language } from '../../i18n/language';
import { RomanContent } from '../../i18n/roman-content';
import { CasePanel } from '../../shared/case-panel';
import { FullScreenButton } from '../../shared/full-screen-button';
import { LoadError } from '../../shared/load-error';
import { Loader } from '../../shared/loader';
import { QuestionView } from '../../shared/question-view';

type Filter = 'all' | 'todo' | 'bookmarked' | 'due' | 'mistakes';
type Level = 0 | 1 | 2 | 3;

/** Id of the sidebar entry that lists every case study. */
export const CASES = 'cases';
/** Id of the sidebar entry that covers every section. */
const ALL = 'all';
const PAGE = 20;
const FILTERS: Filter[] = ['all', 'todo', 'bookmarked', 'due', 'mistakes'];

const asFilter = (value: string | undefined): Filter =>
  FILTERS.find((name) => name === value) ?? 'all';

@Component({
  selector: 'app-study',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QuestionView, CasePanel, FullScreenButton, Loader, LoadError, RouterLink],
  templateUrl: './study.html',
  styleUrl: './study.css',
})
export class Study {
  /** Optional ?s=1.1 query parameter: the section to open. */
  readonly s = input<string>();
  /** Optional ?f=due query parameter: the filter to apply. */
  readonly f = input<string>();
  /** Optional ?m=cards query parameter: start with flashcards. */
  readonly m = input<string>();
  /** Optional ?c=1 query parameter: only concept questions. */
  readonly c = input<string>();

  private readonly bank = inject(QuestionBank);
  private readonly progress = inject(Progress);
  private readonly roman = inject(RomanContent);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly language = inject(Language);
  protected readonly study = inject(StudyProgress);

  protected readonly t = this.language.t;
  protected readonly isRoman = this.language.isRoman;
  protected readonly cases = CASES;
  protected readonly allSections = ALL;
  protected readonly quickFilters = ['due', 'bookmarked', 'mistakes'] as const;
  protected readonly filters = FILTERS;
  protected readonly levels: Level[] = [0, 1, 2, 3];
  protected readonly sections = SECTIONS;
  protected readonly domains = DOMAINS.map((d) => ({
    ...d,
    sections: SECTIONS.filter((s) => s.domain === d.id),
  }));

  /** All questions, options shuffled once per visit; null while loading. */
  protected readonly all = signal<Question[] | null>(null);
  protected readonly loadFailed = signal(false);
  private readonly caseStudies = signal<Record<string, CaseStudy>>({});
  private readonly now = signal(Date.now());

  protected readonly selected = linkedSignal(() => {
    const wanted = this.s();
    return wanted === CASES || wanted === ALL || SECTIONS.some((s) => s.id === wanted) ? (wanted as string) : '1.1';
  });
  protected readonly search = signal('');
  protected readonly level = signal<Level>(0);
  protected readonly filter = linkedSignal<Filter>(() => asFilter(this.f()));
  protected readonly conceptOnly = linkedSignal(() => this.c() === '1');
  protected readonly mode = linkedSignal<'list' | 'cards'>(() => (this.m() === 'cards' ? 'cards' : 'list'));

  private readonly view = computed(() => ({
    section: this.selected(),
    search: this.search(),
    level: this.level(),
    filter: this.filter(),
    concept: this.conceptOnly(),
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
    if (this.all()) map.set(ALL, this.all() ?? []);
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

  /** Number of questions behind each shortcut in the sidebar. */
  protected readonly quickCounts = computed(() => {
    const all = this.all();
    if (!all) return null;
    const mistakes = new Set(this.progress.mistakeIds());
    const bookmarked = this.study.bookmarkedIds();
    const now = this.now();
    return {
      concept: all.filter((q) => q.concept).length,
      due: all.filter((q) => this.study.isDue(q.id, now)).length,
      bookmarked: all.filter((q) => bookmarked.has(q.id)).length,
      mistakes: all.filter((q) => mistakes.has(q.id)).length,
    };
  });

  protected readonly title = computed(() => {
    const id = this.selected();
    if (id === CASES) return this.t().study.caseStudies;
    if (id === ALL) return this.t().study.allSections;
    const section = SECTIONS.find((s) => s.id === id);
    return section ? `${section.id} ${this.isRoman() ? section.ro : section.en}` : '';
  });

  protected readonly skills = computed(() => SECTIONS.find((s) => s.id === this.selected())?.skills ?? []);

  protected readonly filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const level = this.level();
    const filter = this.filter();
    const conceptOnly = this.conceptOnly();
    const now = this.now();
    const understood = this.study.understoodIds();
    const bookmarked = this.study.bookmarkedIds();
    const mistakes = new Set(this.progress.mistakeIds());
    return (this.bySection().get(this.selected()) ?? []).filter(
      (q) =>
        (level === 0 || q.diff === level) &&
        (!conceptOnly || !!q.concept) &&
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

  /** Study list: the question the keyboard acts on. */
  protected readonly current = linkedSignal({ source: this.view, computation: () => -1 });

  private readonly byId = computed(() => new Map((this.all() ?? []).map((q) => [q.id, q])));
  protected readonly cardQuestion = computed(() => this.byId().get(this.queue()[this.pos()] ?? '') ?? null);
  protected readonly cardCase = computed(() => {
    const id = this.cardQuestion()?.caseId;
    return id ? (this.caseStudies()[id] ?? null) : null;
  });

  constructor() {
    registerShortcuts(
      () => (this.mode() === 'cards' ? this.t().study.cards : this.t().study.list),
      () => (this.mode() === 'cards' ? this.cardKeys() : this.listKeys()),
    );
    afterNextRender(async () => {
      try {
        const [questions, cases] = await Promise.all([
          this.bank.domains(DOMAINS.map((d) => d.id)),
          this.bank.cases(),
        ]);
        this.caseStudies.set(cases);
        this.all.set(questions.map((q) => shuffleOptions(q)));
      } catch {
        this.loadFailed.set(true);
      }
    });
  }

  private cardKeys(): Shortcut[] {
    const ts = this.t().study;
    const tk = this.t().keys;
    const open = () => !!this.cardQuestion();
    const rating = (keys: string[], label: string, value: Rating): Shortcut => ({
      keys,
      label,
      run: () => this.rate(this.cardQuestion()?.id ?? '', value),
      when: () => open() && this.flipped(),
    });
    return [
      { keys: ['ArrowRight'], label: tk.nextCard, run: () => this.step(1), when: open },
      { keys: ['ArrowLeft'], label: tk.prevCard, run: () => this.step(-1), when: () => this.pos() > 0 },
      { keys: ['Space', 'Enter'], label: tk.flip, run: () => this.flipped.update((on) => !on), when: open },
      rating(['1'], ts.again, 'again'),
      rating(['2'], ts.hard, 'hard'),
      rating(['3'], ts.good, 'good'),
      { keys: ['b'], label: ts.bookmark, run: () => this.study.toggleBookmark(this.cardQuestion()?.id ?? ''), when: open },
      { keys: ['u'], label: ts.understood, run: () => this.study.toggleUnderstood(this.cardQuestion()?.id ?? ''), when: open },
      { keys: ['s'], label: tk.shuffle, run: () => this.shuffle(), when: () => this.queue().length > 1 },
      { keys: ['r'], label: ts.restart, run: () => this.restart() },
      { keys: ['v'], label: ts.list, run: () => this.setMode('list') },
    ];
  }

  private listKeys(): Shortcut[] {
    const ts = this.t().study;
    const tk = this.t().keys;
    const onCurrent = (act: (id: string) => void) => () => {
      const i = Math.max(0, this.current());
      const q = this.filtered()[i];
      if (!q) return;
      if (this.current() < 0) this.move(1);
      act(q.id);
    };
    const any = () => this.filtered().length > 0;
    return [
      { keys: ['ArrowRight', 'j'], label: tk.nextQuestion, run: () => this.move(1), when: any },
      { keys: ['ArrowLeft', 'k'], label: tk.prevQuestion, run: () => this.move(-1), when: any },
      { keys: ['Enter', 'a'], label: tk.answerToggle, run: onCurrent((id) => this.toggleReveal(id)), when: any },
      { keys: ['b'], label: ts.bookmark, run: onCurrent((id) => this.study.toggleBookmark(id)), when: any },
      { keys: ['u'], label: ts.understood, run: onCurrent((id) => this.study.toggleUnderstood(id)), when: any },
      { keys: ['v'], label: ts.cards, run: () => this.setMode('cards') },
    ];
  }

  /** Study list: moves to another question and brings it into view. */
  private move(delta: 1 | -1): void {
    const next = Math.min(this.filtered().length - 1, Math.max(0, this.current() + delta));
    this.current.set(next);
    if (next >= this.limit()) this.limit.set(next + PAGE);
    const id = this.filtered()[next]?.id;
    this.document.defaultView?.setTimeout(() => {
      const card = this.document.getElementById(`q-${id}`);
      card?.focus({ preventScroll: true });
      card?.scrollIntoView({ block: 'start' });
    });
  }

  /** Flashcards: the next or previous card, without rating it. */
  protected step(delta: 1 | -1): void {
    this.pos.update((p) => Math.min(this.queue().length, Math.max(0, p + delta)));
  }

  protected shuffle(): void {
    const ids = [...this.queue()];
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    this.queue.set(ids);
    this.pos.set(0);
    this.flipped.set(false);
  }

  private swipeStart: { x: number; y: number } | null = null;

  protected touchStart(event: TouchEvent): void {
    const t = event.changedTouches[0];
    const scrolls = event.target instanceof Element && event.target.closest('pre, select, .scroll');
    this.swipeStart = event.touches.length === 1 && !scrolls ? { x: t.clientX, y: t.clientY } : null;
  }

  /** A swipe to the left shows the next card, to the right the previous one. */
  protected touchEnd(event: TouchEvent): void {
    const start = this.swipeStart;
    this.swipeStart = null;
    if (!start) return;
    const t = event.changedTouches[0];
    const dx = t.clientX - start.x;
    if (Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(t.clientY - start.y)) this.step(dx < 0 ? 1 : -1);
  }

  protected sectionIdOf(q: Question): string {
    return q.caseId ? CASES : sectionOf(domainOf(q), q.sub);
  }

  /** Opens a section. The filter stays when moving between sections, but not when leaving a shortcut. */
  protected choose(
    id: string,
    filter: Filter = this.selected() === ALL && id !== ALL ? 'all' : this.filter(),
    conceptOnly = this.conceptOnly(),
  ): void {
    this.now.set(Date.now());
    this.selected.set(id);
    this.filter.set(filter);
    this.conceptOnly.set(conceptOnly);
    this.syncUrl();
  }

  protected setFilter(value: string): void {
    this.now.set(Date.now());
    this.filter.set(asFilter(value));
    this.syncUrl();
  }

  protected toggleConcept(): void {
    this.conceptOnly.update((on) => !on);
    this.syncUrl();
  }

  protected setMode(mode: 'list' | 'cards'): void {
    this.mode.set(mode);
    this.syncUrl();
  }

  /** Keeps section, filter and mode in the URL, so a refresh or a bookmark opens the same view. */
  private syncUrl(): void {
    this.router.navigate([], {
      queryParams: {
        s: this.selected(),
        f: this.filter() === 'all' ? null : this.filter(),
        m: this.mode() === 'cards' ? 'cards' : null,
        c: this.conceptOnly() ? 1 : null,
      },
      replaceUrl: true,
    });
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
    this.flipped.set(false);
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
