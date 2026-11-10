'use client';
// The home page's city journey (client side, v15). Renders the top line with chapters, the stage with
// the parent's phone (app and lock screen), the night panel (join, waiting map, driver kit, why we
// built this, questions, footer), the stop rail, the phone bottom bar and the "Play the day" bar.
// startJourney() (engine.ts) draws the map and runs the scenes and roads. On a slow or low-memory
// phone (or Save-Data) the moving city never starts: the same story shows as a calm page ("lite").
// Every word arrives as props from the server, in one language.
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { AreaId } from '@pohnch/core';
import { startJourney } from './engine';
import type { Road, SceneId } from './roads';
import { DriverKit, JoinForm, Proof, WaitingMap, useSummary, type Area, type Words } from './Panel';
import { countDoubt } from '../_lib/interest';
import './journey.css';

export type JourneyProps = {
  lang: 'ur' | 'en';
  w: Words;
  areas: Area[];
  nav: { switchLang: string; otherHref: string; home: string; homeHref: string; download: string };
  links: { safety: string; drivers: string; privacy: string; terms: string; delete: string; download: string };
  foot: { safety: string; drivers: string; privacy: string; terms: string; delete: string; whatsapp: string; whatsappHref: string; whatsappNumber: string };
  qa: [string, string][];
  /** The whole story as an article: read by screen readers and search engines, and shown as the page in lite/reading mode. */
  story: ReactNode;
};

const Arrow = () => (
  <svg width="22" height="12" viewBox="0 0 22 12" aria-hidden="true"><path d="M1 6h19M15 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const WaIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M9 9.5c.3 1.7 2 3.7 4.5 4.5l1.2-1.2 1.8.8-.3 1.6c-3.5.4-7.8-3.5-7.6-7.2l1.6-.3.8 1.8z" fill="currentColor" /></svg>
);
// where the chapter links lead in the reading (lite) page
const READ_TARGET: Record<string, string> = { how: 'r-how', promises: 'r-safe', drvCalls: 'r-drivers', end: 'join' };

function isLite(): boolean {
  if (typeof window === 'undefined') return false;
  if (/[?&]lite\b/.test(location.search)) return true;
  const n = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string }; deviceMemory?: number };
  return !!n.connection?.saveData || (typeof n.deviceMemory === 'number' && n.deviceMemory <= 2) || /(^|-)2g$/.test(n.connection?.effectiveType ?? '');
}

