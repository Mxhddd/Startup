import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { t } from '@pohnch/messages';
import { latinFont, urduFont } from './fonts';

export const metadata: Metadata = {
  title: t('ur', 'web.title'),
  description: t('ur', 'web.lead'),
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ur" className={`${urduFont.variable} ${latinFont.variable}`}>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
