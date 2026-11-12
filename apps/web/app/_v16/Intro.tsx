'use client';
// The opening logo moment on pohnch.pk (v19), every visit. A deep neel layer covers the page from the
// very first paint (it is in the server's HTML): the route dots travel into the kesar star, the centre
// dot lands, پہنچ writes itself right to left, "Pohnch" rises letter by letter, a gold glint sweeps
// across and a painted ring blooms. Then the words fade, the star lifts and becomes the sun (the moon at
// night), the sky turns to dawn, and the layer opens onto the city while the camera flies in from the
// sea. Any tap, click, scroll or key skips it; reduced motion never sees it; without JavaScript the CSS
// timing alone opens it. The page hears "pohnch:intro-open" when the layer starts to open.
import { useEffect, useState } from 'react';
import { TS } from './Demos';
import { INTRO_OPEN_AT, INTRO_OPEN_MS, introMode } from './introRules';

export function Intro({ skipLabel }: { skipLabel: string }) {
  const [phase, setPhase] = useState<'full' | 'leaving' | 'gone'>('full');
  useEffect(() => {
    if (introMode(matchMedia('(prefers-reduced-motion: reduce)').matches) === 'none') { setPhase('gone'); dispatchEvent(new Event('pohnch:intro-open')); return; }
    const leave = () => setPhase((p) => (p === 'full' ? 'leaving' : p));
    const t = setTimeout(leave, INTRO_OPEN_AT / TS);
    const opts = { passive: true, once: true } as const;
    addEventListener('pointerdown', leave, opts); addEventListener('wheel', leave, opts); addEventListener('touchstart', leave, opts); addEventListener('keydown', leave, opts);
    return () => { clearTimeout(t); removeEventListener('pointerdown', leave); removeEventListener('wheel', leave); removeEventListener('touchstart', leave); removeEventListener('keydown', leave); };
  }, []);
  useEffect(() => {
    if (phase !== 'leaving') return;
    dispatchEvent(new Event('pohnch:intro-open'));
    const t = setTimeout(() => setPhase('gone'), INTRO_OPEN_MS / TS); return () => clearTimeout(t);
  }, [phase]);
  if (phase === 'gone') return null;
  return (
    <div className={`intro ${phase}`} data-testid="intro" role="presentation">
      <div className="intro-mark" aria-hidden="true">
        <svg className="logo" viewBox="0 0 200 120" width="200" height="120">
          <path className="trail" d="M12 108 C 40 108 48 78 68 70 S 92 56 100 46" fill="none" />
          <circle className="dot d1" r="5" /><circle className="dot d2" r="5" /><circle className="dot d3" r="5" />
          <g className="sky-up">
            <circle className="sun" cx="100" cy="46" r="24" />
            <g className="star" transform="translate(100 46)">
              <rect x="-22" y="-22" width="44" height="44" /><rect x="-22" y="-22" width="44" height="44" transform="rotate(45)" />
              <circle className="core" r="9" />
            </g>
          </g>
          {/* a thin painted ring of chamak patti blooms around the star */}
          <g className="tring" transform="translate(100 46)">
            <circle r="38" className="tr1" /><circle r="38" className="tr2" /><circle r="44" className="tr3" />
          </g>
        </svg>
        <div className="intro-words">
          <b className="ur" lang="ur">پہنچ</b>
          <span className="en" lang="en">{'Pohnch'.split('').map((c, k) => <i key={k} style={{ ['--k' as string]: k }}>{c}</i>)}</span>
        </div>
      </div>
      <button type="button" className="intro-skip" onClick={() => setPhase('leaving')}>{skipLabel}</button>
    </div>
  );
}
