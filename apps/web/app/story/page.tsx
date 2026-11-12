// /story: v18 page (English at the root, Urdu under /ur).
import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { StoryPage16 } from '../_v16/Pages16';
import { pageMeta } from '../_lib/meta';

const L = 'en' as const;
export const metadata: Metadata = pageMeta(L, '/story', `${t(L, 'web.st.h')} · Pohnch`, t(L, 'web.st.lead'));

export default function Page() {
  return <StoryPage16 lang={L} />;
}
