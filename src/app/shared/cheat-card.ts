import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ShownCard } from '../features/cheatsheet/cheatsheet-data';
import { Language } from '../i18n/language';
import { RichText } from './rich-text';

/** One card of the cheat sheet: a table, commands and points. Links can be added inside the element. */
@Component({
  selector: 'app-cheat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RichText],
  templateUrl: './cheat-card.html',
  styleUrl: './cheat-card.css',
})
export class CheatCardView {
  readonly card = input.required<ShownCard>();
  protected readonly t = inject(Language).t;
}
