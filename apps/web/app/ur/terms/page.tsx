// /ur/terms: generated from the v16 page list (English at the root, Urdu under /ur).
import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { TermsPage16 } from '../../_v16/Pages16';
import { pageMeta } from '../../_lib/meta';

const L = 'ur' as const;
export const metadata: Metadata = pageMeta(L, '/terms', `${t(L, 'site.terms.title')} · Pohnch`, t(L, 'site.terms.updated'));

export default function Page() {
  return <TermsPage16 lang={L} />;
}
