import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Plan } from '../../core/plan';
import { SECTIONS } from '../../core/sections';
import { registerShortcuts } from '../../core/shortcuts';
import cheatsheetJson from '../../data/cheatsheet.json';
import labsJson from '../../data/labs.json';
import { DOMAINS } from '../../data/schema';
import { Language } from '../../i18n/language';
import { CheatCardView } from '../../shared/cheat-card';
import { LoadError } from '../../shared/load-error';
import { RichText } from '../../shared/rich-text';
import { CheatGroup, filterGroups } from '../cheatsheet/cheatsheet-data';
import { NotesContent } from './notes-content';
import { searchNote, toNote } from './notes-data';

const GROUPS = cheatsheetJson as unknown as CheatGroup[];

const LAST_KEY = 'az104-notes-last';

function readLast(): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
}

function saveLast(id: string): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(LAST_KEY, id);
  } catch {
    // Storage unavailable: the notes open at the first section next time.
  }
}

@Component({
  selector: 'app-notes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RichText, CheatCardView, LoadError],
  templateUrl: './notes.html',
  styleUrl: './notes.css',
})
export class Notes {
  /** Optional ?s=1.3 query parameter: the section to show. */
  readonly s = input<string>();
  /** Optional ?p=2 query parameter: the part of the section to scroll to. */
  readonly p = input<string>();

  private readonly content = inject(NotesContent);
  private readonly plan = inject(Plan);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly language = inject(Language);

  protected readonly t = this.language.t;
  protected readonly isRoman = this.language.isRoman;
  protected readonly failed = this.content.failed;
  protected readonly search = signal('');
  private readonly lang = computed(() => (this.isRoman() ? 1 : 0));

  /** Without a section in the URL, the one that was open last. */
  protected readonly section = computed(
    () => SECTIONS.find((x) => x.id === this.s()) ?? SECTIONS.find((x) => x.id === readLast()) ?? SECTIONS[0],
  );

  protected readonly note = computed(() => {
    const raw = this.content.notes()[this.section().id];
    return raw ? toNote(raw, this.lang()) : null;
  });
  private readonly shown = computed(() => !!this.note());

  /** Sections of which every official skill is marked "read" in the checklist. */
  protected readonly read = computed(() => {
    const marks = this.plan.skills();
    return new Set(SECTIONS.filter((x) => x.skills.every((k) => marks[k]?.read)).map((x) => x.id));
  });

  protected readonly domains = computed(() =>
    DOMAINS.map((d) => ({
      id: d.id,
      sections: SECTIONS.filter((x) => x.domain === d.id).map((x) => ({
        id: x.id,
        name: this.isRoman() ? x.ro : x.en,
        read: this.read().has(x.id),
      })),
    })),
  );
  protected readonly total = SECTIONS.length;
  protected readonly name = computed(() => (this.isRoman() ? this.section().ro : this.section().en));
  protected readonly isRead = computed(() => this.read().has(this.section().id));

  protected readonly prev = computed(() => this.neighbour(-1));
  protected readonly next = computed(() => this.neighbour(1));

  /** Cheat-sheet cards and labs that belong to the section. */
  protected readonly cards = computed(() =>
    filterGroups(GROUPS, this.lang())
      .flatMap((g) => g.cards)
      .filter((c) => c.section === this.section().id),
  );
  protected readonly labs = computed(() => {
    const { id, skills } = this.section();
    return labsJson
      .filter((l) => l.section === id || l.skills.some((k) => skills.includes(k)))
      .map((l) => ({ id: l.id, title: l.t[this.lang()] }));
  });

  protected readonly term = computed(() => {
    const term = this.search().trim();
    return term.length > 1 ? term : '';
  });
  protected readonly results = computed(() => {
    const term = this.term();
    if (!term) return [];
    const notes = this.content.notes();
    return SECTIONS.filter((x) => notes[x.id])
      .map((x) => ({
        id: x.id,
        name: this.isRoman() ? x.ro : x.en,
        hits: searchNote(toNote(notes[x.id], this.lang()), term),
      }))
      .filter((x) => x.hits.length);
  });
  protected readonly hitCount = computed(() => this.results().reduce((n, x) => n + x.hits.length, 0));

  /** Self-check answers that are open. */
  protected readonly open = linkedSignal<unknown, ReadonlySet<number>>({
    source: this.section,
    computation: () => new Set<number>(),
  });

  protected readonly allOpen = computed(() => this.open().size === (this.note()?.checks.length ?? 0));

  constructor() {
    registerShortcuts(
      () => this.t().notes.title,
      () => {
        const tn = this.t().notes;
        const tk = this.t().keys;
        const next = this.next();
        const prev = this.prev();
        return [
          { keys: ['ArrowRight'], label: tk.nextSection, run: () => next && this.choose(next.id), when: () => !!next && !this.term() },
          { keys: ['ArrowLeft'], label: tk.prevSection, run: () => prev && this.choose(prev.id), when: () => !!prev && !this.term() },
          { keys: ['a'], label: tn.showAll, run: () => this.toggleAll() },
          { keys: ['r'], label: tn.markRead, run: () => this.setRead(!this.isRead()) },
        ];
      },
    );
    effect(() => {
      const { id, domain } = this.section();
      saveLast(id);
      untracked(() => this.content.load(domain));
    });
    effect(() => {
      if (this.term()) untracked(() => this.content.loadAll());
    });
    // A new section starts at its top, a search result at its part.
    afterRenderEffect(() => {
      const part = this.p();
      this.section();
      if (!this.shown() || this.term()) return;
      this.document.querySelector('.side a.active')?.scrollIntoView({ block: 'nearest' });
      if (part) untracked(() => this.goTo(Number(part)));
      else this.document.defaultView?.scrollTo({ top: 0, behavior: 'instant' });
    });
  }

  protected choose(id: string): void {
    this.search.set('');
    this.router.navigate([], { queryParams: { s: id } });
  }

  protected goTo(part: number): void {
    const heading = this.document.getElementById(`part-${part}`);
    heading?.scrollIntoView();
    heading?.focus({ preventScroll: true });
  }

  protected toggle(i: number): void {
    this.open.update((set) => {
      const next = new Set(set);
      if (!next.delete(i)) next.add(i);
      return next;
    });
  }

  protected toggleAll(): void {
    const count = this.note()?.checks.length ?? 0;
    this.open.set(new Set(this.allOpen() ? [] : Array.from({ length: count }, (_, i) => i)));
  }

  protected setRead(read: boolean): void {
    this.plan.markRead(this.section().skills, read);
  }

  protected print(): void {
    this.document.defaultView?.print();
  }

  private neighbour(step: number) {
    const x = SECTIONS[SECTIONS.indexOf(this.section()) + step];
    return x ? { id: x.id, name: this.isRoman() ? x.ro : x.en } : null;
  }
}
