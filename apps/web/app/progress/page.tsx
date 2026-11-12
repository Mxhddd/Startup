// /progress: v18 page (English at the root, Urdu under /ur).
import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { ProgressPage16 } from '../_v16/Pages16';
import { pageMeta } from '../_lib/meta';

const L = 'en' as const;
export const metadata: Metadata = pageMeta(L, '/progress', `${t(L, 'web.prog.h')} · Pohnch`, t(L, 'web.prog.lead'));

export default function Page() {
  return <ProgressPage16 lang={L} />;
}
