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

  protected readonly section = computed(() => SECTIONS.find((x) => x.id === this.s()) ?? SECTIONS[0]);

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

  constructor() {
    effect(() => {
      const { domain } = this.section();
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
      else this.document.defaultView?.scrollTo({ top: 0 });
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
