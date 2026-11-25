import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Backup, BackupService, parseBackup } from '../../core/backup';
import { Language } from '../../i18n/language';

/** Export progress to a file, and import it in this or another browser. */
@Component({
  selector: 'app-backup-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let tb = t().backup;
    <section class="card">
      <h2>{{ tb.title }}</h2>
      <p class="muted">{{ tb.lead }}</p>
      <div class="row">
        <button type="button" class="btn" (click)="exportFile()">{{ tb.export }}</button>
        <button type="button" class="btn" (click)="picker.click()">{{ tb.import }}</button>
        <input
          #picker
          type="file"
          accept=".json,application/json"
          hidden
          [attr.aria-label]="tb.import"
          (change)="read(picker)"
        />
      </div>
      @if (pending(); as p) {
        <p>{{ tb.confirm(count(p.progress), count(p.study), p.exportedAt.slice(0, 10)) }}</p>
        <div class="row">
          <button type="button" class="btn danger" (click)="apply(p)">{{ tb.replace }}</button>
          <button type="button" class="btn" (click)="pending.set(null)">{{ tb.cancel }}</button>
        </div>
      }
      <p role="status" aria-live="polite">{{ message() ? tb.messages[message()] : '' }}</p>
    </section>
  `,
})
export class BackupPanel {
  private readonly backups = inject(BackupService);
  private readonly document = inject(DOCUMENT);
  protected readonly t = inject(Language).t;
  protected readonly pending = signal<Backup | null>(null);
  protected readonly message = signal<'' | 'invalid' | 'done'>('');

  protected count(entries: Record<string, unknown>): number {
    return Object.keys(entries).length;
  }

  protected exportFile(): void {
    const backup = this.backups.create();
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(backup)], { type: 'application/json' }),
    );
    const link = this.document.createElement('a');
    link.href = url;
    link.download = `az104-progress-${backup.exportedAt.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected async read(input: HTMLInputElement): Promise<void> {
    const file = input.files?.[0];
    if (!file) return;
    const backup = parseBackup(await file.text());
    // Lets the same file be chosen again.
    input.value = '';
    this.pending.set(backup);
    this.message.set(backup ? '' : 'invalid');
  }

  protected apply(backup: Backup): void {
    this.backups.restore(backup);
    this.pending.set(null);
    this.message.set('done');
  }
}
