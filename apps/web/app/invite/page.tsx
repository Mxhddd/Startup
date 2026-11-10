// The page behind every pohnch.pk/i/<token> link. next.config.ts sends all of them here, so it is one
// static page: the server never reads or stores the token. The browser reads it from the address bar
// only to build the "open in the app" links. If the app is installed, the phone opens it directly and
// this page isn't seen at all.
import type { Metadata } from 'next';
import { t } from '@pohnch/messages';
import { colors, shadow } from '@pohnch/ui/theme';
import { InviteButtons } from './InviteButtons';

export const metadata: Metadata = {
  title: `${t('ur', 'web.invite.title')} · Pohnch`,
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function Invite() {
  return (
    <main style={{ minHeight: '100vh', background: colors.ghee, color: colors.siyahi, fontFamily: 'var(--font-urdu), var(--font-latin), sans-serif' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '28px 16px 48px', display: 'grid', gap: 20 }}>
        <img src="/pohnch-lockup.svg" alt="Pohnch" width={180} height={51} style={{ height: 'auto', justifySelf: 'center' }} />
        {/* v16: a still of the miniature Karachi street with the van, above the invitation */}
        <img src="/v16/download-960.webp" alt="" width={960} height={600} style={{ width: '100%', height: 'auto', borderRadius: 28, boxShadow: shadow.raised }} />
        {/* The invitation itself, as one card: a neel top with the headline, then the buttons. */}
        <article className="pohnch-rise" style={{ background: colors.white, borderRadius: 32, overflow: 'hidden', boxShadow: shadow.raised }}>
          <header style={{ background: colors.neel, backgroundImage: `linear-gradient(160deg, ${colors.neelRaised}, ${colors.neel})`, color: colors.ghee, padding: '28px 24px 26px', display: 'grid', gap: 14 }}>
            <svg aria-hidden="true" width="44" height="44" viewBox="0 0 24 24" style={{ justifySelf: 'center' }}>
              <rect x="5" y="5" width="14" height="14" fill={colors.kesar} />
              <rect x="5" y="5" width="14" height="14" fill={colors.kesar} transform="rotate(45 12 12)" />
              <circle cx="12" cy="12" r="3.4" fill={colors.neel} />
            </svg>
            <section lang="ur" dir="rtl" style={{ display: 'grid', gap: 6, lineHeight: 1.8, textAlign: 'center' }}>
              <h1 style={{ fontSize: 34, margin: 0, fontFamily: 'var(--font-display), var(--font-urdu), serif', fontWeight: 400, lineHeight: 1.7 }}>{t('ur', 'web.invite.title')}</h1>
              <p style={{ margin: 0, fontSize: 18, color: colors.mutedOnDark }}>{t('ur', 'web.invite.body')}</p>
            </section>
            <section lang="en" dir="ltr" style={{ display: 'grid', gap: 4, lineHeight: 1.5, fontFamily: 'var(--font-latin), sans-serif', textAlign: 'center', paddingTop: 12, borderTop: '1px solid rgba(250,246,238,.16)' }}>
              <h2 style={{ fontSize: 20, margin: 0 }}>{t('en', 'web.invite.title')}</h2>
              <p style={{ margin: 0, fontSize: 16, color: colors.mutedOnDark }}>{t('en', 'web.invite.body')}</p>
            </section>
          </header>
          <div style={{ padding: 20 }}>
            <InviteButtons />
          </div>
        </article>
      </div>
    </main>
  );
}
