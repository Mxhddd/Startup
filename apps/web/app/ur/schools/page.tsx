// /ur/schools: v18 page (English at the root, Urdu under /ur).
import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { SchoolsPage16 } from '../../_v16/Pages16';
import { pageMeta } from '../../_lib/meta';

const L = 'ur' as const;
export const metadata: Metadata = pageMeta(L, '/schools', `${t(L, 'web.sch.h')} · Pohnch`, t(L, 'web.sch.lead'));

export default function Page() {
  return <SchoolsPage16 lang={L} />;
}
