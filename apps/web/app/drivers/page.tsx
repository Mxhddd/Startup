import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { DriversPage } from '../Pages';

export const metadata: Metadata = { title: `${t('ur', 'site.drv.title')} · ${t('ur', 'app.parent.name')}`, description: t('ur', 'site.drv.lead'), alternates: { canonical: '/drivers', languages: { ur: '/drivers', en: '/en/drivers' } } };

export default function Page() {
  return <DriversPage lang="ur" />;
}
