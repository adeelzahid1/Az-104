import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withNavigationErrorHandler, withPreloading } from '@angular/router';

import { routes } from './app.routes';
import { PreloadPages } from './core/preload';
import { reloadOnStalePage } from './core/stale-page';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding(), withNavigationErrorHandler(reloadOnStalePage), withPreloading(PreloadPages)),
    provideClientHydration(withEventReplay())
  ]
};
