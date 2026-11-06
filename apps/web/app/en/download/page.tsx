import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { DownloadPage } from '../../Pages';

export const metadata: Metadata = { title: `${t('en', 'site.dl.kicker')} · ${t('en', 'app.parent.name')}`, description: t('en', 'site.dl.lead'), alternates: { canonical: '/en/download', languages: { ur: '/download', en: '/en/download' } } };

export default function Page() {
  return <DownloadPage lang="en" />;
}
