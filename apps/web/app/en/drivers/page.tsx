import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { DriversPage } from '../../Pages';

export const metadata: Metadata = { title: `${t('en', 'site.drv.title')} · ${t('en', 'app.parent.name')}`, description: t('en', 'site.drv.lead'), alternates: { canonical: '/en/drivers', languages: { ur: '/drivers', en: '/en/drivers' } } };

export default function Page() {
  return <DriversPage lang="en" />;
}
