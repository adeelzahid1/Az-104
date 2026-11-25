import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export interface Shortcut {
  /** Keys that run it: "ArrowRight", "Space", "Enter", "?", "b", or a sequence such as "g n". */
  keys: string[];
  /** What it does, for the list of shortcuts. */
  label: string;
  run: () => void;
  /** The shortcut does nothing while this is false. */
  when?: () => boolean;
}

/** The shortcuts of a page or a part of it. A function, so that labels follow the language. */
export interface ShortcutGroup {
  title: () => string;
  items: () => Shortcut[];
}

const STORAGE_KEY = 'az104-keys';
const SEQUENCE_MS = 1500;
const TEXT_INPUTS = /^(text|search|email|number|date|time|password|url|tel|file|range)$/;

/** Name of the key as used in Shortcut.keys. Letters are lower case whether or not Caps Lock is on. */
export function keyName(event: KeyboardEvent): string {
  if (event.key === ' ') return 'Space';
  return event.key.length === 1 ? event.key.toLowerCase() : event.key;
}

/** True when the focused element needs the key itself: typing, pressing a button, changing a list. */
export function needsKey(target: EventTarget | null, key: string): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || target.matches('textarea, select')) return true;
  if (target instanceof HTMLInputElement) {
    if (TEXT_INPUTS.test(target.type)) return true;
    // Up, down and space choose an option; left and right stay free for moving between questions.
    return ['Space', 'ArrowUp', 'ArrowDown'].includes(key) || (key === 'Enter' && target.type === 'submit');
  }
  if (key === 'Enter' || key === 'Space') return target.closest('button, a, summary') !== null;
  // Code that is wider than its box scrolls with the arrows.
  return key.startsWith('Arrow') && target.closest('pre, .scroll') !== null;
}

/** Keyboard shortcuts. Components add theirs with `registerShortcuts`; the newest group is asked first. */
@Injectable({ providedIn: 'root' })
export class Shortcuts {
  private readonly document = inject(DOCUMENT);
  private readonly list = signal<ShortcutGroup[]>([]);
  private readonly on = signal(this.readEnabled());
  private pointer: Element | null = null;
  private prefix = '';
  private prefixAt = 0;

  readonly enabled = this.on.asReadonly();
  readonly helpOpen = signal(false);
  /** Groups for the list of shortcuts: the page first, then what works everywhere. */
  readonly groups = computed(() =>
    [...this.list()].reverse().map((g) => ({ title: g.title(), items: g.items() })).filter((g) => g.items.length),
  );

  add(group: ShortcutGroup): () => void {
    this.list.update((l) => [...l, group]);
    return () => this.list.update((l) => l.filter((x) => x !== group));
  }

  setEnabled(on: boolean): void {
    this.on.set(on);
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
    } catch {
      // Storage unavailable: the choice lasts for this visit only.
    }
  }

  handle(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
    if (this.document.querySelector('dialog[open]')) return;
    const key = keyName(event);
    // Single-key shortcuts can be switched off for people who use speech input or other tools.
    if (!this.on() && key !== 'Escape') return;
    const focused = event.target instanceof HTMLElement ? event.target : null;
    const clicked = this.releases(focused, key);
    if (key === 'Escape' && focused instanceof HTMLInputElement) focused.blur();
    else if (!clicked && needsKey(focused, key)) return;
    if (event.repeat && !key.startsWith('Arrow')) return;

    const now = Date.now();
    const sequence = this.prefix && now - this.prefixAt < SEQUENCE_MS ? `${this.prefix} ${key}` : '';
    this.prefix = '';
    const hit = (sequence && this.find(sequence)) || this.find(key);
    if (hit) {
      event.preventDefault();
      if (clicked) focused?.blur();
      hit.run();
    } else if (!sequence && this.startsSequence(key)) {
      this.prefix = key;
      this.prefixAt = now;
    }
  }

  /** Remembers what was clicked: it keeps the focus, but Space and Enter aren't meant for it. */
  pointerDown(event: Event): void {
    this.pointer = event.target instanceof Element ? event.target.closest('button, a, summary, label, input, select') : null;
  }

  /** A list that was changed with the mouse gives the arrow keys back to the page. */
  changed(event: Event): void {
    if (event.target instanceof HTMLSelectElement && event.target === this.pointer) event.target.blur();
  }

  private releases(focused: HTMLElement | null, key: string): boolean {
    if (key === 'Tab') this.pointer = null;
    if (!focused || !this.pointer || (key !== 'Space' && key !== 'Enter')) return false;
    if (focused instanceof HTMLInputElement && TEXT_INPUTS.test(focused.type)) return false;
    return focused === this.pointer || (this.pointer.tagName === 'LABEL' && this.pointer.contains(focused));
  }

  private find(keys: string): Shortcut | undefined {
    for (const group of [...this.list()].reverse()) {
      const hit = group.items().find((s) => s.keys.includes(keys) && (s.when?.() ?? true));
      if (hit) return hit;
    }
    return undefined;
  }

  private startsSequence(key: string): boolean {
    return this.list().some((g) => g.items().some((s) => s.keys.some((k) => k.startsWith(`${key} `))));
  }

  private readEnabled(): boolean {
    try {
      return typeof localStorage === 'undefined' || localStorage.getItem(STORAGE_KEY) !== 'off';
    } catch {
      return true;
    }
  }
}

/** Adds shortcuts for as long as the component lives. Call it in a constructor or field. */
export function registerShortcuts(title: () => string, items: () => Shortcut[]): void {
  const remove = inject(Shortcuts).add({ title, items });
  inject(DestroyRef).onDestroy(remove);
}
