// The inner pages of pohnch.pk (v16), in either language: Drivers, Safety, Download, Privacy, Terms,
// Delete account and the 404. Same look as the home page: a still picture of the 3D miniature
// Karachi at the top, big calm type, gilt rules, no boxes, a night footer. Server-rendered; the only
// interactive parts (the demos and the driver join form) are small client islands.
import { PILOT_WHATSAPP, STORE } from '@pohnch/core';
import { dirOf, otherLang, t, type Lang, type MessageKey } from '@pohnch/messages';
import type { ReactNode } from 'react';
import qrcode from 'qrcode-generator';
import { href, otherHref } from '../_lib/links';
import { DriverIslands, ProgressIsland, SchoolForm } from './PageIslands';
import { AppJoin } from './AppJoin';
import { PageHub } from './Hub';
import { DocSpy } from './DocSpy';
import { PageScene } from './PageScene';
import type { PageId } from './pageScenes';
import { webWords } from './words';
import { SiteFooter } from './Footer';
import { Chamak, Couplet, Roundel, truckVars } from './truckart';
import { worldWords } from './worldWords';
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
      <a href={href(lang, '/story')}>{w(lang, 'nav.story')}</a>
      <a href={href(lang, '/download')}>{k(lang, 'site.nav.download')}</a>
    </>
  );
  return (
    <div className="v16 v16p" lang={lang} dir={dirOf(lang)} data-lang={lang} style={truckVars()}>
      <header className="pbar">
        <a className="mark" href={href(lang, '/')} aria-label={w(lang, 'nav.home')}><b>پہنچ</b><span>Pohnch</span></a>
        <nav className="pnav" aria-label={w(lang, 'nav.main')}>{links}</nav>
        <a className="lang" href={otherHref(lang, path)} hrefLang={other} lang={other}>{k(lang, 'lang.switch')}</a>
        <span className="pcta"><Cta lang={lang} /></span>
        <details className="pmenu">
          <summary>{w(lang, 'nav.menu')}</summary>
          <nav aria-label={w(lang, 'nav.menu')}>{links}<a href={`${href(lang, '/')}#join`}>{w(lang, 'cta')}</a></nav>
        </details>
      </header>
      <main id="main">{children}</main>
      <SiteFooter w={webWords(lang)} wa={{ href: wa, display: PILOT_WHATSAPP.display }}
        line={{ ur: worldWords().lines[2]?.ur ?? '', en: worldWords().lines[2]?.en ?? '' }}
        links={{ home: href(lang, '/'), how: `${href(lang, '/')}#how`, safety: href(lang, '/safety'), drivers: href(lang, '/drivers'), download: href(lang, '/download'), story: href(lang, '/story'), progress: href(lang, '/progress'), schools: href(lang, '/schools'), privacy: href(lang, '/privacy'), terms: href(lang, '/terms'), delete: href(lang, '/delete-account'), other: otherHref(lang, path) }}
        labels={{ privacy: k(lang, 'web.footer.privacy'), terms: k(lang, 'site.foot.terms'), delete: k(lang, 'site.foot.delete'), download: k(lang, 'site.nav.download'), contact: k(lang, 'site.foot.contact'), switchLang: k(lang, 'lang.switch'), otherLang: other }} />
    </div>
  );
}

/** The top of an inner page (v18): its own scene of the 3D city (live on capable desktops, a still
 *  elsewhere), an optional painted detail over it, then the kicker, title and lead over its lower edge. */
function Hero({ scene, kick, title, lead, night, overlay }: { scene: PageId; kick: string; title: string; lead?: string; night?: boolean; overlay?: ReactNode }) {
  return (
    <section className={`phero ${night ? 'night' : ''}`}>
      <PageScene id={scene} words={worldWords()} />
      {overlay ? <div className="poverlay" aria-hidden="true">{overlay}</div> : null}
      <div className="pwrap phead">
        <p className="kick">{kick}</p>
        <h1>{title}</h1>
        {lead ? <p className="lede">{lead}</p> : null}
      </div>
    </section>
  );
}
/** A quiet top for the small-print pages: the painted star and a band of chamak patti, no 3D. */
function QuietHero({ kick, title, lead }: { kick: string; title: string; lead?: string }) {
  return (
    <section className="phero quiet">
      <div className="pwrap phead">
        <Roundel size={56} className="qstar" />
        <p className="kick">{kick}</p>
        <h1>{title}</h1>
        {lead ? <p className="lede">{lead}</p> : null}
      </div>
      <Chamak seed={9} h={14} className="qband" />
    </section>
  );
}

