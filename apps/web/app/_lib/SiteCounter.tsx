'use client';
// v22 Growth panel: tells the `interest` function "someone opened this page" on every page, and "a new visitor
// today" once a day per browser. The browser remembers only today's date (under pohnch.seen) to know it has
// already been counted; no id, no cookie. The team page and the invite page are never counted.
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { countHit } from './interest';

export const SEEN_KEY = 'pohnch.seen';
/** Karachi's date today, as YYYY-MM-DD. */
export const karachiDay = (now = new Date()) => new Date(now.getTime() + 5 * 3600_000).toISOString().slice(0, 10);
/** Only real visitors on the live site count: the pohnch.pk hostnames, and never a browser driven by a
 *  test robot (Playwright and other automation set navigator.webdriver). Local builds, previews and our
 *  own test runs were once counted as visitors, which made the Growth panel far higher than Vercel's. */
export const LIVE_HOSTS = ['pohnch.pk', 'www.pohnch.pk'];
export const shouldCount = (host: string, webdriver: boolean | undefined) => LIVE_HOSTS.includes(host) && !webdriver;

/** Pages we never count. */
export const uncounted = (path: string) => /^\/(admin|invite)(\/|$)/.test(path);

/** True the first time it's asked on a given Karachi day in this browser (and remembers that). */
export function firstVisitToday(store: Pick<Storage, 'getItem' | 'setItem'> | null, day: string): boolean {
  try {
    if (!store || store.getItem(SEEN_KEY) === day) return false;
    store.setItem(SEEN_KEY, day);
    return true;
  } catch {
    return false;
  }
}

export function SiteCounter() {
  const path = usePathname() ?? '/';
  useEffect(() => {
    if (uncounted(path) || !shouldCount(window.location.hostname, navigator.webdriver)) return;
    countHit('view', path);
    let store: Storage | null = null;
    try { store = window.localStorage; } catch { store = null; }
    if (firstVisitToday(store, karachiDay())) countHit('visitor', path);
  }, [path]);
  return null;
}
