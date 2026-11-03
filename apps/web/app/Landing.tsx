// The landing page (v8), in either language. Every word comes from packages/messages.
// A hero with the headline (Gulzar in Urdu) beside the living map; how it works as three steps joined
// by the route's dots; a neel band for drivers and the privacy promise. Things rise in gently once.
import { PILOT_WHATSAPP } from '@pohnch/core';
import { t, type Lang, type MessageKey } from '@pohnch/messages';
import { colors, shadow } from '@pohnch/ui/theme';
import { LivingMap } from './LivingMap';
import { Shell } from './Shell';

const latin = 'var(--font-latin), sans-serif';

export function Landing({ lang }: { lang: Lang }) {
  const steps: MessageKey[] = ['web.how.1', 'web.how.2', 'web.how.3'];
  const ur = lang === 'ur';
  const display = ur ? { fontFamily: 'var(--font-display), var(--font-urdu), serif', fontWeight: 400, lineHeight: 1.75 } : { fontWeight: 800, lineHeight: 1.12, letterSpacing: '-0.02em' };
  const whatsapp = `https://wa.me/${PILOT_WHATSAPP.waNumber}`;
  return (
    <Shell lang={lang} otherHref={ur ? '/en' : '/'}>
      <section style={{ marginTop: 40, display: 'grid', gap: 40, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', alignItems: 'center' }}>
        <div style={{ display: 'grid', gap: 22 }}>
          <p className="pohnch-rise" style={{ margin: 0, fontWeight: 700, color: colors.zamurradOnTint, background: colors.zamurradTint, padding: '6px 14px', borderRadius: 999, justifySelf: 'start', fontSize: 15 }}>{t(lang, 'web.pilot')}</p>
          <h1 className="pohnch-rise d1" style={{ fontSize: ur ? 'clamp(36px, 7vw, 60px)' : 'clamp(36px, 6.4vw, 60px)', margin: 0, color: colors.siyahi, ...display }}>{t(lang, 'web.hero')}</h1>
          <p className="pohnch-rise d2" style={{ fontSize: 20, color: colors.ink2, margin: 0, maxWidth: 560 }}>{t(lang, 'web.lead')}</p>
          <p className="pohnch-rise d3" style={{ margin: '6px 0 0' }}>
            <a className="pohnch-btn" href={whatsapp} style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: colors.neel, color: colors.ghee, fontWeight: 700, fontSize: 19, padding: '16px 26px', borderRadius: 18, textDecoration: 'none', boxShadow: `0 5px 0 ${colors.neelDeep}, 0 16px 30px ${colors.neelGlow}` }}>
              {t(lang, 'web.cta')}
              {/* Digits stay left to right inside Urdu text */}
              <bdi dir="ltr" style={{ fontFamily: latin, fontWeight: 800 }}>{PILOT_WHATSAPP.display}</bdi>
            </a>
          </p>
        </div>
        <div className="pohnch-rise d2" style={{ display: 'flex', justifyContent: 'center' }}>
          <LivingMap lang={lang} />
        </div>
      </section>

      <section style={{ marginTop: 88 }}>
        <h2 style={{ fontSize: 32, margin: '0 0 4px', ...(ur ? { fontFamily: 'var(--font-display), var(--font-urdu), serif', fontWeight: 400, lineHeight: 1.8 } : { fontWeight: 800 }) }}>{t(lang, 'web.how.title')}</h2>
        <p style={{ margin: '0 0 28px', color: colors.ink2, fontSize: 18 }}>{t(lang, 'web.how.lead')}</p>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 28, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {steps.map((k, i) => (
            <li key={k} style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
              <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ flex: 'none', width: 44, height: 44, borderRadius: 22, background: i === 2 ? colors.kesar : colors.neel, color: i === 2 ? colors.siyahi : colors.ghee, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 18, fontFamily: latin, boxShadow: `0 0 0 4px ${colors.white}, ${shadow.card}` }}>{i + 1}</span>
                {/* the route's dots, leading to the next step */}
                {i < steps.length - 1 ? <span className="pohnch-step-dots" style={{ flex: 1, height: 0, borderTop: `4px dotted ${colors.line}` }} /> : null}
              </div>
              <span style={{ fontSize: 18 }}>{t(lang, k)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section style={{ marginTop: 80, borderRadius: 32, background: colors.neel, backgroundImage: `linear-gradient(160deg, ${colors.neelRaised}, ${colors.neel})`, color: colors.ghee, padding: 'clamp(24px, 5vw, 44px)', display: 'grid', gap: 28, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', boxShadow: shadow.raised }}>
        <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
          <h2 style={{ fontSize: 26, margin: 0 }}>{t(lang, 'web.drivers.title')}</h2>
          <p style={{ margin: 0, color: colors.mutedOnDark, fontSize: 18 }}>{t(lang, 'web.drivers.body')}</p>
          <a className="pohnch-btn" href={whatsapp} style={{ justifySelf: 'start', marginTop: 6, background: colors.kesar, color: colors.siyahi, fontWeight: 700, padding: '12px 20px', borderRadius: 16, textDecoration: 'none', boxShadow: `0 4px 0 ${colors.kesarDeep}` }}>{t(lang, 'web.drivers.cta')}</a>
        </div>
        <div style={{ display: 'grid', gap: 10, alignContent: 'start', paddingInlineStart: 'clamp(0px, 3vw, 28px)', borderInlineStart: '1px solid rgba(250,246,238,.16)' }}>
          <h2 style={{ fontSize: 26, margin: 0 }}>{t(lang, 'web.footer.privacy')}</h2>
          <p style={{ margin: 0, fontSize: 18, color: colors.ghee }}>{t(lang, 'web.privacy.short')}</p>
        </div>
      </section>
    </Shell>
  );
}