export function DriversPage16({ lang }: { lang: Lang }) {
  const words = webWords(lang);
  return (
    <Shell16 lang={lang} path="/drivers">
      <Hero scene="drivers" kick={w(lang, 'dr.k')} title={k(lang, 'site.drv.title')} lead={k(lang, 'site.drv.lead')}
        overlay={<span className="floattap"><i /><b>{w(lang, 'sides.tap')}</b></span>} />
      <section className="pwrap pgrid4">
        {[1, 2, 3, 4].map((n) => <div key={n} className="fact painted" data-tilt=""><span className="fhead"><Roundel size={30} /><span className="num idx">{String(n).padStart(2, '0')}</span></span><h3>{k(lang, `site.drv.f${n}.t`)}</h3><p>{k(lang, `site.drv.f${n}.b`)}</p></div>)}
      </section>
      <PageHub sid="answers" className="inner" kick={w(lang, 'drh.k')} title={w(lang, 'drh.h')} first="try" hashes={{ '#try': 'try', '#how': 'how', '#questions': 'faq' }} topics={[
        { id: 'try', label: w(lang, 'drh.try'), content: <><h3>{w(lang, 'dr.try')}</h3><DriverIslands lang={lang} w={words} part="demos" /></> },
        { id: 'how', label: w(lang, 'drh.how'), content: <><h3>{k(lang, 'site.drv.how.title')}</h3><ol className="miles route">{[1, 2, 3].map((n) => <li key={n}><span className="stone num" aria-hidden="true">{n}</span><p>{k(lang, `site.drv.how.${n}`)}</p></li>)}</ol></> },
        { id: 'faq', label: w(lang, 'drh.faq'), content: <><h3>{w(lang, 'dr.faq')}</h3><div className="qa">{[1, 2, 3, 4].map((n) => <details key={n}><summary>{w(lang, `dq.${n}.q`)}</summary><p>{w(lang, `dq.${n}.a`)}</p></details>)}</div></> },
      ]} />
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
      <Hero scene="safety" kick={w(lang, 'sf.k')} title={w(lang, 'prom.h')} lead={k(lang, 'site.safety.lead')}
        overlay={<span className="vbadge"><Roundel size={64} /><svg viewBox="0 0 24 24" width="28" height="28"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#FAF6EE" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg><b>{w(lang, 'phone.verified')}</b></span>} />
      <PageHub sid="answers" className="inner" kick={w(lang, 'sf.k')} title={w(lang, 'sfh.h')} first="promises" hashes={{ '#promises': 'promises', '#checks': 'check', '#location': 'location', '#never': 'never', '#help': 'help' }} topics={[
        { id: 'promises', label: w(lang, 'sfh.prom'), content: <><ol className="promlist">{[1, 2, 3, 4, 5, 6, 7].map((n) => <li key={n} style={{ ['--k' as string]: n }}><Roundel size={34} /><div><b>{w(lang, `p${n}`)}</b><p>{w(lang, `p${n}.b`)}</p></div></li>)}</ol></> },
        { id: 'check', label: w(lang, 'sfh.check'), content: <><h3>{w(lang, 'sf.ver.t')}</h3><ol className="miles route">{[1, 2, 3].map((n) => <li key={n}><span className="stone num" aria-hidden="true">{n}</span><p>{w(lang, `sf.ver.${n}`)}</p></li>)}</ol></> },
        { id: 'location', label: w(lang, 'sfh.loc'), content: <><h3>{w(lang, 'sf.tl.t')}</h3><ol className="tline">{[1, 2, 3, 4].map((n) => <li key={n}><i className={`b b${n}`} aria-hidden="true" /><b>{w(lang, `sf.tl.${n}t`)}</b><p>{w(lang, `sf.tl.${n}`)}</p></li>)}</ol></> },
        { id: 'never', label: w(lang, 'sfh.never'), content: <><h3>{w(lang, 'never.h')}</h3><ul className="nolist">{[1, 2, 3, 4].map((n) => <li key={n} style={{ ['--k' as string]: n }}><span>{w(lang, `never.${n}`)}</span></li>)}</ul><a className="link" href={href(lang, '/privacy')}>{k(lang, 'site.safety.policy')}<Arrow /></a></> },
        { id: 'help', label: w(lang, 'sfh.help'), content: <div className="help"><h3>{w(lang, 'sf.help.t')}</h3><p>{w(lang, 'sf.help.p')}</p><p className="nums"><b className="num">15</b><b className="num">1122</b></p></div> },
      ]} />
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
      <Hero scene="download" kick={k(lang, 'site.dl.kicker')} title={k(lang, 'site.dl.title')} lead={k(lang, 'site.dl.lead')} />
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
          <div className="getrow"><a className="btn" href={href(lang, '/app')} data-testid="dl-get">{w(lang, 'getapp.kick')}</a><a className="link" href={wa} rel="noreferrer">{k(lang, 'site.dl.join')}<Arrow /></a></div>
        )}
      </section>
      <section className="pwrap">
        <h2>{k(lang, 'site.dl.steps.title')}</h2>
        <ol className="miles">{[1, 2, 3].map((n) => <li key={n}><span className="stone num" aria-hidden="true">{n}</span><p>{k(lang, `site.dl.step${n}`)}</p></li>)}</ol>
      </section>
    </Shell16>
  );
}

