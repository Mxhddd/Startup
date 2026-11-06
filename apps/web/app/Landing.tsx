// The landing page (v13 "Parat"), in either language: one school day you can scroll, tap and play.
// 1 hero (paper-cut street, lit map, the arch window) · 2 the day loop · 3 try it · 4 the van of
// promises · 5 drivers · 6 the road ahead · 7 questions · 8 get the app. Every word comes from
// packages/messages; client pieces get their words as props, so the message files stay on the server.
import { PILOT_WHATSAPP } from '@pohnch/core';
import { t, type Lang, type MessageKey } from '@pohnch/messages';
import { href } from './_lib/links';
import { DayLoop } from './_components/DayLoop';
import { DriverKeys } from './_components/DriverKeys';
import { EtaWindow } from './_components/EtaWindow';
import { LitMap } from './_components/LitMap';
import { Parallax } from './_components/Parallax';
import { PromiseVan } from './_components/PromiseVan';
import { Reveal } from './_components/Reveal';
import { Roadmap } from './_components/Roadmap';
import { Street } from './_components/Street';
import { TryIt } from './_components/TryIt';
import { Shell } from './Shell';

export const PROMISES = ['verified', 'trip', 'gone', 'names', 'seat', 'calm', 'help'] as const;

export function Landing({ lang }: { lang: Lang }) {
  const ur = lang === 'ur';
  const k = (key: string) => t(lang, key as MessageKey);
  const display = ur ? 'display-ur' : 'display-en';
  const whatsapp = `https://wa.me/${PILOT_WHATSAPP.waNumber}`;
  const parent = { van: k('site.phone.van'), driver: k('site.phone.driver'), unit: k('site.eta.min'), here: k('site.eta.here'), app: k('site.phone.push'), now: k('site.phone.now') };
  return (
    <Shell lang={lang} otherHref={ur ? '/en' : '/'}>
      {/* 1. hero */}
      <Parallax className="hero" style={{ background: 'linear-gradient(180deg, #DCE4F2 0%, #F3E6D2 55%, var(--ghee) 100%)', marginTop: -76, paddingTop: 76 }}>
        <div className="wrap hero-grid">
          <div>
            <span className="chip chip-green">{k('site.hero.badge')}</span>
            <h1 className={display}>
              <span className="t1">{k('site.hero.title1')}</span>
              <span className="t2">{k('site.hero.title2')}</span>
            </h1>
            <p className="lead">{k('site.hero.lead')}</p>
            <div className="hero-cta">
              <a className="key key-neel" href={href(lang, '/download')}>{k('site.hero.ctaApp')}</a>
              <a className="key key-sand key-stack" href={whatsapp} rel="noreferrer">
                <span>{k('site.hero.ctaChat')}</span><bdi dir="ltr" className="latin">{PILOT_WHATSAPP.display}</bdi>
              </a>
            </div>
            <a className="scroll-cue" href="#loop"><span aria-hidden="true" />{k('site.hero.scroll')}</a>
          </div>
          <div className="dio" aria-hidden="true">
            <div className="dio-map"><LitMap /></div>
            <div className="dio-street"><Street time="morning" h={190} near={false} rickshaw={false} /></div>
            <div className="dio-chip glass">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 15 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--zamurrad)', boxShadow: '0 0 0 4px rgba(23,112,90,.2)' }} />{k('site.eta.live')}
              </div>
              <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.5 }}>{k('site.phone.van')}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink2)' }}>{k('site.phone.driver')}</div>
            </div>
            <div className="dio-eta"><EtaWindow loop w={140} unit={k('site.eta.min')} here={k('site.eta.here')} uid="hero" /></div>
          </div>
        </div>
        <div className="hero-bottom"><Street time="morning" h={190} sky={false} ground="#FAF6EE" rickshaw={false} /></div>
      </Parallax>

      {/* 2. the day loop */}
      <section className="wrap" style={{ paddingTop: 40 }}>
        <Reveal className="reveal">
          <span className="kicker">{k('site.loop.kicker')}</span>
          <h2 className={`h2 ${display}`}>{k('site.loop.title')}</h2>
          <p className="lead">{k('site.loop.lead')}</p>
        </Reveal>
      </section>
      <DayLoop copy={{
        steps: [1, 2, 3, 4, 5, 6].map((n) => ({ t: k(`site.loop.${n}.t`), n: k(`site.loop.${n}.n`) })),
        home: k('site.loop.home'), school: k('site.loop.school'), hand: !ur, parent, waiting: k('site.try.waiting'),
      }} />

      {/* 3. try it */}
      <section className="section" id="try">
        <div className="wrap">
          <Reveal className="reveal" style={{ textAlign: 'center', display: 'grid', justifyItems: 'center' }}>
            <span className="kicker">{k('site.try.kicker')}</span>
            <h2 className={`h2 ${display}`}>{k('site.try.title')}</h2>
            <p className="lead">{k('site.try.lead')}</p>
          </Reveal>
          <TryIt copy={{
            driverPhone: k('site.try.driverPhone'), parentPhone: k('site.try.parentPhone'), stop: k('site.try.stop'), key: k('site.try.key'), hold: k('site.try.hold'),
            done: k('site.try.done'), undo: k('site.try.undo'), undone: k('site.try.undone'), again: k('site.try.again'), waiting: k('site.try.waiting'), push: k('site.try.push'),
            chutti: k('site.try.chutti'), chuttiDone: k('site.try.chuttiDone'), ready: k('site.try.ready'), readyDone: k('site.try.readyDone'), child: k('site.drivers.k1'),
            trip: k('site.try.trip'), parent,
          }} />
        </div>
      </section>

      {/* 4. the van of promises */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Reveal className="reveal">
            <span className="kicker">{k('site.van.kicker')}</span>
            <h2 className={`h2 ${display}`} style={{ maxWidth: 760 }}>{k('site.van.title')}</h2>
          </Reveal>
          <PromiseVan
            promises={PROMISES.map((p) => ({ front: k(`site.p.${p}`), back: k(`site.p.${p}.b`) }))}
            plate={k('site.plate')} name={k('site.van.name')} tap={k('site.van.tap')}
          />
          <a href={href(lang, '/safety')} style={{ fontWeight: 800, color: 'var(--neel)' }}>{k('site.van.more')} {ur ? '←' : '→'}</a>
        </div>
      </section>

      {/* 5. drivers */}
      <section className="wrap" id="drivers">
        <Reveal className="band lacquer reveal dark">
          <div style={{ display: 'grid', gap: 14, position: 'relative', zIndex: 2 }}>
            <span className="kicker">{k('site.drivers.kicker')}</span>
            <h2 className={`h2 ${display}`} style={{ margin: 0 }}>{k('site.drivers.title')}</h2>
            <p style={{ margin: 0, fontSize: 19 }}>{k('site.drivers.lead')}</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
              <a className="key key-kesar" href={whatsapp} rel="noreferrer" style={{ height: 56, padding: '0 22px', fontSize: 17 }}>{k('site.drivers.cta')}</a>
              <a className="key key-ghost" href={href(lang, '/drivers')} style={{ height: 56, padding: '0 22px', fontSize: 17 }}>{k('site.drivers.more')}</a>
            </div>
          </div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <DriverKeys k1={k('site.drivers.k1')} k2={k('site.drivers.k2')} k3={k('site.drivers.k3')} rail={k('site.drivers.rail')} />
          </div>
        </Reveal>
      </section>

      {/* 6. the road ahead */}
      <section className="section">
        <div className="wrap">
          <Roadmap kicker={k('site.road.kicker')} title={k('site.road.title')} here={k('site.road.here')} hand={!ur}
            years={[{ y: '2026', t: k('site.road.y1') }, { y: '2027', t: k('site.road.y2') }, { y: '2028', t: k('site.road.y3') }]} />
        </div>
      </section>

      {/* 7. questions */}
      <section className="wrap" id="faq">
        <Reveal className="reveal">
          <h2 className={`h2 ${display}`}>{k('site.faq.title')}</h2>
        </Reveal>
        <div className="faq">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <details key={n} className="paper-1">
              <summary>{k(`site.faq.${n}.q`)}</summary>
              <p>{k(`site.faq.${n}.a`)}{n === 8 ? <> <a href={href(lang, '/delete-account')} style={{ color: 'var(--neel)', fontWeight: 800 }}>{k('site.foot.delete')}</a></> : null}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 8. get the app */}
      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <Reveal className="paper-3 reveal" style={{ borderRadius: 40, padding: 'clamp(26px, 5vw, 56px)', display: 'grid', gap: 18, justifyItems: 'center', textAlign: 'center' }}>
            <span className="kicker">{k('site.dl.kicker')}</span>
            <h2 className={`h2 ${display}`} style={{ margin: 0 }}>{k('site.dl.title')}</h2>
            <p className="lead">{k('site.dl.lead')}</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <a className="key key-green" href={whatsapp} rel="noreferrer" style={{ height: 60, padding: '0 24px', fontSize: 18 }}>{k('site.dl.join')}</a>
              <a className="key key-sand" href={href(lang, '/download')} style={{ height: 60, padding: '0 24px', fontSize: 18 }}>{k('site.nav.download')}</a>
            </div>
          </Reveal>
        </div>
      </section>
    </Shell>
  );
}
