// The page behind every pohnch.pk/i/<token> link. next.config.ts sends all of them here, so it is one
// static page: the server never reads or stores the token. The browser reads it from the address bar
// only to build the "open in the app" links. If the app is installed, the phone opens it directly and
// this page isn't seen at all.
import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { colors } from '@pohnch/ui/theme';
import { InviteButtons } from './InviteButtons';

export const metadata: Metadata = {
  title: `${t('ur', 'web.invite.title')} · Pohnch`,
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function Invite() {
  return (
    <main style={{ minHeight: '100vh', background: colors.ghee, color: colors.siyahi, fontFamily: 'var(--font-urdu), var(--font-latin), sans-serif' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 16px 48px', display: 'grid', gap: 24 }}>
        <img src="/pohnch-lockup.svg" alt="Pohnch" width={220} height={63} style={{ height: 'auto', justifySelf: 'center' }} />
        <section lang="ur" dir="rtl" style={{ display: 'grid', gap: 8, lineHeight: 1.8 }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>{t('ur', 'web.invite.title')}</h1>
          <p style={{ margin: 0, fontSize: 18, color: colors.ink2 }}>{t('ur', 'web.invite.body')}</p>
        </section>
        <section lang="en" dir="ltr" style={{ display: 'grid', gap: 6, lineHeight: 1.5, fontFamily: 'var(--font-latin), sans-serif' }}>
          <h2 style={{ fontSize: 22, margin: 0 }}>{t('en', 'web.invite.title')}</h2>
          <p style={{ margin: 0, fontSize: 17, color: colors.ink2 }}>{t('en', 'web.invite.body')}</p>
        </section>
        <InviteButtons />
      </div>
    </main>
  );
}
