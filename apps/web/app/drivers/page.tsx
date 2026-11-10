// /drivers: generated from the v16 page list (English at the root, Urdu under /ur).
import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { DriversPage16 } from '../_v16/Pages16';
import { pageMeta } from '../_lib/meta';

const L = 'en' as const;
export const metadata: Metadata = pageMeta(L, '/drivers', `${t(L, 'site.drv.title')} · Pohnch`, t(L, 'site.drv.lead'));

export default function Page() {
  return <DriversPage16 lang={L} />;
}
