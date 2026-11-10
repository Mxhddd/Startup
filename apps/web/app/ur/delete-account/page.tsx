// /ur/delete-account: generated from the v16 page list (English at the root, Urdu under /ur).
import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { DeletePage16 } from '../../_v16/Pages16';
import { pageMeta } from '../../_lib/meta';

const L = 'ur' as const;
export const metadata: Metadata = pageMeta(L, '/delete-account', `${t(L, 'site.del.title')} · Pohnch`, t(L, 'site.del.lead'));

export default function Page() {
  return <DeletePage16 lang={L} />;
}
