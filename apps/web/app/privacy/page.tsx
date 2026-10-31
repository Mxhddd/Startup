import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { Privacy } from '../Privacy';

export const metadata: Metadata = { title: `${t('ur', 'privacy.title')} · ${t('ur', 'app.parent.name')}` };

export default function PrivacyUrdu() {
  return <Privacy lang="ur" />;
}
