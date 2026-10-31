import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { Privacy } from '../../Privacy';

export const metadata: Metadata = { title: `${t('en', 'privacy.title')} · Pohnch` };

export default function PrivacyEnglish() {
  return <Privacy lang="en" />;
}
