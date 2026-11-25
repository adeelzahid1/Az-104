import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Spinner with a text, above grey lines where the content will appear. */
@Component({
  selector: 'app-loader',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p role="status"><span class="spinner" aria-hidden="true"></span> {{ text() }}</p>
    <div class="lines" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
  `,
  styles: `
    :host {
      display: block;
      padding: 18px 20px;
      margin-bottom: 16px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--surface);
    }
    p {
      display: flex;
      gap: 10px;
      align-items: center;
      margin: 0 0 16px;
      font-weight: 600;
    }
    .lines {
      display: grid;
      gap: 12px;
    }
    .lines span {
      height: 14px;
      border-radius: 7px;
      background: var(--surface-2);
      animation: pulse 1.2s ease-in-out infinite alternate;
    }
    .lines span:nth-child(2) {
      width: 92%;
    }
    .lines span:nth-child(3) {
      width: 97%;
    }
    .lines span:nth-child(4) {
      width: 60%;
    }
    @keyframes pulse {
      to {
        opacity: 0.4;
      }
    }
  `,
})
export class Loader {
  readonly text = input.required<string>();
}
