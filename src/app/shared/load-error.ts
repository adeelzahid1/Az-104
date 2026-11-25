import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Language } from '../i18n/language';

/**
 * Shown when the question files can't be downloaded. "Try again" reloads the page, which also
 * recovers a tab that was left open while a new version of the site was published.
 */
@Component({
  selector: 'app-load-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card" role="alert">
      <p>{{ t().loadError.text }}</p>
      <button type="button" class="btn primary" (click)="reload()">{{ t().loadError.retry }}</button>
    </div>
  `,
})
export class LoadError {
  private readonly document = inject(DOCUMENT);
  protected readonly t = inject(Language).t;

  protected reload(): void {
    this.document.location.reload();
  }
}
