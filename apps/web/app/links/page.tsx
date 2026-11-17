// /links: the standee's QR code lands here (v22). Every Pohnch link in one list.
import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { LinksPage16 } from '../_v16/Pages16';
import { pageMeta } from '../_lib/meta';

const L = 'en' as const;
export const metadata: Metadata = pageMeta(L, '/links', `${t(L, 'web.links.meta')} · Pohnch`, t(L, 'web.links.lead'));

export default function Page() {
  return <LinksPage16 lang={L} />;
}
