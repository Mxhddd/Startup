// The landing page, in either language. Every word comes from packages/messages.
import { dirOf, t, otherLang, type Lang } from '@pohnch/messages';
import { PILOT_WHATSAPP } from '@pohnch/core';
import { colors } from '@pohnch/ui/theme';

export function Landing({ lang }: { lang: Lang }) {
  const other = otherLang(lang);
  return (
    <main
      lang={lang}
      dir={dirOf(lang)}
      style={{
        minHeight: '100vh',
        background: colors.ghee,
        color: colors.siyahi,
        fontFamily: lang === 'ur' ? 'var(--font-urdu), var(--font-latin), sans-serif' : 'var(--font-latin), sans-serif',
        lineHeight: lang === 'ur' ? 1.7 : 1.4,
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 64px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <img src="/pohnch-lockup.svg" alt={t(lang, 'app.parent.name')} width={200} height={57} style={{ height: 'auto' }} />
          <a href={other === 'en' ? '/en' : '/'} hrefLang={other} style={{ color: colors.neel, fontWeight: 700, fontSize: 16, padding: '10px 16px', border: `1px solid ${colors.line}`, borderRadius: 999, textDecoration: 'none', background: colors.white }}>
            {t(lang, 'lang.switch')}
          </a>
        </header>
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
      </div>
    </main>
  );
}
