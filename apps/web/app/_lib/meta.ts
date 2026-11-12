// Page metadata (title, description, language alternates, share picture) for both languages.
import type { Metadata } from 'next';
import type { Lang } from '@pohnch/messages';
import { href } from './links';

/** Each page's share picture (its own scene of the 3D city with its title); the home picture for the rest. */
const OG: Record<string, string> = { '/drivers': 'og-drivers', '/safety': 'og-safety', '/story': 'og-story', '/progress': 'og-progress', '/schools': 'og-schools', '/download': 'og-download', '/privacy': 'og-privacy' };
export const ogFor = (path: string): string => `/v18/${OG[path] ?? 'og'}.jpg`;

export function pageMeta(lang: Lang, path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: href(lang, path), languages: { en: href('en', path), ur: href('ur', path), 'x-default': href('en', path) } },
    openGraph: { title, description, locale: lang === 'ur' ? 'ur_PK' : 'en_PK', images: [{ url: ogFor(path), width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', images: [ogFor(path)] },
  };
}
