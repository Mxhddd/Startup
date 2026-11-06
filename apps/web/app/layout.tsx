import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { t } from '@pohnch/messages';
import { colors } from '@pohnch/ui/theme';
import { displayFont, handFont, latinFont, urduFont } from './fonts';
import './globals.css';
import './site.css';
import { SITE } from './_lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: t('ur', 'web.title'),
  description: t('ur', 'site.hero.lead'),
  icons: { icon: '/icon.svg' },
  alternates: { canonical: '/', languages: { ur: '/', en: '/en' } },
  openGraph: { type: 'website', siteName: 'Pohnch', locale: 'ur_PK', alternateLocale: ['en_PK'] },
};

export const viewport: Viewport = { themeColor: '#FAF6EE' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ur" className={`${urduFont.variable} ${latinFont.variable} ${displayFont.variable} ${handFont.variable}`}>
      <body style={{ margin: 0, background: colors.ghee, ['--focus' as string]: colors.kesar }}>{children}</body>
    </html>
  );
}
