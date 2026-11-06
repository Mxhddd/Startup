import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { DownloadPage } from '../Pages';

export const metadata: Metadata = { title: `${t('ur', 'site.dl.kicker')} · ${t('ur', 'app.parent.name')}`, description: t('ur', 'site.dl.lead'), alternates: { canonical: '/download', languages: { ur: '/download', en: '/en/download' } } };

export default function Page() {
  return <DownloadPage lang="ur" />;
}
