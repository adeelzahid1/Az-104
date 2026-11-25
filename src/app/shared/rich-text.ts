import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface Segment {
  kind: 'text' | 'bold' | 'code';
  text: string;
}

/** Splits text with **bold** and `code` marks into segments. */
export function parseRichText(text: string): Segment[] {
  return text
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/)
    .filter(Boolean)
    .map((part): Segment => {
      if (part.length > 4 && part.startsWith('**')) return { kind: 'bold', text: part.slice(2, -2) };
      if (part.length > 2 && part.startsWith('`')) return { kind: 'code', text: part.slice(1, -1) };
      return { kind: 'text', text: part };
    });
}

/** Text with **bold** and `code` marks. */
@Component({
  selector: 'app-rich-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@for (s of segments(); track $index) {@switch (s.kind) {@case ('bold') {<strong>{{ s.text }}</strong>}@case ('code') {<code>{{ s.text }}</code>}@default {{{ s.text }}}}}`,
  styles: `
    code {
      padding: 1px 5px;
      border-radius: 4px;
      background: var(--surface-2);
      font-size: 0.9em;
      overflow-wrap: anywhere;
    }
  `,
})
export class RichText {
  readonly text = input.required<string>();
  protected readonly segments = computed(() => parseRichText(this.text()));
}
