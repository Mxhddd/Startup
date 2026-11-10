// /ur/privacy: generated from the v16 page list (English at the root, Urdu under /ur).
import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { PrivacyPage16 } from '../../_v16/Pages16';
import { pageMeta } from '../../_lib/meta';

const L = 'ur' as const;
export const metadata: Metadata = pageMeta(L, '/privacy', `${t(L, 'privacy.title')} · Pohnch`, t(L, 'privacy.intro'));

export default function Page() {
  return <PrivacyPage16 lang={L} />;
}
