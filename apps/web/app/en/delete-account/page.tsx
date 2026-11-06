import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { DeletePage } from '../../Pages';

export const metadata: Metadata = { title: `${t('en', 'site.del.title')} · ${t('en', 'app.parent.name')}`, description: t('en', 'site.del.lead'), alternates: { canonical: '/en/delete-account', languages: { ur: '/delete-account', en: '/en/delete-account' } } };

export default function Page() {
  return <DeletePage lang="en" />;
}
