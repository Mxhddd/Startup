// The inner pages (v13), in either language: drivers, safety, download, delete account, terms.
// Each is a short paper-cut street with the title, then paper cards. Words from packages/messages.
import { PILOT_WHATSAPP } from '@pohnch/core';
import { t, type Lang, type MessageKey } from '@pohnch/messages';
import { PROMISES } from './Landing';
import { href } from './_lib/links';
import { PageHead } from './_components/PageHead';
import { Shell } from './Shell';

const wa = `https://wa.me/${PILOT_WHATSAPP.waNumber}`;
const k = (lang: Lang, key: string) => t(lang, key as MessageKey);
const other = (lang: Lang, path: string) => (lang === 'ur' ? `/en${path}` : path);

export function DriversPage({ lang }: { lang: Lang }) {
  const ur = lang === 'ur';
  return (
    <Shell lang={lang} otherHref={other(lang, '/drivers')}>
      <PageHead title={k(lang, 'site.drv.title')} ur={ur} time="evening" />
      <div className="wrap section" style={{ paddingTop: 40 }}>
        <p className="lead">{k(lang, 'site.drv.lead')}</p>
        <div className="cards">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="card paper"><h3>{k(lang, `site.drv.f${n}.t`)}</h3><p>{k(lang, `site.drv.f${n}.b`)}</p></div>
          ))}
        </div>
        <h2 className="h2" style={{ fontSize: 30 }}>{k(lang, 'site.drv.how.title')}</h2>
        <ol className="steps">{[1, 2, 3].map((n) => <li key={n}>{k(lang, `site.drv.how.${n}`)}</li>)}</ol>
        <p style={{ marginTop: 28 }}><a className="key key-kesar" href={wa} rel="noreferrer" style={{ height: 60, padding: '0 24px', fontSize: 18 }}>{k(lang, 'site.drivers.cta')} <bdi dir="ltr" className="latin">{PILOT_WHATSAPP.display}</bdi></a></p>
      </div>
    </Shell>
  );
}

export function SafetyPage({ lang }: { lang: Lang }) {
  const ur = lang === 'ur';
  return (
    <Shell lang={lang} otherHref={other(lang, '/safety')}>
      <PageHead title={k(lang, 'site.safety.title')} ur={ur} time="noon" />
      <div className="wrap section" style={{ paddingTop: 40 }}>
        <p className="lead">{k(lang, 'site.safety.lead')}</p>
        <div className="cards">
          {PROMISES.map((p) => (
            <div key={p} className="card paper"><h3>{k(lang, `site.p.${p}`)}</h3><p>{k(lang, `site.p.${p}.b`)}</p></div>
          ))}
        </div>
        <div className="card pressed" style={{ maxWidth: 760 }}>
          <h3>{k(lang, 'site.safety.never')}</h3>
          <p style={{ color: 'var(--siyahi)' }}>{k(lang, 'privacy.never.body')}</p>
        </div>
        <p style={{ marginTop: 24 }}><a href={href(lang, '/privacy')} style={{ color: 'var(--neel)', fontWeight: 800 }}>{k(lang, 'site.safety.policy')}</a></p>
      </div>
    </Shell>
  );
}

export function DownloadPage({ lang }: { lang: Lang }) {
  const ur = lang === 'ur';
  const app = (name: string, dark: boolean) => (
    <div className="app-card paper">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className="app-icon lacquer" aria-hidden="true" style={{ display: 'grid', placeItems: 'center', background: dark ? undefined : 'linear-gradient(160deg,#F4BF66,#E8A33D)' }}>
          <svg width="34" height="34" viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" fill={dark ? '#E8A33D' : '#1F2A5C'} /><rect x="5" y="5" width="14" height="14" fill={dark ? '#E8A33D' : '#1F2A5C'} transform="rotate(45 12 12)" /><circle cx="12" cy="12" r="3.4" fill={dark ? '#1F2A5C' : '#F4BF66'} /></svg>
        </span>
        <b style={{ fontSize: 20 }}>{name}</b>
      </div>
      <div className="store">
        <span className="key key-sand" aria-disabled="true" style={{ cursor: 'default' }}>{k(lang, 'site.dl.play')} <span className="badge-soon">{k(lang, 'site.dl.soon')}</span></span>
        <span className="key key-sand" aria-disabled="true" style={{ cursor: 'default' }}>{k(lang, 'site.dl.apple')} <span className="badge-soon">{k(lang, 'site.dl.soon')}</span></span>
      </div>
    </div>
  );
  return (
    <Shell lang={lang} otherHref={other(lang, '/download')}>
      <PageHead title={k(lang, 'site.dl.kicker')} ur={ur} time="morning" />
      <div className="wrap section" style={{ paddingTop: 40 }}>
        <p className="lead">{k(lang, 'site.dl.lead')}</p>
        <div className="apps">{app(k(lang, 'site.dl.parentApp'), true)}{app(k(lang, 'site.dl.driverApp'), false)}</div>
        <div className="card paper" style={{ marginTop: 28, maxWidth: 760 }}>
          <h3>{k(lang, 'site.dl.steps.title')}</h3>
          <ol className="steps" style={{ marginTop: 14 }}>{[1, 2, 3].map((n) => <li key={n}>{k(lang, `site.dl.step${n}`)}</li>)}</ol>
          <p style={{ marginTop: 20 }}><a className="key key-green" href={wa} rel="noreferrer" style={{ height: 56, padding: '0 22px', fontSize: 17 }}>{k(lang, 'site.dl.join')}</a></p>
        </div>
      </div>
    </Shell>
  );
}

export function DeletePage({ lang }: { lang: Lang }) {
  const ur = lang === 'ur';
  return (
    <Shell lang={lang} otherHref={other(lang, '/delete-account')}>
      <PageHead title={k(lang, 'site.del.title')} ur={ur} time="noon" />
      <div className="wrap section prose" style={{ paddingTop: 40 }}>
        <p className="lead">{k(lang, 'site.del.lead')}</p>
        <ol className="steps" style={{ marginTop: 24 }}>
          <li>{k(lang, 'site.del.parent')}</li>
          <li>{k(lang, 'site.del.driver')}</li>
          <li>{k(lang, 'site.del.noApp')} <a href={wa} rel="noreferrer" style={{ color: 'var(--neel)', fontWeight: 800 }}><bdi dir="ltr" className="latin">{PILOT_WHATSAPP.display}</bdi></a></li>
        </ol>
        <h2>{k(lang, 'site.del.what.title')}</h2>
        <p>{k(lang, 'site.del.what')}</p>
        <h2>{k(lang, 'site.del.keep.title')}</h2>
        <p>{k(lang, 'site.del.keep')}</p>
      </div>
    </Shell>
  );
}

export function TermsPage({ lang }: { lang: Lang }) {
  const ur = lang === 'ur';
  return (
    <Shell lang={lang} otherHref={other(lang, '/terms')}>
      <PageHead title={k(lang, 'site.terms.title')} ur={ur} time="evening" />
      <article className="wrap section prose" style={{ paddingTop: 40 }}>
        <p style={{ color: 'var(--ink2)', fontSize: 15 }}>{k(lang, 'site.terms.updated')}</p>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <section key={n}><h2>{k(lang, `site.terms.${n}.t`)}</h2><p>{k(lang, `site.terms.${n}.b`)}</p></section>
        ))}
      </article>
    </Shell>
  );
}
