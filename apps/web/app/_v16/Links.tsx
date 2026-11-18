// /links (v24): where the standee's QR code and the Instagram/TikTok bios land, so it is many people's
// first look at Pohnch. Brand neel ground with the star lattice; a sketchbook page, spiral-bound, where a
// pencil drawing animates the promise (the road draws itself, the van drives home to school, the
// "in the van" alert pops up); then six links on paper cards with washi tape, like the posters.
// Server-rendered, no JavaScript: motion is CSS and SVG only, and stops for reduced motion.
import { PILOT_WHATSAPP } from '@pohnch/core';
import { dirOf, otherLang, t, type Lang, type MessageKey } from '@pohnch/messages';
import { href, otherHref } from '../_lib/links';
import { handFont } from '../fonts';
import { chamakTile, jhalarTile, parrot, svgSrc, svgUri } from './truckartSvg';
import './tokens.css';
import './links.css';

import { SOCIAL } from '../_lib/social';
export { SOCIAL };
const w = (lang: Lang, key: string) => t(lang, `web.links.${key}` as MessageKey);
const bird = (flip: boolean) => svgSrc(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="-40 -66 80 80">${parrot(0, 6, 64, flip)}</svg>`);
const STAR = 'M32 4 L40.2 12.2 L51.8 12.2 L51.8 23.8 L60 32 L51.8 40.2 L51.8 51.8 L40.2 51.8 L32 60 L23.8 51.8 L12.2 51.8 L12.2 40.2 L4 32 L12.2 23.8 L12.2 12.2 L23.8 12.2 Z';
const lattice = svgUri(`<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><path transform="translate(36 36) scale(0.34) translate(-32 -32)" d="${STAR}" fill="#26326B"/><circle cx="36" cy="36" r="2.4" fill="#E8A33D" opacity="0.6"/></svg>`);

const Icon = ({ d }: { d: string }) => (
  <svg className="lk-ico" width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ICONS = {
  app: 'M8 2.5h8a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2ZM11 18.5h2M12 7v6m-3-3 3 3 3-3',
  wa: 'M4 20l1.3-4A8 8 0 1 1 8.4 19ZM9 8.6c0 3.4 2.9 6.4 6.4 6.4l1.1-1.6-2-1-1 .9a5 5 0 0 1-2.7-2.7l.9-1-1-2Z',
  site: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.6 2.6 3.6 5.6 3.6 9s-1 6.4-3.6 9c-2.6-2.6-3.6-5.6-3.6-9s1-6.4 3.6-9Z',
  ig: 'M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17.2 6.8h.01',
  tt: 'M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.4 2.6 2.2 4.4 5 4.6',
  shield: 'M12 3l7 3v5c0 4.6-3 8.3-7 10-4-1.7-7-5.4-7-10V6l7-3Zm-3 9 2 2 4-4',
};
const Arrow = () => <svg className="lk-arr" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13m-5-5 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;

/** The pencil drawing on the sketchbook page: home, a road that draws itself, a school with a flag,
 *  a sun, and the painted van driving the road; the alert card pops up when the van has the child. */
function Sketch({ lang }: { lang: Lang }) {
  const road = 'M58 176 C120 176 130 128 200 128 C270 128 282 176 342 176';
  return (
    <div className="lk-page" aria-hidden="true">
      <span className="lk-rings" />
      <svg className="lk-draw" viewBox="0 0 400 220" width="100%">
        <defs>
          <filter id="lkPencil" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="3" /><feDisplacementMap in="SourceGraphic" scale="2.4" /></filter>
          <filter id="lkWash" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="5" /><feDisplacementMap in="SourceGraphic" scale="9" /></filter>
        </defs>
        <circle className="lk-sun" cx="330" cy="46" r="24" fill="#E8A33D" opacity="0.85" filter="url(#lkWash)" />
        <g filter="url(#lkPencil)" fill="none" stroke="#23284A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path className="lk-line l1" pathLength={1} d="M30 196 L30 160 L58 134 L86 160 L86 196 Z M50 196 L50 176 L66 176 L66 196" />
          <path className="lk-line l2" pathLength={1} d="M318 196 L318 146 L380 146 L380 196 Z M340 196 L340 174 L358 174 L358 196 M349 146 L349 104 M349 104 L378 113 L349 122" />
          <path className="lk-line l3" pathLength={1} d="M14 198 L388 198" strokeWidth="2" opacity="0.6" />
        </g>
        <rect x="31" y="161" width="54" height="34" fill="#17705A" opacity="0.28" filter="url(#lkWash)" />
        <path d="M351 106 L376 113 L351 120 Z" fill="#E8A33D" filter="url(#lkWash)" />
        <path className="lk-road" pathLength={1} d={road} fill="none" stroke="#1F2A5C" strokeWidth="5" strokeLinecap="round" strokeDasharray="0.012 0.03" />
        <g className="lk-vanmove">
          <g transform="translate(-26 -30)">
            <path d="M2 24V8a4 4 0 0 1 4-4h30c3 0 5 1.4 6.4 3.6L50 16v8Z" fill="#E8A33D" stroke="#0E1022" strokeWidth="2" strokeLinejoin="round" />
            <path d="M7 8h8v7H7ZM18 8h8v7h-8ZM29 8h5c1.6 0 2.6.7 3.3 1.8L41 15H29Z" fill="#DDE6F2" stroke="#0E1022" strokeWidth="1.5" strokeLinejoin="round" />
            <rect x="3" y="17" width="46" height="3" fill="#C2185B" />
            <circle cx="13" cy="25" r="4.6" fill="#0E1022" /><circle cx="39" cy="25" r="4.6" fill="#0E1022" />
            <circle cx="13" cy="25" r="1.8" fill="#E8A33D" /><circle cx="39" cy="25" r="1.8" fill="#E8A33D" />
          </g>
          <animateMotion dur="9s" repeatCount="indefinite" rotate="auto" keyPoints="0;0;1;1" keyTimes="0;0.18;0.82;1" calcMode="linear" path={road} />
        </g>
      </svg>
      <div className="lk-alert">
        <span className="lk-check"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M5 12.5 10 17l9-10" fill="none" stroke="#FFFDF8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
        <span className="lk-alert-txt"><b lang={lang}>{w(lang, 'alert')}</b><small>{w(lang, 'alertSub')}</small></span>
      </div>
      <span className="lk-hand lk-note" lang="en" dir="ltr">{w(lang, 'hand')}</span>
    </div>
  );
}

export function LinksPage({ lang }: { lang: Lang }) {
  const other = otherLang(lang);
  const ext = { target: '_blank', rel: 'noreferrer' } as const;
  const vars = {
    ['--chamak' as string]: svgUri(chamakTile(18, 0)),
    ['--jhalar' as string]: svgUri(jhalarTile(26)),
    ['--lattice' as string]: lattice,
  };
  return (
    <div className={`v16 lk ${handFont.variable}`} lang={lang} dir={dirOf(lang)} data-lang={lang} style={vars}>
      <span className="lk-band chamak" aria-hidden="true" />
      <header className="lk-head">
        <img className="lk-bird l" src={bird(false)} alt="" width="64" height="64" />
        <h1><b lang="ur" dir="rtl">پہنچ</b><span lang="en" dir="ltr">Pohnch</span></h1>
        <img className="lk-bird r" src={bird(true)} alt="" width="64" height="64" />
      </header>
      <p className="lk-lead">{w(lang, 'lead')}</p>

      <Sketch lang={lang} />

      <main className="lk-main">
        <span className="lk-hand lk-start" aria-hidden="true">{w(lang, 'start')} <span className="lk-down">↓</span></span>
        <ul className="lk-list">
          <li style={{ ['--i' as string]: 0 }}>
            <a className="lk-card main" href={href(lang, '/app')} data-testid="link-app">
              <span className="lk-tape" aria-hidden="true" />
              <span className="lk-badge"><Icon d={ICONS.app} /></span>
              <span className="lk-txt"><b>{w(lang, 'app')}</b><small>{w(lang, 'appSub')}</small></span>
              <Arrow /><span className="lk-glint" aria-hidden="true" />
            </a>
          </li>
          <li style={{ ['--i' as string]: 1 }}>
            <a className="lk-card wa" href={`https://wa.me/${PILOT_WHATSAPP.waNumber}`} {...ext} data-testid="link-wa">
              <span className="lk-badge"><Icon d={ICONS.wa} /></span>
              <span className="lk-txt"><b>{w(lang, 'wa')}</b><small>{w(lang, 'waSub')}</small></span>
              <Arrow />
            </a>
          </li>
          <li style={{ ['--i' as string]: 2 }}>
            <a className="lk-card site" href={href(lang, '/')} data-testid="link-site">
              <span className="lk-tape t2" aria-hidden="true" />
              <span className="lk-badge"><Icon d={ICONS.site} /></span>
              <span className="lk-txt"><b>pohnch.pk</b><small>{w(lang, 'siteSub')}</small></span>
              <Arrow />
            </a>
          </li>
          <li className="lk-pair" style={{ ['--i' as string]: 3 }}>
            <a className="lk-tile ig" href={SOCIAL.instagram} {...ext} data-testid="link-ig">
              <Icon d={ICONS.ig} /><b>{w(lang, 'ig')}</b><small dir="ltr">@pohnch.pk</small>
            </a>
            <a className="lk-tile tt" href={SOCIAL.tiktok} {...ext} data-testid="link-tt">
              <Icon d={ICONS.tt} /><b>{w(lang, 'tt')}</b><small dir="ltr">@pohnch.pk</small>
            </a>
          </li>
        </ul>
        <a className="lk-privacy" href={href(lang, '/privacy')} data-testid="link-privacy"><Icon d={ICONS.shield} />{w(lang, 'privacy')}</a>
      </main>

      <span className="lk-band jhalar" aria-hidden="true" />
      <footer className="lk-foot">
        <a href={otherHref(lang, '/links')} hrefLang={other} lang={other}>{t(lang, 'lang.switch' as MessageKey)}</a>
        <span>{w(lang, 'made')}</span>
      </footer>
    </div>
  );
}
