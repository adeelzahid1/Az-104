import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import cheatsheetJson from '../../data/cheatsheet.json';
import { Language } from '../../i18n/language';
import { RichText } from '../../shared/rich-text';
import { CheatGroup, filterGroups } from './cheatsheet-data';

const GROUPS = cheatsheetJson as unknown as CheatGroup[];

@Component({
  selector: 'app-cheatsheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RichText],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.css',
})
export class Cheatsheet {
  /** Optional ?g=numbers query parameter: the group to show. */
  readonly g = input<string>();

  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly language = inject(Language);

  protected readonly t = this.language.t;
  private readonly lang = computed(() => (this.language.isRoman() ? 1 : 0));
  protected readonly search = signal('');
  protected readonly group = linkedSignal(() => {
    const wanted = this.g();
    return GROUPS.some((x) => x.id === wanted) ? (wanted as string) : '';
  });
  protected readonly chips = computed(() =>
    GROUPS.map((x) => ({ id: x.id, label: typeof x.t === 'string' ? x.t : x.t[this.lang()] })),
  );
  /** Groups in the current language, filtered. A search looks in every group. */
  protected readonly groups = computed(() => {
    const term = this.search().trim();
    return filterGroups(term ? GROUPS : GROUPS.filter((x) => !this.group() || x.id === this.group()), this.lang(), term);
  });
  protected readonly count = computed(() => this.groups().reduce((n, x) => n + x.cards.length, 0));

  protected choose(id: string): void {
    this.search.set('');
    this.group.set(id);
    this.router.navigate([], { queryParams: { g: id || null }, replaceUrl: true });
  }

  protected print(): void {
    this.document.defaultView?.print();
  }
}
