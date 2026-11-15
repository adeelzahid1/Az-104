import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly links = [
    { path: '/', label: 'Dashboard', exact: true },
    { path: '/practice', label: 'Practice', exact: false },
    { path: '/mock', label: 'Mock exam', exact: false },
    { path: '/weak-areas', label: 'Weak areas', exact: false },
  ];
}