export function Journey({ lang, w, areas, nav, links, foot, qa, story }: JourneyProps) {
  const root = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [reading, setReading] = useState(false);
  const [engineOn, setEngineOn] = useState(true);
  const [road, setRoad] = useState<Road | null>(null);
  const [role, setRole] = useState<'parent' | 'driver'>('parent');
  const [scene, setScene] = useState<SceneId>('hero');
  const [menu, setMenu] = useState(false);
  const [mine, setMine] = useState<AreaId | null>(null);
  const summary = useSummary(scene === 'end' || reading);
  const share = `https://wa.me/?text=${encodeURIComponent(w['share.text'] ?? '')}`;

  // decide once, in the browser, whether this phone gets the moving city or the calm page
  useEffect(() => { const lite = isLite(); setReading(lite); setEngineOn(!lite); setReady(true); }, []);
  useEffect(() => {
    if (!ready || !engineOn || !root.current) return;
    return startJourney(root.current, w, lang, {
      onRoad: (r) => { setRoad(r); setRole(r === 'driver' ? 'driver' : 'parent'); },
      onScene: (id) => setScene(id),
      onDoubt: countDoubt,
      onRole: setRole,
    });
  }, [ready, engineOn, w, lang]);
  useEffect(() => {
    const html = document.documentElement;
    if (reading) html.classList.remove('jr-lock'); else if (engineOn && ready) html.classList.add('jr-lock');
  }, [reading, engineOn, ready]);

  function read(on: boolean) {
    setMenu(false);
    // the map's day/night colours are set on the page while it runs; the reading page has its own
    if (on && root.current) { root.current.removeAttribute('style'); root.current.classList.remove('night'); }
    setReading(on);
    if (!on) setEngineOn(true);
    window.scrollTo({ top: 0 });
  }
  // in the reading page the chapter links scroll to the matching part of the article
  function chapter(e: React.MouseEvent) {
    setMenu(false);
    if (!reading) return;
    const a = (e.target as Element).closest('[data-go]') as HTMLElement | null;
    if (!a) return;
    e.preventDefault();
    const id = a.dataset.anchor ?? READ_TARGET[a.dataset.go ?? ''] ?? '';
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  const dir = lang === 'ur' ? 'rtl' : 'ltr';
  const chapters = (
    <>
      <a href="#r-how" data-go="how" onClick={chapter}>{w['nav.how']}</a>
      <a href="#r-safe" data-go="promises" onClick={chapter}>{w['nav.safety']}</a>
      <a href="#r-drivers" data-go="drvCalls" onClick={chapter}>{w['nav.drivers']}</a>
      <a href="#questions" data-go="end" data-anchor="questions" onClick={chapter}>{w['nav.questions']}</a>
    </>
  );
  const cls = ['jr', reading ? 'reading' : '', menu ? 'menu-open' : '', `at-${scene}`].filter(Boolean).join(' ');
  return (
    <main ref={root} className={cls} lang={lang} dir={dir} data-lang={lang} data-chosen={road ?? 'none'}>
      <header className="top">
        <a className="mark" href={nav.homeHref} aria-label={nav.home}><b>پہنچ</b><span>Pohnch<i /></span></a>
        <nav className="links" aria-label={nav.home}>{chapters}</nav>
        <button className="readb" type="button" onClick={() => read(!reading)}>{reading ? w['nav.map'] : w['nav.read']}</button>
        <a className="lang" href={nav.otherHref} hrefLang={lang === 'ur' ? 'en' : 'ur'} lang={lang === 'ur' ? 'en' : 'ur'}>{nav.switchLang}</a>
        <a className="pill" href="#join" data-go="end" data-anchor="join" onClick={chapter}>{w.cta}</a>
        <button className="menub" type="button" aria-expanded={menu} aria-controls="menu" onClick={() => setMenu(!menu)}>{menu ? w['nav.close'] : w['nav.menu']}</button>
      </header>
      <nav className="menu" id="menu" aria-label={w['nav.menu']} hidden={!menu}>
        {chapters}
        <a href="#join" data-go="end" data-anchor="join" onClick={chapter}>{w.cta}</a>
        <button type="button" onClick={() => read(!reading)}>{reading ? w['nav.map'] : w['nav.read']}</button>
      </nav>

      <article className="sr story" data-testid="story">{story}</article>

      <section className="stage" id="stage" aria-label={w.label} tabIndex={-1} data-testid="stage">
        <canvas id="world" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        <div id="pins" />
        <div className="phone" id="phone" aria-hidden="true">
          <div className="tilt">
            <div className="screen">
              <div className="isl"><i /><span id="islT" className="num" /></div>
              <svg className="m" viewBox="0 0 250 360" preserveAspectRatio="xMidYMid slice">
                <rect width="250" height="360" fill="#E9DDC6" />
                <g fill="#DCCBAA"><rect x="12" y="12" width="70" height="60" rx="3" /><rect x="104" y="18" width="56" height="50" rx="3" /><rect x="176" y="12" width="64" height="64" rx="3" /><rect x="12" y="120" width="60" height="70" rx="3" /><rect x="176" y="124" width="64" height="58" rx="3" /><rect x="104" y="214" width="58" height="60" rx="3" /><rect x="12" y="236" width="64" height="60" rx="3" /></g>
                <g stroke="#F7F1E6" strokeWidth="14"><path d="M0 98 H250 M0 206 H250 M92 0 V360 M168 0 V360" /></g>
                <path id="pr" d="M20 360 C 40 300 80 260 92 206 S 150 140 168 98 S 200 60 210 40" stroke="#1F2A5C" strokeWidth="7" fill="none" strokeLinecap="round" />
                <path id="prd" d="M20 360 C 40 300 80 260 92 206 S 150 140 168 98 S 200 60 210 40" stroke="#E8A33D" strokeWidth="2.5" fill="none" strokeDasharray="2 10" strokeLinecap="round" />
                <circle cx="210" cy="40" r="9" fill="#17705A" stroke="#fff" strokeWidth="3" />
                <g id="php"><circle r="10" fill="#17705A" stroke="#fff" strokeWidth="3" /><path className="x" d="M-6 -6 L6 6 M6 -6 L-6 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" /></g>
                <g id="pvan"><rect x="-9" y="-15" width="18" height="30" rx="6" fill="#1F2A5C" stroke="#fff" strokeWidth="2.5" /><rect x="-2" y="-4" width="4" height="12" rx="2" fill="#E8A33D" /></g>
              </svg>
              <div className="push" id="push">
                <span className="ic"><svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#E8A33D" /></svg></span>
                <div style={{ minWidth: 0 }}><b>پہنچ · <span className="num" style={{ display: 'inline', fontWeight: 600 }}>{w.now}</span></b><span id="pusht" /></div>
              </div>
              <div className="slab">
                <div className="grab" />
                <div className="row">
                  <svg width="78" height="90" viewBox="0 0 78 90" style={{ flex: 'none', overflow: 'visible' }}>
                    <defs><radialGradient id="ag" cx="50%" cy="78%" r="80%"><stop offset="0" stopColor="#FFF4DC" /><stop offset=".45" stopColor="#F6C46E" /><stop offset="1" stopColor="#E8A33D" /></radialGradient></defs>
                    <path d="M2 88 L2 38 C2 17 23 7 39 2 C55 7 76 17 76 38 L76 88 Z" fill="url(#ag)" stroke="#D9B26A" strokeWidth="2" />
                    <text id="eta" x="39" y="62" textAnchor="middle" fontFamily="Manrope, sans-serif" fontWeight="800" fontSize="34" fill="#10162F">6</text>
                    <text id="etu" x="39" y="80" textAnchor="middle" fontWeight="700" fontSize="13" fill="#10162F" />
                    <path id="tick" d="M26 50 l9 9 l17 -19" fill="none" stroke="#0B4A3D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="40" strokeDashoffset="40" style={{ transition: 'stroke-dashoffset .6s ease .2s' }} />
                  </svg>
                  <div className="t"><b id="ptitle" /><span id="psub">{w.driver}</span></div>
                </div>
                <div className="stones" id="stones">{[0, 1, 2, 3, 4, 5].map((k) => <i key={k} style={{ ['--k' as string]: k }} />)}</div>
              </div>
              {/* the lock screen at your door: iPhone Live Activity or Android ongoing notification */}
              <div className="lock">
                <div className="lk-day">{w['door.day']}</div>
                <div className="lk-time num">7:09</div>
                <div className="la ios">
                  <div className="la-top"><span className="lm">پہنچ</span><span>{w['door.van']}</span></div>
                  <div className="la-eta"><b id="laEta" className="num">3</b><span id="laUnit">{w.unit}</span></div>
                  <div className="la-bar"><i /><span className="vdot" /><span className="hdot" /></div>
                </div>
                <div className="la android">
                  <div className="an-top"><span className="lm">پہنچ</span><span>Pohnch · {w.now}</span></div>
                  <b id="andT">{w['door.away']}</b>
                  <div className="la-bar"><i /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="veil" id="veil" />
      </section>

      <section className="panel" id="panel" aria-label={w['rail.end']}>
        <div className="inner2">
          <div className="wrap">
            <div className="joinwrap" id="join">
              <div className="jl">
                <span className="kick">{w['rail.end']}</span>
                <h2>{role === 'driver' ? w['join.titleDriver'] : w['join.title']}</h2>
                <p>{w['join.lead']}</p>
                <a className="go share" href={share} target="_blank" rel="noreferrer"><WaIcon />{w['share.btn']}<Arrow /></a>
              </div>
              <JoinForm w={w} lang={lang} areas={areas} role={role} setRole={setRole} onJoined={setMine} wa={foot.whatsappHref} />
            </div>
            <div className="waitwrap">
              <h2 className="h3">{w['wait.title']}</h2>
              <WaitingMap w={w} areas={areas} summary={summary} mine={mine} />
            </div>
            <div className="two">
              <div className="kitwrap">
                <h2 className="h3">{w['kit.title']}</h2>
                <p>{w['kit.lead']}</p>
                <DriverKit w={w} lang={lang} />
              </div>
              <div className="why">
                <h2 className="h3">{w['why.title']}</h2>
                <blockquote>{w['why.body']}</blockquote>
                <cite>{w['why.sign']}</cite>
                <Proof w={w} proof={summary.proof} />
              </div>
            </div>
            <div id="questions">
              <h2>{w['faq.title']}</h2>
              <div className="qa">{qa.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
            </div>
            <footer>
              <div style={{ display: 'grid', gap: 10 }}>
                <span className="mark"><b>پہنچ</b><span>Pohnch<i /></span></span>
                <button className="go back" type="button" data-go="hero"><span>{w.again}</span></button>
              </div>
              <nav aria-label={nav.home}>
                <a href={links.safety}>{foot.safety}</a><a href={links.drivers}>{foot.drivers}</a><a href={links.download}>{nav.download}</a><a href={links.privacy}>{foot.privacy}</a><a href={links.terms}>{foot.terms}</a><a href={links.delete}>{foot.delete}</a>
                <a href={foot.whatsappHref} rel="noreferrer">{foot.whatsapp} <bdi dir="ltr" className="num">{foot.whatsappNumber}</bdi></a>
              </nav>
            </footer>
          </div>
        </div>
      </section>

      <nav className="rail" id="rail" aria-label={w.label} />
      <div className="prog" aria-hidden="true"><i id="progI" /></div>
      <button className="next" id="next" type="button"><span className="m" aria-hidden="true" /><span className="label">{w.next}</span></button>
      <div className="bbar" inert={scene === 'hero' || scene === 'end' || reading}>
        <a className="pill" href="#join" data-go="end" data-anchor="join">{w.cta}</a>
        <a className="wa" href={foot.whatsappHref} rel="noreferrer" aria-label={foot.whatsapp}><WaIcon /><span>WhatsApp</span></a>
      </div>
      <div className="playbar"><span className="dot" aria-hidden="true" /><span>{w.play}</span><button type="button" data-pause>{w.pause}</button></div>
    </main>
  );
}
