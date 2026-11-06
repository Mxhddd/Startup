// The frame around every inner page (v14): a thin top line (mark, links, language, one pill) on
// ivory paper, the page, and a night footer with every link the stores ask for.
import { PILOT_WHATSAPP } from '@pohnch/core';
import { dirOf, otherLang, t, type Lang } from '@pohnch/messages';
import type { ReactNode } from 'react';
import { href } from './_lib/links';

export function Shell({ lang, children, otherHref }: { lang: Lang; children: ReactNode; otherHref: string }) {
  const other = otherLang(lang);
  const ur = lang === 'ur';
  return (
    <main className="ed" lang={lang} dir={dirOf(lang)} style={{ fontFamily: ur ? 'var(--font-urdu), var(--font-latin), sans-serif' : 'var(--font-latin), sans-serif', lineHeight: ur ? 1.8 : 1.55 }}>
      <header className="ed-top">
        <div className="ed-wrap">
          <a className="mark" href={href(lang, '/')} aria-label={t(lang, 'site.nav.home')}><b>پہنچ</b><span>Pohnch<i /></span></a>
          <nav className="ed-links" aria-label={t(lang, 'site.nav.home')}>
            <a href={href(lang, '/safety')}>{t(lang, 'site.nav.safety')}</a>
            <a href={href(lang, '/drivers')}>{t(lang, 'site.nav.drivers')}</a>
            <a href={href(lang, '/download')}>{t(lang, 'site.nav.download')}</a>
          </nav>
          <a className="ed-lang" href={otherHref} hrefLang={other} lang={other}>{t(lang, 'lang.switch')}</a>
          <a className="pill" href={href(lang, '/download')}>{t(lang, 'site.nav.download')}</a>
        </div>
      </header>
      {children}
      <footer className="ed-foot">
        <div className="ed-wrap">
          <span className="mark"><b>پہنچ</b><span>Pohnch<i /></span></span>
          <nav aria-label={t(lang, 'site.nav.home')}>
            <a href={href(lang, '/safety')}>{t(lang, 'site.nav.safety')}</a>
            <a href={href(lang, '/drivers')}>{t(lang, 'site.nav.drivers')}</a>
            <a href={href(lang, '/download')}>{t(lang, 'site.nav.download')}</a>
            <a href={href(lang, '/privacy')}>{t(lang, 'web.footer.privacy')}</a>
            <a href={href(lang, '/terms')}>{t(lang, 'site.foot.terms')}</a>
            <a href={href(lang, '/delete-account')}>{t(lang, 'site.foot.delete')}</a>
            <a href={`https://wa.me/${PILOT_WHATSAPP.waNumber}`} rel="noreferrer">{t(lang, 'site.foot.contact')} <bdi dir="ltr" className="num">{PILOT_WHATSAPP.display}</bdi></a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
