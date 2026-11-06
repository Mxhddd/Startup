'use client';
// The home page's city journey (client side). Renders the stage, the phone, the night panel, the
// stop rail and the top line; startJourney() (engine.ts) draws the map and runs the scenes, and is
// stopped when you leave the page. Every word arrives as props from the server (copy), in one language.
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { startJourney, type JourneyCopy } from './engine';
import './journey.css';

export type JourneyProps = {
  lang: 'ur' | 'en';
  copy: JourneyCopy;
  nav: { safety: string; drivers: string; questions: string; switchLang: string; otherHref: string; home: string; homeHref: string; download: string };
  links: { safety: string; drivers: string; privacy: string; terms: string; delete: string; download: string };
  foot: { safety: string; drivers: string; privacy: string; terms: string; delete: string; whatsapp: string; whatsappHref: string; whatsappNumber: string };
  qa: [string, string][];
  /** The scenes as plain text, for screen readers and search engines (the canvas words are decoration). */
  story: ReactNode;
};

const Arrow = () => (
  <svg width="22" height="12" viewBox="0 0 22 12" aria-hidden="true"><path d="M1 6h19M15 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export function Journey({ lang, copy, nav, links, foot, qa, story }: JourneyProps) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!root.current) return;
    return startJourney(root.current, copy, lang);
  }, [copy, lang]);
  const dir = lang === 'ur' ? 'rtl' : 'ltr';
  return (
    <main ref={root} className="jr" lang={lang} dir={dir} data-lang={lang}>
      <article className="sr">{story}</article>
      <header className="top">
        <a className="mark" href={nav.homeHref} aria-label={nav.home}><b>پہنچ</b><span>Pohnch<i /></span></a>
        <nav className="links" aria-label={nav.home}>
          <a href={links.safety}>{nav.safety}</a>
          <a href={links.drivers}>{nav.drivers}</a>
          <a href="#questions" data-stop="7">{nav.questions}</a>
        </nav>
        <a className="lang" href={nav.otherHref} hrefLang={lang === 'ur' ? 'en' : 'ur'} lang={lang === 'ur' ? 'en' : 'ur'}>{nav.switchLang}</a>
        <a className="pill" href={links.download}>{nav.download}</a>
      </header>

      <section className="stage" id="stage" aria-label={copy.label} tabIndex={-1} data-testid="stage">
        <canvas id="world" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        <div id="pins" />
        <div className="phone" id="phone" aria-hidden="true">
          <div className="tilt">
            <div className="screen">
              <div className="isl" />
              <svg className="m" viewBox="0 0 250 360" preserveAspectRatio="xMidYMid slice">
                <rect width="250" height="360" fill="#E9DDC6" />
                <g fill="#DCCBAA"><rect x="12" y="12" width="70" height="60" rx="3" /><rect x="104" y="18" width="56" height="50" rx="3" /><rect x="176" y="12" width="64" height="64" rx="3" /><rect x="12" y="120" width="60" height="70" rx="3" /><rect x="176" y="124" width="64" height="58" rx="3" /><rect x="104" y="214" width="58" height="60" rx="3" /><rect x="12" y="236" width="64" height="60" rx="3" /></g>
                <g stroke="#F7F1E6" strokeWidth="14"><path d="M0 98 H250 M0 206 H250 M92 0 V360 M168 0 V360" /></g>
                <path id="pr" d="M20 360 C 40 300 80 260 92 206 S 150 140 168 98 S 200 60 210 40" stroke="#1F2A5C" strokeWidth="7" fill="none" strokeLinecap="round" />
                <path id="prd" d="M20 360 C 40 300 80 260 92 206 S 150 140 168 98 S 200 60 210 40" stroke="#E8A33D" strokeWidth="2.5" fill="none" strokeDasharray="2 10" strokeLinecap="round" />
                <circle cx="210" cy="40" r="9" fill="#17705A" stroke="#fff" strokeWidth="3" />
                <g id="pvan"><rect x="-9" y="-15" width="18" height="30" rx="6" fill="#1F2A5C" stroke="#fff" strokeWidth="2.5" /><rect x="-2" y="-4" width="4" height="12" rx="2" fill="#E8A33D" /></g>
              </svg>
              <div className="push" id="push">
                <span className="ic"><svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#E8A33D" /></svg></span>
                <div style={{ minWidth: 0 }}><b>پہنچ · <span className="num" style={{ display: 'inline', fontWeight: 600 }}>{copy.now}</span></b><span id="pusht" /></div>
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
                  <div className="t"><b id="ptitle" /><span>{copy.driver}</span></div>
                </div>
                <div className="stones" id="stones">{[0, 1, 2, 3, 4, 5].map((k) => <i key={k} style={{ ['--k' as string]: k }} />)}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="veil" id="veil" />
      </section>

      <section className="panel" id="panel" aria-label={copy['faq.title']}>
        <div className="inner2">
          <div className="wrap">
            <div id="questions">
              <h2>{copy['faq.title']}</h2>
              <div className="qa">{qa.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
            </div>
            <div className="get" id="get">
              <div><h2 style={{ marginBottom: 12 }}>{copy['get.title']}</h2><p>{copy['get.lead']}</p></div>
              <div style={{ display: 'grid', gap: 22 }}>
                <div className="stores"><a className="pill" href={foot.whatsappHref} rel="noreferrer">{copy['get.join']}</a><span>{copy['get.soon']}</span></div>
                <a className="go" href={links.drivers}><span>{copy['get.drivers']}</span><Arrow /></a>
              </div>
            </div>
            <footer>
              <div style={{ display: 'grid', gap: 10 }}>
                <span className="mark"><b>پہنچ</b><span>Pohnch<i /></span></span>
                <button className="go back" type="button" data-stop="0"><span>{copy.again}</span></button>
              </div>
              <nav aria-label={nav.home}>
                <a href={links.safety}>{foot.safety}</a><a href={links.drivers}>{foot.drivers}</a><a href={links.privacy}>{foot.privacy}</a><a href={links.terms}>{foot.terms}</a><a href={links.delete}>{foot.delete}</a>
                <a href={foot.whatsappHref} rel="noreferrer">{foot.whatsapp} <bdi dir="ltr" className="num">{foot.whatsappNumber}</bdi></a>
              </nav>
            </footer>
          </div>
        </div>
      </section>

      <nav className="rail" id="rail" aria-label={copy.label} />
      <div className="prog" aria-hidden="true"><i id="progI" /></div>
      <button className="next" id="next" type="button"><span className="m" aria-hidden="true" /><span className="label">{copy.next}</span></button>
    </main>
  );
}
