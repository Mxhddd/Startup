import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { Landing } from '../Landing';

export const metadata: Metadata = { title: t('en', 'web.title'), description: t('en', 'web.lead') };

export default function HomeEnglish() {
  return <Landing lang="en" />;
}
