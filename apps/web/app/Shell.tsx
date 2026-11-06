// The frame around every public page (v13): a sticky glass bar (logo, links, language, "Get the app"),
// the page, and a night-street footer with every link the stores ask for.
import { PILOT_WHATSAPP } from '@pohnch/core';
import { dirOf, otherLang, t, type Lang } from '@pohnch/messages';
import type { ReactNode } from 'react';
import { href } from './_lib/links';
import { Street } from './_components/Street';

export function Shell({ lang, children, otherHref }: { lang: Lang; children: ReactNode; otherHref: string }) {
  const other = otherLang(lang);
  const ur = lang === 'ur';
  const links: [string, string][] = [
    [href(lang, '/#loop'), t(lang, 'site.nav.how')],
    [href(lang, '/safety'), t(lang, 'site.nav.safety')],
    [href(lang, '/drivers'), t(lang, 'site.nav.drivers')],
    [href(lang, '/#faq'), t(lang, 'site.nav.faq')],
  ];
  const foot: [string, string][] = [
    [href(lang, '/safety'), t(lang, 'site.nav.safety')],
    [href(lang, '/drivers'), t(lang, 'site.nav.drivers')],
    [href(lang, '/download'), t(lang, 'site.nav.download')],
    [href(lang, '/privacy'), t(lang, 'web.footer.privacy')],
    [href(lang, '/terms'), t(lang, 'site.foot.terms')],
    [href(lang, '/delete-account'), t(lang, 'site.foot.delete')],
  ];
  return (
    <main
      lang={lang}
      dir={dirOf(lang)}
      style={{
        minHeight: '100vh',
        background: 'var(--ghee)',
        color: 'var(--siyahi)',
        fontFamily: ur ? 'var(--font-urdu), var(--font-latin), sans-serif' : 'var(--font-latin), sans-serif',
        lineHeight: ur ? 1.8 : 1.5,
      }}
    >
      <nav className="nav" aria-label={t(lang, 'site.nav.home')}>
        <div className="wrap">
          <div className="nav-bar glass">
            <a href={href(lang, '/')} aria-label={t(lang, 'site.nav.home')} style={{ display: 'flex' }}>
              <img src="/pohnch-lockup.svg" alt={t(lang, 'app.parent.name')} width={128} height={37} style={{ height: 'auto', display: 'block' }} />
            </a>
            <div className="nav-links">{links.map(([h, l]) => <a key={h} href={h}>{l}</a>)}</div>
            <a className="nav-lang" href={otherHref} hrefLang={other} lang={other}>{t(lang, 'lang.switch')}</a>
            <a className="key key-neel" href={href(lang, '/download')}>{t(lang, 'site.nav.download')}</a>
          </div>
        </div>
      </nav>
      {children}
      <footer className="foot">
        <div className="foot-street"><Street time="night" h={120} rickshaw={false} /></div>
        <div className="foot-body">
          <div className="wrap foot-grid">
            <div style={{ display: 'grid', gap: 6 }}>
              <span className="display-ur" style={{ fontSize: 40, lineHeight: 1.4, color: 'var(--ghee)' }}>پہنچ</span>
              <small>{t(lang, 'brand.tagline')}</small>
              <small>{t(lang, 'site.foot.made')}</small>
            </div>
            <div className="foot-links">
              {foot.map(([h, l]) => <a key={h} href={h}>{l}</a>)}
              <a href={`https://wa.me/${PILOT_WHATSAPP.waNumber}`} rel="noreferrer">{t(lang, 'site.foot.contact')} <bdi dir="ltr" className="latin">{PILOT_WHATSAPP.display}</bdi></a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
