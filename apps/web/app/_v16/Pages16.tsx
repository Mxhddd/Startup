// The inner pages of pohnch.pk (v16), in either language: Drivers, Safety, Download, Privacy, Terms,
// Delete account and the 404. Same look as the home page: a still picture of the 3D miniature
// Karachi at the top, big calm type, gilt rules, no boxes, a night footer. Server-rendered; the only
// interactive parts (the demos and the driver join form) are small client islands.
import { PILOT_WHATSAPP, STORE } from '@pohnch/core';
import { dirOf, otherLang, t, type Lang, type MessageKey } from '@pohnch/messages';
import type { ReactNode } from 'react';
import qrcode from 'qrcode-generator';
import { href, otherHref } from '../_lib/links';
import { DriverIslands } from './PageIslands';
import { webWords } from './Home';
import './home.css';
import './pages.css';

const k = (lang: Lang, key: string) => t(lang, key as MessageKey);
const w = (lang: Lang, key: string) => t(lang, `web.${key}` as MessageKey);
const wa = `https://wa.me/${PILOT_WHATSAPP.waNumber}`;
const Arrow = () => <svg className="arr" width="22" height="12" viewBox="0 0 22 12" aria-hidden="true"><path d="M1 6h19M15 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;

/** The main button: "Join the pilot" (to the form on the home page), or Google Play once STORE.playUrl is set. */
function Cta({ lang, className = 'btn' }: { lang: Lang; className?: string }) {
  return STORE.playUrl ? <a className={className} href={STORE.playUrl} rel="noreferrer">{w(lang, 'ctaPlay')}</a> : <a className={className} href={`${href(lang, '/')}#join`}>{w(lang, 'cta')}</a>;
}

