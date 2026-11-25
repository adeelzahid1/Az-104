import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Language } from './i18n/language';
import { Lang } from './i18n/ui-text';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly language = inject(Language);

  protected readonly t = this.language.t;
  protected readonly lang = this.language.lang;
  protected readonly links = [
    { path: '/', key: 'dashboard', exact: true },
    { path: '/plan', key: 'plan', exact: false },
    { path: '/study', key: 'study', exact: false },
    { path: '/labs', key: 'labs', exact: false },
    { path: '/cheat-sheet', key: 'cheat', exact: false },
    { path: '/practice', key: 'practice', exact: false },
    { path: '/mock', key: 'mock', exact: false },
    { path: '/weak-areas', key: 'weak', exact: false },
  ] as const;

  protected setLang(lang: Lang): void {
    this.language.set(lang);
  }
}
