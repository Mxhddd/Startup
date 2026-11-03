import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { t } from '@pohnch/messages';
import { colors } from '@pohnch/ui/theme';
import { displayFont, latinFont, urduFont } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: t('ur', 'web.title'),
  description: t('ur', 'web.lead'),
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ur" className={`${urduFont.variable} ${latinFont.variable} ${displayFont.variable}`}>
      <body style={{ margin: 0, background: colors.ghee, ['--focus' as string]: colors.kesar }}>{children}</body>
    </html>
  );
}
