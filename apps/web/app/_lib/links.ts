// Where each page lives in either language (Urdu at the root, English under /en).
import type { Lang } from '@pohnch/messages';

export function href(lang: Lang, path: string): string {
  if (lang === 'ur') return path;
  if (path === '/') return '/en';
  if (path.startsWith('/#')) return `/en${path.slice(1)}`;
  return `/en${path}`;
}
