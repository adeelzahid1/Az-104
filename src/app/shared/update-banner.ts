import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate } from '@angular/service-worker';
import { Language } from '../i18n/language';

const CHECK_EVERY_MS = 30 * 60 * 1000;

/** The site is kept in the browser. This offers a new version as soon as it has been downloaded. */
@Component({
  selector: 'app-update-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:visibilitychange)': 'check()' },
  template: `
    @if (ready()) {
      <div class="banner no-print" role="status">
        <span>{{ t().update.text }}</span>
        <button type="button" class="btn small primary" (click)="reload()">{{ t().update.now }}</button>
        <button type="button" class="btn small" (click)="ready.set(false)">{{ t().update.later }}</button>
      </div>
    }
  `,
  styles: `
    .banner {
      position: fixed;
      left: 50%;
      bottom: 16px;
      z-index: 15;
      display: flex;
      flex-wrap: wrap;
      gap: 8px 12px;
      align-items: center;
      width: max-content;
      max-width: calc(100vw - 24px);
      padding: 12px 18px;
      border: 1px solid var(--accent);
      border-radius: 12px;
      background: var(--surface);
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.2);
      transform: translateX(-50%);
    }
  `,
})
export class UpdateBanner {
  private readonly updates = inject(SwUpdate, { optional: true });
  private readonly document = inject(DOCUMENT);
  protected readonly t = inject(Language).t;
  protected readonly ready = signal(false);
  private checkedAt = Date.now();

  constructor() {
    if (!this.updates?.isEnabled) return;
    this.updates.versionUpdates.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event.type === 'VERSION_READY') this.ready.set(true);
    });
    // The kept copy is broken, e.g. the browser removed part of it: load the site again.
    this.updates.unrecoverable.pipe(takeUntilDestroyed()).subscribe(() => this.reload());
  }

  /** A tab can stay open for days: look for a new version when it is shown again. */
  protected check(): void {
    if (!this.updates?.isEnabled || this.document.hidden || Date.now() - this.checkedAt < CHECK_EVERY_MS) return;
    this.checkedAt = Date.now();
    this.updates.checkForUpdate().catch(() => undefined);
  }

  protected reload(): void {
    this.document.location.reload();
  }
}
