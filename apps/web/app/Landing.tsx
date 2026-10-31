// The landing page, in either language. Every word comes from packages/messages.
import { PILOT_WHATSAPP } from '@pohnch/core';
import { t, type Lang, type MessageKey } from '@pohnch/messages';
import { colors } from '@pohnch/ui/theme';
import { Shell } from './Shell';

const card = { background: colors.white, border: `1px solid ${colors.line}`, borderRadius: 16, padding: 20 } as const;

export function Landing({ lang }: { lang: Lang }) {
  const steps: MessageKey[] = ['web.how.1', 'web.how.2', 'web.how.3'];
  return (
    <Shell lang={lang} otherHref={lang === 'ur' ? '/en' : '/'}>
      <section style={{ marginTop: 56, display: 'grid', gap: 20 }}>
        <h1 style={{ fontSize: 'clamp(30px, 6vw, 52px)', lineHeight: 1.35, margin: 0 }}>{t(lang, 'web.hero')}</h1>
        <p style={{ fontSize: 19, color: colors.ink2, margin: 0, maxWidth: 640 }}>{t(lang, 'web.lead')}</p>
        <p style={{ margin: 0 }}>
          <a href={`https://wa.me/${PILOT_WHATSAPP.waNumber}`} style={{ display: 'inline-block', background: colors.neel, color: colors.ghee, fontWeight: 700, fontSize: 18, padding: '14px 22px', borderRadius: 14, textDecoration: 'none' }}>
            {t(lang, 'web.cta')}{' '}
            {/* Digits stay left to right inside Urdu text */}
            <bdi dir="ltr" style={{ fontFamily: 'var(--font-latin), sans-serif' }}>{PILOT_WHATSAPP.display}</bdi>
          </a>
        </p>
        <p style={{ margin: 0, fontWeight: 700, color: colors.zamurradOnTint, background: colors.zamurradTint, padding: '8px 14px', borderRadius: 999, justifySelf: 'start' }}>{t(lang, 'web.pilot')}</p>
      </section>

      <section style={{ marginTop: 56 }}>
        <h2 style={{ fontSize: 26, margin: '0 0 16px' }}>{t(lang, 'web.how.title')}</h2>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {steps.map((k, i) => (
            <li key={k} style={{ ...card, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span aria-hidden="true" style={{ flex: 'none', width: 32, height: 32, borderRadius: 16, background: colors.neel, color: colors.ghee, display: 'grid', placeItems: 'center', fontWeight: 800, fontFamily: 'var(--font-latin), sans-serif' }}>{i + 1}</span>
              <span style={{ fontSize: 17 }}>{t(lang, k)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section style={{ marginTop: 40, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <div style={card}>
          <h2 style={{ fontSize: 22, margin: '0 0 8px' }}>{t(lang, 'web.drivers.title')}</h2>
          <p style={{ margin: 0, color: colors.ink2, fontSize: 17 }}>{t(lang, 'web.drivers.body')}</p>
        </div>
        <div style={{ ...card, background: colors.neelTint, borderColor: colors.neelTint }}>
          <h2 style={{ fontSize: 22, margin: '0 0 8px' }}>{t(lang, 'web.footer.privacy')}</h2>
          <p style={{ margin: 0, fontSize: 17 }}>{t(lang, 'web.privacy.short')}</p>
        </div>
      </section>
    </Shell>
  );
}
