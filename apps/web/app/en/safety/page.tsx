import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { SafetyPage } from '../../Pages';

export const metadata: Metadata = { title: `${t('en', 'site.safety.title')} · ${t('en', 'app.parent.name')}`, description: t('en', 'site.safety.lead'), alternates: { canonical: '/en/safety', languages: { ur: '/safety', en: '/en/safety' } } };

export default function Page() {
  return <SafetyPage lang="en" />;
}
