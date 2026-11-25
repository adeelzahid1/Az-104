import { NavigationError } from '@angular/router';

const KEY = 'az104-reloaded-at';
const WAIT_MS = 30_000;
const LOAD_FAILURE = /dynamically imported module|importing a module script|module script failed|failed to fetch/i;

/**
 * A page's code can't be downloaded, usually because a new version of the site replaced it while
 * this tab was open. Loads the target page fresh, at most once every 30 seconds.
 */
export function reloadOnStalePage(e: NavigationError): void {
  if (typeof window === 'undefined' || !LOAD_FAILURE.test(String(e.error))) return;
  try {
    if (Date.now() - Number(sessionStorage.getItem(KEY)) < WAIT_MS) return;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // Without storage a reload loop can't be ruled out.
    return;
  }
  window.location.assign(e.url);
}
