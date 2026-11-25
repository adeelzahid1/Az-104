import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { EMPTY, Observable, catchError, mergeMap, timer } from 'rxjs';

/** Time the page on screen gets for its own downloads first. */
const WAIT_MS = 1500;

/** False for people who asked their browser to save data. */
export function mayPreload(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !connection?.saveData;
}

/** Downloads the code of the other pages in the background, so that they open at once. */
@Injectable({ providedIn: 'root' })
export class PreloadPages implements PreloadingStrategy {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  preload(_route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (!this.browser || !mayPreload()) return EMPTY;
    // A failure doesn't matter here: opening the page tries again.
    return timer(WAIT_MS).pipe(mergeMap(() => load().pipe(catchError(() => EMPTY))));
  }
}
