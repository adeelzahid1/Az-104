import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

type Theme = 'auto' | 'light' | 'dark';

const THEME_KEY = 'az104-theme';

function readTheme(): Theme {
  try {
    const saved = typeof localStorage === 'undefined' ? null : localStorage.getItem(THEME_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'auto';
  } catch {
    return 'auto';
  }
}

/** Full screen (without menus) and light or dark colours. */
@Injectable({ providedIn: 'root' })
export class Display {
  private readonly document = inject(DOCUMENT);
  private readonly full = signal(false);
  private readonly theme = signal<Theme>(readTheme());

  readonly fullScreen = this.full.asReadonly();

  constructor() {
    const root = this.document.documentElement;
    effect(() => root.classList.toggle('full-screen', this.full()));
    effect(() => {
      const theme = this.theme();
      if (theme === 'auto') root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', theme);
    });
    // Leaving with Esc or F11 also brings the menus back.
    this.document.addEventListener('fullscreenchange', () => {
      if (!this.document.fullscreenElement) this.full.set(false);
    });
  }

  toggleFullScreen(): void {
    if (this.full()) this.exitFullScreen();
    else {
      this.full.set(true);
      // iPhones can't make a page full screen: the menus are hidden all the same.
      this.document.documentElement.requestFullscreen?.().catch(() => undefined);
    }
  }

  exitFullScreen(): void {
    this.full.set(false);
    if (this.document.fullscreenElement) this.document.exitFullscreen().catch(() => undefined);
  }

  toggleTheme(): void {
    const system = this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = this.theme() === 'auto' ? system : this.theme() === 'dark';
    const next: Theme = dark ? 'light' : 'dark';
    this.theme.set(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage unavailable: the choice lasts for this visit only.
    }
  }
}
