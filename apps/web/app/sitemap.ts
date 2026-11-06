// sitemap.xml: every public page in Urdu and English (not the admin page, never invite links).
import type { MetadataRoute } from 'next';
import { SITE } from './_lib/site';

const PAGES = ['', '/drivers', '/safety', '/download', '/privacy', '/terms', '/delete-account'];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap((p) => [
    { url: `${SITE}${p || '/'}`, alternates: { languages: { ur: `${SITE}${p || '/'}`, en: `${SITE}/en${p}` } }, changeFrequency: 'monthly' as const, priority: p ? 0.6 : 1 },
    { url: `${SITE}/en${p}`, changeFrequency: 'monthly' as const, priority: p ? 0.5 : 0.9 },
  ]);
}
