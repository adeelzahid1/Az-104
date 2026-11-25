import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { Shortcuts } from '../core/shortcuts';
import { Language } from '../i18n/language';
import { closeOnBackdrop } from './dialog';

const SYMBOLS: Record<string, string> = {
  ArrowRight: '→',
  ArrowLeft: '←',
  ArrowUp: '↑',
  ArrowDown: '↓',
  Escape: 'Esc',
};

/** List of the keyboard shortcuts that work on the current page. */
@Component({
  selector: 'app-shortcut-help',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let tk = t().keys;
    <dialog #dialog aria-labelledby="keys-title" (close)="shortcuts.helpOpen.set(false)" (click)="closeOnBackdrop($event, dialog)">
      <header>
        <h2 id="keys-title">{{ tk.title }}</h2>
        <button type="button" class="btn small" (click)="dialog.close()">{{ tk.close }}</button>
      </header>
      <label>
        <input #on type="checkbox" [checked]="shortcuts.enabled()" (change)="shortcuts.setEnabled(on.checked)" />
        {{ tk.enabled }}
      </label>
      @if (shortcuts.helpOpen()) {
        <div class="groups">
          @for (g of shortcuts.groups(); track $index) {
            <section>
              <h3>{{ g.title }}</h3>
              <dl>
                @for (s of g.items; track $index) {
                  <div>
                    <dt>
                      @for (k of s.keys; track k) {
                        @for (part of k.split(' '); track $index) {
                          <kbd>{{ show(part) }}</kbd>
                        }
                      }
                    </dt>
                    <dd>{{ s.label }}</dd>
                  </div>
                }
              </dl>
            </section>
          }
        </div>
      }
    </dialog>
  `,
  styles: `
    dialog {
      width: min(900px, calc(100vw - 24px));
      max-height: calc(100vh - 40px);
      padding: 20px 24px;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: var(--surface);
      color: var(--text);
    }
    dialog::backdrop {
      background: rgba(0, 0, 0, 0.5);
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 12px;
    }
    label {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .groups {
      columns: 360px;
      column-gap: 32px;
    }
    section {
      break-inside: avoid;
    }
    h3 {
      margin: 18px 0 4px;
      font-size: 0.95rem;
      color: var(--accent);
    }
    dl {
      margin: 0;
    }
    dl div {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 12px;
      padding: 4px 0;
      border-bottom: 1px solid var(--border);
    }
    dt {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      align-items: center;
    }
    dd {
      margin: 0;
    }
  `,
})
export class ShortcutHelp {
  protected readonly shortcuts = inject(Shortcuts);
  protected readonly t = inject(Language).t;
  protected readonly closeOnBackdrop = closeOnBackdrop;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      if (this.shortcuts.helpOpen()) this.dialog().nativeElement.showModal();
    });
  }

  protected show(key: string): string {
    return SYMBOLS[key] ?? (key.length === 1 ? key.toUpperCase() : key);
  }
}
