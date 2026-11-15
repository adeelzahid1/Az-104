import { Routes } from '@angular/router';

const setup = () => import('./features/setup/setup').then((m) => m.Setup);

export const routes: Routes = [
  {
    path: '',
    title: 'AZ-104 Prep',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  { path: 'practice', title: 'Practice · AZ-104 Prep', loadComponent: setup, data: { mode: 'practice' } },
  { path: 'mock', title: 'Mock exam · AZ-104 Prep', loadComponent: setup, data: { mode: 'exam' } },
  {
    path: 'quiz',
    title: 'Quiz · AZ-104 Prep',
    loadComponent: () => import('./features/quiz/quiz').then((m) => m.Quiz),
  },
  {
    path: 'results',
    title: 'Results · AZ-104 Prep',
    loadComponent: () => import('./features/results/results').then((m) => m.Results),
  },
  {
    path: 'weak-areas',
    title: 'Weak areas · AZ-104 Prep',
    loadComponent: () => import('./features/weak-areas/weak-areas').then((m) => m.WeakAreas),
  },
  { path: '**', redirectTo: '' },
];
