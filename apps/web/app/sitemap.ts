// sitemap.xml: every public page in English (root) and Urdu (/ur) (not the admin page, never invite links).
import type { MetadataRoute } from 'next';
import { SITE } from './_lib/site';
import { href } from './_lib/links';

const PAGES = ['/', '/app', '/drivers', '/safety', '/story', '/progress', '/schools', '/download', '/privacy', '/terms', '/delete-account'];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap((p) => {
    const languages = { en: `${SITE}${href('en', p)}`, ur: `${SITE}${href('ur', p)}` };
    return [
      { url: languages.en, alternates: { languages }, changeFrequency: 'monthly' as const, priority: p === '/' ? 1 : 0.6 },
      { url: languages.ur, alternates: { languages }, changeFrequency: 'monthly' as const, priority: p === '/' ? 0.9 : 0.5 },
    ];
  });
}
