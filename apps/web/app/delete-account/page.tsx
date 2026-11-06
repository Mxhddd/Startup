import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { DeletePage } from '../Pages';

export const metadata: Metadata = { title: `${t('ur', 'site.del.title')} · ${t('ur', 'app.parent.name')}`, description: t('ur', 'site.del.lead'), alternates: { canonical: '/delete-account', languages: { ur: '/delete-account', en: '/en/delete-account' } } };

export default function Page() {
  return <DeletePage lang="ur" />;
}
