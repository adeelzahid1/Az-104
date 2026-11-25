import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withNavigationErrorHandler, withPreloading } from '@angular/router';

import { routes } from './app.routes';
import { PreloadPages } from './core/preload';
import { reloadOnStalePage } from './core/stale-page';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding(), withNavigationErrorHandler(reloadOnStalePage), withPreloading(PreloadPages)),
    provideClientHydration(withEventReplay()),
    // Keeps the site in the browser: it opens at once and works offline.
    provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), registrationStrategy: 'registerWhenStable:10000' }),
  ]
};
