// Page metadata (title, description, language alternates, share picture) for both languages.
import type { Metadata } from 'next';
import type { Lang } from '@pohnch/messages';
import { href } from './links';

export function pageMeta(lang: Lang, path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: href(lang, path), languages: { en: href('en', path), ur: href('ur', path), 'x-default': href('en', path) } },
    openGraph: { title, description, locale: lang === 'ur' ? 'ur_PK' : 'en_PK', images: [{ url: '/v16/og.jpg', width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', images: ['/v16/og.jpg'] },
  };
}
