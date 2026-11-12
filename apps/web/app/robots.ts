// robots.txt: everything public may be indexed. The team page isn't listed here (that would point it out);
// it and the invite links send noindex headers, so search engines leave them out anyway.
import type { MetadataRoute } from 'next';
import { SITE } from './_lib/site';

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/i/', '/invite', '/api/'] }], sitemap: `${SITE}/sitemap.xml` };
}
