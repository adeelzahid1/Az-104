import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Display } from '../core/display';
import { Language } from '../i18n/language';

/** Button that hides the menus and fills the screen. */
@Component({
  selector: 'app-full-screen-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let full = display.fullScreen();
    @let label = full ? t().keys.exitFull : t().keys.full;
    <button
      type="button"
      class="no-print {{ compact() ? 'icon' : 'btn small' }}"
      [title]="label + ' (F)'"
      [attr.aria-label]="label"
      (click)="display.toggleFullScreen()"
    >
      {{ full ? '✕' : '⛶' }}
      @if (!compact()) {
        {{ label }} <kbd>F</kbd>
      }
    </button>
  `,
})
export class FullScreenButton {
  /** Only the icon. */
  readonly compact = input(false);

  protected readonly display = inject(Display);
  protected readonly t = inject(Language).t;
}
