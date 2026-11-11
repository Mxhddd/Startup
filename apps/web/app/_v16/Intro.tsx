'use client';
// The opening logo moment on pohnch.pk (v17). A deep neel layer covers the page from the very first
// paint (it is in the server's HTML): the route dots travel into the kesar star, the centre dot lands,
// پہنچ writes itself right to left, "Pohnch" rises letter by letter, a gold shimmer sweeps across, and
// the layer opens from the star outwards to show the page. Full (~2.5 s) on a first visit, 0.6 s
// after that, never with reduced motion; any tap, click, scroll or key skips it. Without JavaScript
// the CSS timing alone opens it after ~2.6 s. The rules live in introRules.ts.
import { useEffect, useState } from 'react';
import { INTRO_KEY, introMode, markSeen, readSeen, type IntroMode } from './introRules';
import { TS } from './Demos';

let decided: IntroMode | null = null;

export function Intro({ skipLabel }: { skipLabel: string }) {
  const [phase, setPhase] = useState<'full' | 'short' | 'leaving' | 'gone'>('full');
  useEffect(() => {
    let store: Storage | null = null;
    try { store = window.localStorage; } catch { store = null; }
    // decided once per page load (React may run this effect twice in development)
    decided ??= introMode(matchMedia('(prefers-reduced-motion: reduce)').matches, readSeen(store));
    const mode = decided;
    markSeen(store);
    if (mode === 'none') { setPhase('gone'); return; }
    if (mode === 'short') setPhase('short');
    const leave = () => setPhase((p) => (p === 'gone' ? p : 'leaving'));
    const t = setTimeout(leave, (mode === 'short' ? 450 : 2000) / TS);
    const opts = { passive: true, once: true } as const;
    addEventListener('pointerdown', leave, opts); addEventListener('wheel', leave, opts); addEventListener('touchstart', leave, opts); addEventListener('keydown', leave, opts);
    return () => { clearTimeout(t); removeEventListener('pointerdown', leave); removeEventListener('wheel', leave); removeEventListener('touchstart', leave); removeEventListener('keydown', leave); };
  }, []);
  useEffect(() => { if (phase !== 'leaving') return; const t = setTimeout(() => setPhase('gone'), 750 / TS); return () => clearTimeout(t); }, [phase]);
  if (phase === 'gone') return null;
  return (
    <div className={`intro ${phase}`} data-testid="intro" data-key={INTRO_KEY} role="presentation">
      <div className="intro-mark" aria-hidden="true">
        <svg className="logo" viewBox="0 0 200 120" width="200" height="120">
          <path className="trail" d="M12 108 C 40 108 48 78 68 70 S 92 56 100 46" fill="none" />
          <circle className="dot d1" r="5" /><circle className="dot d2" r="5" /><circle className="dot d3" r="5" />
          <g className="star" transform="translate(100 46)">
            <rect x="-22" y="-22" width="44" height="44" /><rect x="-22" y="-22" width="44" height="44" transform="rotate(45)" />
            <circle className="core" r="9" />
          </g>
        </svg>
        <div className="intro-words">
          <b className="ur" lang="ur">پہنچ</b>
          <span className="en" lang="en">{'Pohnch'.split('').map((c, k) => <i key={k} style={{ ['--k' as string]: k }}>{c}</i>)}</span>
        </div>
        <span className="shine" />
      </div>
      <button type="button" className="intro-skip" onClick={() => setPhase('leaving')}>{skipLabel}</button>
    </div>
  );
}