/** v21 pohnch.pk/app: the poster's QR code lands here. Light (no 3D scene) so it opens fast on any phone. */
export function AppPage16({ lang }: { lang: Lang }) {
  return (
    <Shell16 lang={lang} path="/app">
      <section className="pwrap joinpage">
        <div className="module joincard">
          <p className="kick">{w(lang, 'getapp.kick')}</p>
          <h1>{w(lang, 'getapp.title')}</h1>
          <p className="lead">{w(lang, 'getapp.lead')}</p>
          <AppJoin lang={lang} waitlist={`${href(lang, '/')}#join`} />
        </div>
      </section>
    </Shell16>
  );
}

/** Long text pages (privacy, terms): a short summary, then the sections with a table of contents. */
function Doc({ lang, sections, summary }: { lang: Lang; sections: { id: string; title: string; body: string }[]; summary?: ReactNode }) {
  return (
    <div className="pwrap doc">
      <DocSpy ids={sections.map((s) => s.id)} />
      <nav className="toc" aria-label={w(lang, 'pg.toc')}><p className="kick">{w(lang, 'pg.toc')}</p>{sections.map((s) => <a key={s.id} href={`#${s.id}`}><Roundel size={18} />{s.title}</a>)}</nav>
      <article>
        {summary}
        {sections.map((s) => <section key={s.id} id={s.id}><h2>{s.title}</h2><p>{s.body}</p></section>)}
        <p className="updated">{w(lang, 'pg.updated')}</p>
      </article>
    </div>
  );
}

const PRIVACY = ['collect', 'never', 'who', 'keep', 'pilot', 'analytics', 'safe', 'contact'] as const;
export function PrivacyPage16({ lang }: { lang: Lang }) {
  const summary = (
    <div className="summary">
      <p className="kick">{w(lang, 'ps.k')}</p>
      <dl>{[1, 2, 3, 4].map((n) => <div key={n}><dt>{w(lang, `ps.${n}t`)}</dt><dd>{w(lang, `ps.${n}`)}</dd></div>)}</dl>
    </div>
  );
  return (
    <Shell16 lang={lang} path="/privacy">
      <Hero scene="privacy" kick={k(lang, 'web.footer.privacy')} title={k(lang, 'privacy.title')} lead={k(lang, 'privacy.intro')} night />
      <Doc lang={lang} summary={summary} sections={PRIVACY.map((s) => ({ id: s, title: k(lang, `privacy.${s}.title`), body: k(lang, `privacy.${s}.body`) }))} />
    </Shell16>
  );
}

export function TermsPage16({ lang }: { lang: Lang }) {
  return (
    <Shell16 lang={lang} path="/terms">
      <QuietHero kick={k(lang, 'site.foot.terms')} title={k(lang, 'site.terms.title')} lead={k(lang, 'site.terms.updated')} />
      <Doc lang={lang} sections={[1, 2, 3, 4, 5, 6].map((n) => ({ id: `t${n}`, title: k(lang, `site.terms.${n}.t`), body: k(lang, `site.terms.${n}.b`) }))} />
    </Shell16>
  );
}

