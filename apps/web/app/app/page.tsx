// /app: the poster's QR code lands here (v21). Parent or driver, then three taps to install.
import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { AppPage16 } from '../_v16/Pages16';
import { pageMeta } from '../_lib/meta';

const L = 'en' as const;
export const metadata: Metadata = pageMeta(L, '/app', `${t(L, 'web.getapp.meta')} · Pohnch`, t(L, 'web.getapp.lead'));

export default function Page() {
  return <AppPage16 lang={L} />;
}
