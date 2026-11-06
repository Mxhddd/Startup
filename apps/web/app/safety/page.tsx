import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { SafetyPage } from '../Pages';

export const metadata: Metadata = { title: `${t('ur', 'site.safety.title')} · ${t('ur', 'app.parent.name')}`, description: t('ur', 'site.safety.lead'), alternates: { canonical: '/safety', languages: { ur: '/safety', en: '/en/safety' } } };

export default function Page() {
  return <SafetyPage lang="ur" />;
}
