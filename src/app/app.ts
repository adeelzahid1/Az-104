import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { Busy } from './core/busy';
import { Display } from './core/display';
import { Guide } from './core/guide';
import { Shortcuts, registerShortcuts } from './core/shortcuts';
import { Language } from './i18n/language';
import { Lang } from './i18n/ui-text';
import { FullScreenButton } from './shared/full-screen-button';
import { GuideDialog } from './shared/guide-dialog';
import { ShortcutHelp } from './shared/shortcut-help';
import { UpdateBanner } from './shared/update-banner';

const pathOf = (url: string): string => url.split(/[?#]/)[0];

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FullScreenButton, GuideDialog, ShortcutHelp, UpdateBanner],
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
  protected readonly guide = inject(Guide);

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

  private readonly busy = inject(Busy);
  /** Path of the page that is being opened, or null. */
  protected readonly opening = signal<string | null>(null);
  protected readonly loading = computed(() => this.opening() !== null || this.busy.active());

  /** Far enough down a long page to offer the way back to the top. */
  protected readonly scrolled = signal(false);

  private readonly menu = viewChild<ElementRef<HTMLElement>>('menu');

  constructor() {
    let back = false;
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        back = event.navigationTrigger === 'popstate';
        // Filters and sections change only the query: the page itself stays.
        const path = pathOf(event.url);
        if (path !== pathOf(this.router.url) || !this.router.navigated) this.opening.set(path);
      } else if (event instanceof NavigationEnd) {
        // A new page starts at its top, unless the browser brings back an earlier position.
        if (this.opening() !== null && !back) this.toTop();
        this.opening.set(null);
        // On a phone the menu scrolls sideways: keep the current page in sight.
        this.document.defaultView?.setTimeout(() => this.showActiveLink());
      } else if (event instanceof NavigationCancel || event instanceof NavigationError) {
        this.opening.set(null);
      }
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
          { keys: ['h'], label: this.t().guide.title, run: () => this.openGuide() },
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

  protected openGuide(): void {
    this.guide.open(this.router.url);
  }

  protected onScroll(): void {
    this.scrolled.set((this.document.defaultView?.scrollY ?? 0) > 900);
  }

  protected toTop(): void {
    this.document.defaultView?.scrollTo?.({ top: 0 });
  }

  protected setLang(lang: Lang): void {
    this.language.set(lang);
  }
}
