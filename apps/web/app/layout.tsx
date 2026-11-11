import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { t } from '@pohnch/messages';
import { colors } from '@pohnch/ui/theme';
import { displayFont, handFont, latinFont, urduFont } from './fonts';
import './globals.css';
import { SITE } from './_lib/site';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: t('en', 'web.title'),
  description: t('en', 'web.hero.p'),
  icons: { icon: '/icon.svg' },
  alternates: { canonical: '/', languages: { en: '/', ur: '/ur' } },
  openGraph: { type: 'website', siteName: 'Pohnch', locale: 'en_PK', alternateLocale: ['ur_PK'], images: [{ url: '/v16/og.jpg', width: 1200, height: 630 }] },
};

export const viewport: Viewport = { themeColor: '#FAF6EE' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${urduFont.variable} ${latinFont.variable} ${displayFont.variable} ${handFont.variable}`}>
      <body style={{ margin: 0, background: colors.ghee, ['--focus' as string]: colors.kesar }}>{children}<Analytics /></body>
    </html>
  );
}