export function DeletePage16({ lang }: { lang: Lang }) {
  return (
    <Shell16 lang={lang} path="/delete-account">
      <QuietHero kick={k(lang, 'site.foot.delete')} title={k(lang, 'site.del.title')} lead={k(lang, 'site.del.lead')} />
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
      <Hero scene="lost" kick="404" title={w('en', 'nf.h')} lead={w('en', 'nf.p')}
        overlay={<span className="wrongturn"><Chamak seed={11} h={10} /><b lang="ur" dir="rtl">{w('ur', 'nf.board')}</b><small>{w('en', 'nf.board')}</small><Chamak seed={12} h={10} /></span>} />
      <section className="pwrap nf">
        <p lang="ur" dir="rtl" className="urline">{w('ur', 'nf.h')} {w('ur', 'nf.p')}</p>
        <div className="getrow"><a className="btn" href="/">{w('en', 'nf.home')}</a><a className="link" href="/ur" lang="ur">{w('ur', 'nf.home')}<Arrow /></a></div>
      </section>
    </Shell16>
  );
}

/* ---------------- v18: new pages ---------------- */
export function StoryPage16({ lang }: { lang: Lang }) {
  const line = worldWords().lines[1]!;
  return (
    <Shell16 lang={lang} path="/story">
      <Hero scene="story" kick={w(lang, 'st.k')} title={w(lang, 'st.h')} lead={w(lang, 'st.lead')} />
      <section className="pwrap letter">
        {[1, 2, 3].map((n) => (
          <div key={n} className="chapter"><span className="cnum" aria-hidden="true"><Roundel size={44} /><b className="num">{n}</b></span><div><h2>{w(lang, `st.${n}t`)}</h2><p>{w(lang, `st.${n}`)}</p></div></div>
        ))}
      </section>
      <section className="pwrap">
        <h2>{w(lang, 'st.4t')}</h2>
        <ul className="nolist struck">{[1, 2, 3, 4].map((n) => <li key={n}><span>{w(lang, `st.4.${n}`)}</span></li>)}</ul>
      </section>
      <section className="pwrap coupletwrap"><Couplet ur={line.ur} en={line.en} /></section>
      <section className="pwrap talk">
        <h2>{w(lang, 'st.5t')}</h2>
        <p>{w(lang, 'st.5')}</p>
        <div className="getrow"><a className="btn" href={wa} rel="noreferrer">WhatsApp <bdi dir="ltr" className="num">{PILOT_WHATSAPP.display}</bdi></a><Cta lang={lang} className="link" /></div>
        <p className="signoff">{w(lang, 'why.sign')}</p>
      </section>
    </Shell16>
  );
}

export function ProgressPage16({ lang }: { lang: Lang }) {
  return (
    <Shell16 lang={lang} path="/progress">
      <Hero scene="progress" kick={w(lang, 'prog.k')} title={w(lang, 'prog.h')} lead={w(lang, 'prog.lead')} />
      <section className="pwrap"><ProgressIsland lang={lang} w={webWords(lang)} /></section>
      <section className="pwrap">
        <h2>{w(lang, 'prog.next')}</h2>
        <ol className="miles route">{[1, 2, 3].map((n) => <li key={n} className={n === 1 ? 'now' : ''}><span className="stone num" aria-hidden="true">{n}</span><b>{w(lang, `prog.m${n}t`)}</b><p>{w(lang, `prog.m${n}`)}</p></li>)}</ol>
      </section>
      <section className="pnight"><div className="pwrap"><h2>{w(lang, 'prog.join')}</h2><div className="getrow"><Cta lang={lang} className="btn light" /></div></div></section>
    </Shell16>
  );
}

export function SchoolsPage16({ lang }: { lang: Lang }) {
  return (
    <Shell16 lang={lang} path="/schools">
      <Hero scene="schools" kick={w(lang, 'sch.k')} title={w(lang, 'sch.h')} lead={w(lang, 'sch.lead')} />
      <section className="pwrap pgrid3">
        {[1, 2, 3].map((n) => <div key={n} className="fact painted" data-tilt=""><span className="fhead"><Roundel size={30} /><span className="later">{w(lang, 'sch.later')}</span></span><h3>{w(lang, `sch.${n}t`)}</h3><p>{w(lang, `sch.${n}`)}</p></div>)}
      </section>
      <section className="pnight" id="school-form"><div className="pwrap"><h2>{w(lang, 'sch.form')}</h2><SchoolForm lang={lang} w={webWords(lang)} /></div></section>
    </Shell16>
  );
}
