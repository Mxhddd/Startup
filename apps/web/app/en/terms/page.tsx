import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { TermsPage } from '../../Pages';

export const metadata: Metadata = { title: `${t('en', 'site.terms.title')} · ${t('en', 'app.parent.name')}`, description: t('en', 'site.terms.1.b'), alternates: { canonical: '/en/terms', languages: { ur: '/terms', en: '/en/terms' } } };

export default function Page() {
  return <TermsPage lang="en" />;
}
