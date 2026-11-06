import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { TermsPage } from '../Pages';

export const metadata: Metadata = { title: `${t('ur', 'site.terms.title')} · ${t('ur', 'app.parent.name')}`, description: t('ur', 'site.terms.1.b'), alternates: { canonical: '/terms', languages: { ur: '/terms', en: '/en/terms' } } };

export default function Page() {
  return <TermsPage lang="ur" />;
}
