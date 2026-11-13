import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { t } from '@pohnch/messages';
import { colors } from '@pohnch/ui/theme';
import { displayFont, latinFont, urduFont } from './fonts';
import './globals.css';
import { SITE } from './_lib/site';
import { SafeAnalytics } from './_lib/SafeAnalytics';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: t('en', 'web.title'),
  description: t('en', 'web.hero.p'),
  icons: { icon: '/icon.svg' },
  // Google Search Console: proves pohnch.pk is ours (needed for the Google sign-in consent screen). Public.
  verification: { google: 'PGBMUkJ60VjUDshpOcKM2prkhTyIGHPLWzQMTlLAziM' },
  alternates: { canonical: '/', languages: { en: '/', ur: '/ur' } },
  openGraph: { type: 'website', siteName: 'Pohnch', locale: 'en_PK', alternateLocale: ['ur_PK'], images: [{ url: '/v18/og.jpg', width: 1200, height: 630 }] },
};

export const viewport: Viewport = { themeColor: '#FAF6EE' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${urduFont.variable} ${latinFont.variable} ${displayFont.variable}`}>
      <body style={{ margin: 0, background: colors.ghee, ['--focus' as string]: colors.kesar }}>{children}<SafeAnalytics /></body>
    </html>
  );
}
