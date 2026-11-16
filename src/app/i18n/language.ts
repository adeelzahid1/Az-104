import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { EN, Lang, ROMAN, UiText } from './ui-text';

const STORAGE_KEY = 'az104-lang';

function readSaved(): Lang {
  try {
    if (typeof localStorage === 'undefined') return 'en';
    return localStorage.getItem(STORAGE_KEY) === 'roman' ? 'roman' : 'en';
  } catch {
    return 'en';
  }
}

/** The chosen display language (English or Roman Urdu), remembered in this browser. */
@Injectable({ providedIn: 'root' })
export class Language {
  private readonly current = signal<Lang>(readSaved());

  readonly lang = this.current.asReadonly();
  readonly isRoman = computed(() => this.current() === 'roman');
  /** Interface text for the current language. */
  readonly t = computed<UiText>(() => (this.current() === 'roman' ? ROMAN : EN));

  constructor() {
    const doc = inject(DOCUMENT);
    // Roman Urdu is Urdu written in Latin script.
    effect(() => doc.documentElement.setAttribute('lang', this.isRoman() ? 'ur-Latn' : 'en'));
  }

  set(lang: Lang): void {
    this.current.set(lang);
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Storage unavailable: the choice lasts for this visit only.
    }
  }
}
