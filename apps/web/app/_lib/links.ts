// Where each page lives in either language (v16: English at the root, Urdu under /ur).
import type { Lang } from '@pohnch/messages';

export function href(lang: Lang, path: string): string {
  if (lang === 'en') return path;
  if (path === '/') return '/ur';
  if (path.startsWith('/#')) return `/ur${path.slice(1)}`;
  return `/ur${path}`;
}

/** The same page in the other language. */
export function otherHref(lang: Lang, path: string): string {
  return href(lang === 'ur' ? 'en' : 'ur', path);
}
