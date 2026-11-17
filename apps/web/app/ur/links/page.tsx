// /links: the standee's QR code lands here (v22). Six links on a truck-art page.
import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { LinksPage } from '../../_v16/Links';
import { pageMeta } from '../../_lib/meta';

const L = 'ur' as const;
export const metadata: Metadata = pageMeta(L, '/links', `${t(L, 'web.links.meta')} · Pohnch`, t(L, 'web.links.lead'));

export default function Page() {
  return <LinksPage lang={L} />;
}
