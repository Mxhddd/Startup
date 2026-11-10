// /: generated from the v16 page list (English at the root, Urdu under /ur).
import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { Home } from './_v16/Home';
import { href, otherHref } from './_lib/links';
import { pageMeta } from './_lib/meta';

const L = 'en' as const;
export const metadata: Metadata = pageMeta(L, '/', t(L, 'web.title'), t(L, 'web.hero.p'));

export default function Page() {
  return <Home lang={L} homeHref={href(L, '/')} otherHref={otherHref(L, '/')} />;
}
