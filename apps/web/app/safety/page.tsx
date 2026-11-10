// /safety: generated from the v16 page list (English at the root, Urdu under /ur).
import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { SafetyPage16 } from '../_v16/Pages16';
import { pageMeta } from '../_lib/meta';

const L = 'en' as const;
export const metadata: Metadata = pageMeta(L, '/safety', `${t(L, 'site.safety.title')} · Pohnch`, t(L, 'site.safety.lead'));

export default function Page() {
  return <SafetyPage16 lang={L} />;
}
