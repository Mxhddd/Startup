// /links (v23): where the standee's QR code lands, and the "link in bio" of Instagram and TikTok.
// It is a brand moment, so it gets the full truck-art treatment: a painted neel crown (chamak foil,
// vine, the Urdu wordmark, two parrots, a swinging jhalar fringe), a little van driving the dotted
// road, then six links on sketchbook paper. No site header or footer: one screen, one job.
// Server-rendered, no JavaScript; motion is CSS only and stops for reduced motion.
import { PILOT_WHATSAPP } from '@pohnch/core';
import { dirOf, otherLang, t, type Lang, type MessageKey } from '@pohnch/messages';
import { href, otherHref } from '../_lib/links';
import { chamakTile, jhalarTile, parrot, svgSrc, svgUri, vineTile } from './truckartSvg';
import './tokens.css';
import './links.css';

export const SOCIAL = { instagram: 'https://www.instagram.com/pohnch.pk/', tiktok: 'https://www.tiktok.com/@pohnch.pk' } as const;
const w = (lang: Lang, key: string) => t(lang, `web.links.${key}` as MessageKey);
const bird = (flip: boolean) => svgSrc(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="-40 -66 80 80">${parrot(0, 6, 64, flip)}</svg>`);

const Icon = ({ d, fill = false }: { d: string; fill?: boolean }) => (
  <svg className="lk-ico" width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
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

/** The little painted van that drives the dotted road under the crown. */
const Van = () => (
  <svg className="lk-van" width="92" height="52" viewBox="0 0 92 52" aria-hidden="true">
    <path d="M4 40V12a6 6 0 0 1 6-6h52c5 0 8 2 10 6l12 15v13Z" fill="#FFFDF8" stroke="#0E1022" strokeWidth="2.6" strokeLinejoin="round" />
    <path d="M10 11h13v11H10ZM27 11h13v11H27ZM44 11h13v11H44ZM61 11h5c2.4 0 4 1 5 2.6l5.6 8.4H61Z" fill="#DDE6F2" stroke="#0E1022" strokeWidth="2" strokeLinejoin="round" />
    <path d="M4 27h80" stroke="#0E1022" strokeWidth="2" />
    <rect x="5.3" y="28" width="77.5" height="5" fill="#E8A33D" />
    <rect x="5.3" y="33" width="77.5" height="3" fill="#C2185B" />
    <circle cx="22" cy="41" r="7" fill="#0E1022" /><circle cx="22" cy="41" r="2.8" fill="#E8A33D" />
    <circle cx="66" cy="41" r="7" fill="#0E1022" /><circle cx="66" cy="41" r="2.8" fill="#E8A33D" />
  </svg>
);

export function LinksPage({ lang }: { lang: Lang }) {
  const other = otherLang(lang);
  const ext = { target: '_blank', rel: 'noreferrer' } as const;
  const crown = {
    ['--chamak' as string]: svgUri(chamakTile(18, 0)),
    ['--vine' as string]: svgUri(vineTile(30)),
    ['--jhalar' as string]: svgUri(jhalarTile(30)),
  };
  return (
    <div className="v16 lk" lang={lang} dir={dirOf(lang)} data-lang={lang} style={crown}>
      <header className="lk-crown">
        <span className="lk-band chamak" aria-hidden="true" />
        <span className="lk-band vine" aria-hidden="true" />
        <div className="lk-name">
          <img className="lk-bird l" src={bird(false)} alt="" width="80" height="80" />
          <h1><b lang="ur" dir="rtl">پہنچ</b><span lang="en" dir="ltr">Pohnch</span></h1>
          <img className="lk-bird r" src={bird(true)} alt="" width="80" height="80" />
        </div>
        <p className="lk-lead">{w(lang, 'lead')}</p>
        <span className="lk-band jhalar" aria-hidden="true" />
      </header>

      <div className="lk-road" aria-hidden="true"><span className="lk-dots" /><Van /></div>

      <main className="lk-main">
        <ul className="lk-list">
          <li style={{ ['--i' as string]: 0 }}>
            <a className="lk-card main" href={href(lang, '/app')} data-testid="link-app">
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

      <footer className="lk-foot">
        <a href={otherHref(lang, '/links')} hrefLang={other} lang={other}>{t(lang, 'lang.switch' as MessageKey)}</a>
        <span>{w(lang, 'made')}</span>
      </footer>
    </div>
  );
}
