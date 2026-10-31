// The frame around every public page: logo, language switch, and the footer.
import { dirOf, t, otherLang, type Lang } from '@pohnch/messages';
import { colors } from '@pohnch/ui/theme';
import type { ReactNode } from 'react';

export function Shell({ lang, children, otherHref }: { lang: Lang; children: ReactNode; otherHref: string }) {
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
        lineHeight: lang === 'ur' ? 1.8 : 1.5,
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 48px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <a href={lang === 'ur' ? '/' : '/en'} aria-label={t(lang, 'app.parent.name')}>
            <img src="/pohnch-lockup.svg" alt={t(lang, 'app.parent.name')} width={200} height={57} style={{ height: 'auto', display: 'block' }} />
          </a>
          <a href={otherHref} hrefLang={other} style={{ color: colors.neel, fontWeight: 700, fontSize: 16, padding: '10px 16px', border: `1px solid ${colors.line}`, borderRadius: 999, textDecoration: 'none', background: colors.white }}>
            {t(lang, 'lang.switch')}
          </a>
        </header>
        {children}
        <footer style={{ marginTop: 64, paddingTop: 20, borderTop: `1px solid ${colors.line}`, display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 15, color: colors.ink2 }}>
          <a href={lang === 'ur' ? '/privacy' : '/en/privacy'} style={{ color: colors.neel }}>{t(lang, 'web.footer.privacy')}</a>
          <span>{t(lang, 'brand.tagline')}</span>
        </footer>
      </div>
    </main>
  );
}
