// The inner pages (v14), in either language: drivers, safety, download, delete account, terms. Each is
// an editorial page on ivory paper: the van drawing, a big title, gilt rules, numbered steps, no boxes.
// Words from packages/messages.
import { PILOT_WHATSAPP } from '@pohnch/core';
import { t, type Lang, type MessageKey } from '@pohnch/messages';
import { href } from './_lib/links';
import { PageHead } from './_components/PageHead';
import { Shell } from './Shell';

const wa = `https://wa.me/${PILOT_WHATSAPP.waNumber}`;
const k = (lang: Lang, key: string) => t(lang, key as MessageKey);
const other = (lang: Lang, path: string) => (lang === 'ur' ? `/en${path}` : path);
export const PROMISES = ['verified', 'trip', 'gone', 'names', 'seat', 'calm', 'help'] as const;
const Arrow = () => <svg width="22" height="12" viewBox="0 0 22 12" aria-hidden="true"><path d="M1 6h19M15 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;

export function DriversPage({ lang }: { lang: Lang }) {
  return (
    <Shell lang={lang} otherHref={other(lang, '/drivers')}>
      <PageHead title={k(lang, 'site.drv.title')} lead={k(lang, 'site.drv.lead')} />
      <div className="ed-wrap">
        <hr />
        <div className="facts">
          {[1, 2, 3, 4].map((n) => <div key={n}><h3>{k(lang, `site.drv.f${n}.t`)}</h3><p>{k(lang, `site.drv.f${n}.b`)}</p></div>)}
        </div>
        <hr />
        <h2>{k(lang, 'site.drv.how.title')}</h2>
        <ol className="steps" style={{ marginTop: 24 }}>{[1, 2, 3].map((n) => <li key={n}>{k(lang, `site.drv.how.${n}`)}</li>)}</ol>
        <div className="cta-row">
          <a className="pill" href={wa} rel="noreferrer">{k(lang, 'site.drivers.cta')} <bdi dir="ltr" className="num">{PILOT_WHATSAPP.display}</bdi></a>
          <a className="go" href={href(lang, '/')}>{k(lang, 'journey.again')}<Arrow /></a>
        </div>
      </div>
    </Shell>
  );
}

export function SafetyPage({ lang }: { lang: Lang }) {
  return (
    <Shell lang={lang} otherHref={other(lang, '/safety')}>
      <PageHead title={k(lang, 'site.safety.title')} lead={k(lang, 'site.safety.lead')} />
      <div className="ed-wrap">
        <hr />
        <div className="facts">
          {PROMISES.map((p) => <div key={p}><h3>{k(lang, `site.p.${p}`)}</h3><p>{k(lang, `site.p.${p}.b`)}</p></div>)}
        </div>
        <hr />
        <div className="prose">
          <h2>{k(lang, 'site.safety.never')}</h2>
          <p>{k(lang, 'privacy.never.body')}</p>
        </div>
        <div className="cta-row"><a className="go" href={href(lang, '/privacy')}>{k(lang, 'site.safety.policy')}<Arrow /></a></div>
      </div>
    </Shell>
  );
}

export function DownloadPage({ lang }: { lang: Lang }) {
  const app = (name: string) => (
    <div>
      <h3>{name}</h3>
      <div className="stores"><span>{k(lang, 'site.dl.play')} · {k(lang, 'site.dl.apple')}</span><span className="soon">{k(lang, 'site.dl.soon')}</span></div>
    </div>
  );
  return (
    <Shell lang={lang} otherHref={other(lang, '/download')}>
      <PageHead title={k(lang, 'site.dl.kicker')} lead={k(lang, 'site.dl.lead')} />
      <div className="ed-wrap">
        <hr />
        <div className="facts">{app(k(lang, 'site.dl.parentApp'))}{app(k(lang, 'site.dl.driverApp'))}</div>
        <hr />
        <h2>{k(lang, 'site.dl.steps.title')}</h2>
        <ol className="steps" style={{ marginTop: 24 }}>{[1, 2, 3].map((n) => <li key={n}>{k(lang, `site.dl.step${n}`)}</li>)}</ol>
        <div className="cta-row"><a className="pill" href={wa} rel="noreferrer">{k(lang, 'site.dl.join')}</a></div>
      </div>
    </Shell>
  );
}

export function DeletePage({ lang }: { lang: Lang }) {
  return (
    <Shell lang={lang} otherHref={other(lang, '/delete-account')}>
      <PageHead title={k(lang, 'site.del.title')} lead={k(lang, 'site.del.lead')} />
      <div className="ed-wrap">
        <hr />
        <ol className="steps">
          <li>{k(lang, 'site.del.parent')}</li>
          <li>{k(lang, 'site.del.driver')}</li>
          <li><span>{k(lang, 'site.del.noApp')} <a href={wa} rel="noreferrer" style={{ fontWeight: 800 }}><bdi dir="ltr" className="num">{PILOT_WHATSAPP.display}</bdi></a></span></li>
        </ol>
        <hr />
        <div className="prose">
          <section><h2>{k(lang, 'site.del.what.title')}</h2><p>{k(lang, 'site.del.what')}</p></section>
          <section><h2>{k(lang, 'site.del.keep.title')}</h2><p>{k(lang, 'site.del.keep')}</p></section>
        </div>
      </div>
    </Shell>
  );
}

export function TermsPage({ lang }: { lang: Lang }) {
  return (
    <Shell lang={lang} otherHref={other(lang, '/terms')}>
      <PageHead title={k(lang, 'site.terms.title')} lead={k(lang, 'site.terms.updated')} />
      <div className="ed-wrap">
        <hr />
        <article className="prose">
          {[1, 2, 3, 4, 5, 6].map((n) => <section key={n}><h2>{k(lang, `site.terms.${n}.t`)}</h2><p>{k(lang, `site.terms.${n}.b`)}</p></section>)}
        </article>
      </div>
    </Shell>
  );
}