export function Shell16({ lang, path, children }: { lang: Lang; path: string; children: ReactNode }) {
  const other = otherLang(lang);
  const links = (
    <>
      <a href={`${href(lang, '/')}#how`}>{w(lang, 'nav.how')}</a>
      <a href={href(lang, '/safety')}>{w(lang, 'nav.safety')}</a>
      <a href={href(lang, '/drivers')}>{w(lang, 'nav.drivers')}</a>
      <a href={href(lang, '/download')}>{k(lang, 'site.nav.download')}</a>
    </>
  );
  return (
    <main className="v16 v16p" lang={lang} dir={dirOf(lang)} data-lang={lang}>
      <header className="pbar">
        <a className="mark" href={href(lang, '/')} aria-label={w(lang, 'nav.home')}><b>پہنچ</b><span>Pohnch</span></a>
        <nav className="pnav" aria-label={w(lang, 'nav.menu')}>{links}</nav>
        <a className="lang" href={otherHref(lang, path)} hrefLang={other} lang={other}>{k(lang, 'lang.switch')}</a>
        <span className="pcta"><Cta lang={lang} /></span>
        <details className="pmenu">
          <summary>{w(lang, 'nav.menu')}</summary>
          <nav aria-label={w(lang, 'nav.menu')}>{links}<a href={`${href(lang, '/')}#join`}>{w(lang, 'cta')}</a></nav>
        </details>
      </header>
      {children}
      <footer className="pfoot">
        <div className="pwrap">
          <div className="fl"><span className="mark"><b>پہنچ</b><span>Pohnch</span></span><small>{w(lang, 'foot.made')}</small></div>
          <nav aria-label={w(lang, 'nav.menu')}>
            <a href={href(lang, '/')}>{w(lang, 'pg.home')}</a>
            <a href={href(lang, '/safety')}>{w(lang, 'nav.safety')}</a>
            <a href={href(lang, '/drivers')}>{w(lang, 'nav.drivers')}</a>
            <a href={href(lang, '/download')}>{k(lang, 'site.nav.download')}</a>
            <a href={href(lang, '/privacy')}>{k(lang, 'web.footer.privacy')}</a>
            <a href={href(lang, '/terms')}>{k(lang, 'site.foot.terms')}</a>
            <a href={href(lang, '/delete-account')}>{k(lang, 'site.foot.delete')}</a>
            <a href={wa} rel="noreferrer">{k(lang, 'site.foot.contact')} <bdi dir="ltr" className="num">{PILOT_WHATSAPP.display}</bdi></a>
            <a href={otherHref(lang, path)} hrefLang={other} lang={other}>{k(lang, 'lang.switch')}</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}

/** The top of an inner page: a still of the 3D city, then the kicker, title and lead over its lower edge. */
function Hero({ img, kick, title, lead, night }: { img: string; kick: string; title: string; lead?: string; night?: boolean }) {
  return (
    <section className={`phero ${night ? 'night' : ''}`}>
      <picture>
        <source media="(max-width: 760px)" srcSet={`/v16/${img}-960.webp`} />
        <img src={`/v16/${img}.webp`} alt="" width={1600} height={1000} fetchPriority="high" />
      </picture>
      <div className="pwrap phead">
        <p className="kick">{kick}</p>
        <h1>{title}</h1>
        {lead ? <p className="lede">{lead}</p> : null}
      </div>
    </section>
  );
}

export function DriversPage16({ lang }: { lang: Lang }) {
  const words = webWords(lang);
  return (
    <Shell16 lang={lang} path="/drivers">
      <Hero img="drivers" kick={w(lang, 'dr.k')} title={k(lang, 'site.drv.title')} lead={k(lang, 'site.drv.lead')} />
      <section className="pwrap pgrid4">
        {[1, 2, 3, 4].map((n) => <div key={n} className="fact"><span className="num idx">{String(n).padStart(2, '0')}</span><h3>{k(lang, `site.drv.f${n}.t`)}</h3><p>{k(lang, `site.drv.f${n}.b`)}</p></div>)}
      </section>
      <section className="pwrap">
        <h2>{w(lang, 'dr.try')}</h2>
        <DriverIslands lang={lang} w={words} part="demos" />
      </section>
      <section className="pwrap">
        <h2>{k(lang, 'site.drv.how.title')}</h2>
        <ol className="miles">{[1, 2, 3].map((n) => <li key={n}><span className="stone num" aria-hidden="true">{n}</span><p>{k(lang, `site.drv.how.${n}`)}</p></li>)}</ol>
      </section>
      <section className="pwrap">
        <h2>{w(lang, 'dr.faq')}</h2>
        <div className="qa">{[1, 2, 3, 4].map((n) => <details key={n}><summary>{w(lang, `dq.${n}.q`)}</summary><p>{w(lang, `dq.${n}.a`)}</p></details>)}</div>
      </section>
      <section className="pnight" id="join">
        <div className="pwrap">
          <h2>{w(lang, 'dr.join')}</h2>
          <p>{w(lang, 'join.lead')}</p>
          <DriverIslands lang={lang} w={words} part="join" />
        </div>
      </section>
    </Shell16>
  );
}

export function SafetyPage16({ lang }: { lang: Lang }) {
  return (
    <Shell16 lang={lang} path="/safety">
      <Hero img="safety" kick={w(lang, 'sf.k')} title={w(lang, 'prom.h')} lead={k(lang, 'site.safety.lead')} />
      <section className="pwrap">
        <ol className="promises">{[1, 2, 3, 4, 5, 6, 7].map((n) => <li key={n}><span className="seal" aria-hidden="true"><b>پہنچ</b></span><div><h3>{w(lang, `p${n}`)}</h3><p>{w(lang, `p${n}.b`)}</p></div></li>)}</ol>
      </section>
      <section className="pwrap">
        <h2>{w(lang, 'sf.ver.t')}</h2>
        <ol className="miles">{[1, 2, 3].map((n) => <li key={n}><span className="stone num" aria-hidden="true">{n}</span><p>{w(lang, `sf.ver.${n}`)}</p></li>)}</ol>
      </section>
      <section className="pwrap">
        <h2>{w(lang, 'sf.tl.t')}</h2>
        <ol className="tline">{[1, 2, 3, 4].map((n) => <li key={n}><i className={`b b${n}`} aria-hidden="true" /><b>{w(lang, `sf.tl.${n}t`)}</b><p>{w(lang, `sf.tl.${n}`)}</p></li>)}</ol>
      </section>
      <section className="pwrap">
        <h2>{w(lang, 'never.h')}</h2>
        <ul className="nolist">{[1, 2, 3, 4].map((n) => <li key={n}><span>{w(lang, `never.${n}`)}</span></li>)}</ul>
      </section>
      <section className="pwrap help">
        <h2>{w(lang, 'sf.help.t')}</h2>
        <p>{w(lang, 'sf.help.p')}</p>
        <p className="nums"><b className="num">15</b><b className="num">1122</b></p>
        <a className="link" href={href(lang, '/privacy')}>{k(lang, 'site.safety.policy')}<Arrow /></a>
      </section>
    </Shell16>
  );
}

function storeQr(url: string): string {
  const q = qrcode(0, 'M'); q.addData(url); q.make();
  return q.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
}

export function DownloadPage16({ lang }: { lang: Lang }) {
  return (
    <Shell16 lang={lang} path="/download">
      <Hero img="download" kick={k(lang, 'site.dl.kicker')} title={k(lang, 'site.dl.title')} lead={k(lang, 'site.dl.lead')} />
      <section className="pwrap">
        <h2>{w(lang, 'dl.apps')}</h2>
        <div className="apps">
          <div><span className="appicon parent" aria-hidden="true"><b>پہنچ</b></span><h3>{k(lang, 'site.dl.parentApp')}</h3><p>{w(lang, 'dl.parent')}</p></div>
          <div><span className="appicon driver" aria-hidden="true"><b>پہنچ</b></span><h3>{k(lang, 'site.dl.driverApp')}</h3><p>{w(lang, 'dl.driver')}</p></div>
        </div>
        <p className="status">{w(lang, 'dl.status')}</p>
        {STORE.playUrl ? (
          <div className="getrow"><a className="btn" href={STORE.playUrl} rel="noreferrer">{w(lang, 'ctaPlay')}</a><figure className="qr"><span dangerouslySetInnerHTML={{ __html: storeQr(STORE.playUrl) }} /><figcaption>{w(lang, 'dl.scan')}</figcaption></figure></div>
        ) : (
          <div className="getrow"><Cta lang={lang} /><a className="link" href={wa} rel="noreferrer">{k(lang, 'site.dl.join')}<Arrow /></a></div>
        )}
      </section>
      <section className="pwrap">
        <h2>{k(lang, 'site.dl.steps.title')}</h2>
        <ol className="miles">{[1, 2, 3].map((n) => <li key={n}><span className="stone num" aria-hidden="true">{n}</span><p>{k(lang, `site.dl.step${n}`)}</p></li>)}</ol>
      </section>
    </Shell16>
  );
}

/** Long text pages (privacy, terms): a short summary, then the sections with a table of contents. */
function Doc({ lang, sections, summary }: { lang: Lang; sections: { id: string; title: string; body: string }[]; summary?: ReactNode }) {
  return (
    <div className="pwrap doc">
      <nav className="toc" aria-label={w(lang, 'pg.toc')}><p className="kick">{w(lang, 'pg.toc')}</p>{sections.map((s) => <a key={s.id} href={`#${s.id}`}>{s.title}</a>)}</nav>
      <article>
        {summary}
        {sections.map((s) => <section key={s.id} id={s.id}><h2>{s.title}</h2><p>{s.body}</p></section>)}
        <p className="updated">{w(lang, 'pg.updated')}</p>
      </article>
    </div>
  );
}

const PRIVACY = ['collect', 'never', 'who', 'keep', 'pilot', 'safe', 'contact'] as const;
export function PrivacyPage16({ lang }: { lang: Lang }) {
  const summary = (
    <div className="summary">
      <p className="kick">{w(lang, 'ps.k')}</p>
      <dl>{[1, 2, 3, 4].map((n) => <div key={n}><dt>{w(lang, `ps.${n}t`)}</dt><dd>{w(lang, `ps.${n}`)}</dd></div>)}</dl>
    </div>
  );
  return (
    <Shell16 lang={lang} path="/privacy">
      <Hero img="privacy" kick={k(lang, 'web.footer.privacy')} title={k(lang, 'privacy.title')} lead={k(lang, 'privacy.intro')} night />
      <Doc lang={lang} summary={summary} sections={PRIVACY.map((s) => ({ id: s, title: k(lang, `privacy.${s}.title`), body: k(lang, `privacy.${s}.body`) }))} />
    </Shell16>
  );
}

export function TermsPage16({ lang }: { lang: Lang }) {
  return (
    <Shell16 lang={lang} path="/terms">
      <Hero img="paper" kick={k(lang, 'site.foot.terms')} title={k(lang, 'site.terms.title')} lead={k(lang, 'site.terms.updated')} />
      <Doc lang={lang} sections={[1, 2, 3, 4, 5, 6].map((n) => ({ id: `t${n}`, title: k(lang, `site.terms.${n}.t`), body: k(lang, `site.terms.${n}.b`) }))} />
    </Shell16>
  );
}

export function DeletePage16({ lang }: { lang: Lang }) {
  return (
    <Shell16 lang={lang} path="/delete-account">
      <Hero img="paper" kick={k(lang, 'site.foot.delete')} title={k(lang, 'site.del.title')} lead={k(lang, 'site.del.lead')} />
      <section className="pwrap">
        <ol className="miles">
          <li><span className="stone num" aria-hidden="true">1</span><p>{k(lang, 'site.del.parent')}</p></li>
          <li><span className="stone num" aria-hidden="true">2</span><p>{k(lang, 'site.del.driver')}</p></li>
          <li><span className="stone num" aria-hidden="true">3</span><p>{k(lang, 'site.del.noApp')} <a href={wa} rel="noreferrer"><bdi dir="ltr" className="num">{PILOT_WHATSAPP.display}</bdi></a></p></li>
        </ol>
      </section>
      <section className="pwrap two">
        <div><h2>{k(lang, 'site.del.what.title')}</h2><p>{k(lang, 'site.del.what')}</p></div>
        <div><h2>{k(lang, 'site.del.keep.title')}</h2><p>{k(lang, 'site.del.keep')}</p></div>
      </section>
    </Shell16>
  );
}

export function NotFound16() {
  return (
    <Shell16 lang="en" path="/">
      <Hero img="lost" kick="404" title={w('en', 'nf.h')} lead={w('en', 'nf.p')} />
      <section className="pwrap nf">
        <p lang="ur" dir="rtl" className="urline">{w('ur', 'nf.h')} {w('ur', 'nf.p')}</p>
        <div className="getrow"><a className="btn" href="/">{w('en', 'nf.home')}</a><a className="link" href="/ur" lang="ur">{w('ur', 'nf.home')}<Arrow /></a></div>
      </section>
    </Shell16>
  );
}
