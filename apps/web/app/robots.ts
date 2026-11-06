// robots.txt: everything public may be indexed; the admin page and invite links may not.
import type { MetadataRoute } from 'next';
import { SITE } from './_lib/site';

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/i/', '/invite', '/api/'] }], sitemap: `${SITE}/sitemap.xml` };
}
