import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Display } from './core/display';
import { Shortcuts, registerShortcuts } from './core/shortcuts';
import { Language } from './i18n/language';
import { Lang } from './i18n/ui-text';
import { FullScreenButton } from './shared/full-screen-button';
import { ShortcutHelp } from './shared/shortcut-help';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FullScreenButton, ShortcutHelp],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: {
    '(document:keydown)': 'shortcuts.handle($event)',
    '(document:pointerdown)': 'shortcuts.pointerDown($event)',
    '(document:change)': 'shortcuts.changed($event)',
    '(window:scroll)': 'onScroll()',
  },
})
export class App {
  private readonly language = inject(Language);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  protected readonly shortcuts = inject(Shortcuts);
  protected readonly display = inject(Display);

  protected readonly t = this.language.t;
  protected readonly lang = this.language.lang;
  protected readonly links = [
    { path: '/', key: 'dashboard', exact: true, keys: 'g d' },
    { path: '/plan', key: 'plan', exact: false, keys: 'g p' },
    { path: '/notes', key: 'notes', exact: false, keys: 'g n' },
    { path: '/study', key: 'study', exact: false, keys: 'g s' },
    { path: '/labs', key: 'labs', exact: false, keys: 'g l' },
    { path: '/cheat-sheet', key: 'cheat', exact: false, keys: 'g c' },
    { path: '/practice', key: 'practice', exact: false, keys: 'g r' },
    { path: '/mock', key: 'mock', exact: false, keys: 'g m' },
    { path: '/weak-areas', key: 'weak', exact: false, keys: 'g w' },
  ] as const;

  /** Far enough down a long page to offer the way back to the top. */
  protected readonly scrolled = signal(false);

  private readonly menu = viewChild<ElementRef<HTMLElement>>('menu');

  constructor() {
    // On a phone the menu scrolls sideways: keep the current page in sight.
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) this.document.defaultView?.setTimeout(() => this.showActiveLink());
    });
    registerShortcuts(
      () => this.t().keys.goTo,
      () => this.links.map((l) => ({ keys: [l.keys], label: this.t().nav[l.key], run: () => this.router.navigateByUrl(l.path) })),
    );
    registerShortcuts(
      () => this.t().keys.everywhere,
      () => {
        const tk = this.t().keys;
        return [
          { keys: ['?'], label: tk.title, run: () => this.shortcuts.helpOpen.set(true) },
          { keys: ['f'], label: tk.full, run: () => this.display.toggleFullScreen() },
          {
            keys: ['Escape'],
            label: tk.exitFull,
            run: () => this.display.exitFullScreen(),
            when: () => this.display.fullScreen(),
          },
          { keys: ['/'], label: tk.search, run: () => this.searchBox()?.focus(), when: () => !!this.searchBox() },
          { keys: ['i'], label: tk.theme, run: () => this.display.toggleTheme() },
          { keys: ['l'], label: tk.language, run: () => this.setLang(this.lang() === 'en' ? 'roman' : 'en') },
          { keys: ['t'], label: tk.top, run: () => this.toTop() },
        ];
      },
    );
  }

  private showActiveLink(): void {
    const nav = this.menu()?.nativeElement;
    const link = nav?.querySelector<HTMLElement>('.active');
    if (nav && link) nav.scrollLeft = link.offsetLeft - nav.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2;
  }

  private searchBox(): HTMLInputElement | null {
    return this.document.querySelector<HTMLInputElement>('main input[type=search]');
  }

  protected onScroll(): void {
    this.scrolled.set((this.document.defaultView?.scrollY ?? 0) > 900);
  }

  protected toTop(): void {
    this.document.defaultView?.scrollTo({ top: 0 });
  }

  protected setLang(lang: Lang): void {
    this.language.set(lang);
  }
}
