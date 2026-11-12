// The site's night footer (v18), the same on the home page and every inner page: Karachi's rooftops
// at night (water tanks, lit windows, Mazar-e-Quaid's dome and a minaret against the sky), kites
// swaying on their strings, the sea shimmering beyond, a band of chamak patti, one of Pohnch's lines
// in Gulzar, and the links in four small groups. Drawn as one inline SVG, no pictures to download.
import type { ReactNode } from 'react';
import { Chamak, Couplet } from './truckart';

export type FootLinks = { home: string; how: string; safety: string; drivers: string; download: string; story: string; progress: string; schools: string; privacy: string; terms: string; delete: string; other: string };
export type FootLabels = { privacy: string; terms: string; delete: string; download: string; contact: string; switchLang: string; otherLang: 'ur' | 'en' };

function rng(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

/** The rooftop skyline at night, 1200 × 240, made from seeded rectangles. */
function Skyline() {
  const r = rng(7), parts: ReactNode[] = [];
  // far layer: low blocks
  let x = -10;
  while (x < 1210) { const w = 40 + r() * 70, h = 40 + r() * 50; parts.push(<rect key={`f${x}`} x={x} y={200 - h} width={w} height={h + 40} fill="#1B2550" />); x += w + 2; }
  // Mazar-e-Quaid and a minaret, far away
  parts.push(<g key="mazar" fill="#26336A"><rect x="300" y="128" width="96" height="74" /><path d="M300 128 h96 v-4 h-96z" /><path d="M306 126 a42 46 0 0 1 84 0z" /><rect x="345" y="72" width="6" height="10" /></g>);
  parts.push(<g key="minar" fill="#26336A"><rect x="890" y="64" width="9" height="140" /><rect x="885" y="100" width="19" height="4" /><rect x="886" y="72" width="17" height="4" /><path d="M889 64 a5.5 9 0 0 1 11 0z" /></g>);
  // near layer: apartments with tanks and lit windows
  x = -20; let k = 0;
  while (x < 1220) {
    const w = 60 + r() * 90, h = 70 + r() * 80, y = 240 - h;
    parts.push(<rect key={`n${k}`} x={x} y={y} width={w} height={h} fill="#10173A" />);
    for (let t = 0; t < 1 + Math.floor(r() * 2); t++) { const tx = x + 8 + r() * (w - 28); parts.push(<rect key={`t${k}${t}`} x={tx} y={y - 13} width="16" height="14" rx="4" fill={r() < 0.5 ? '#0B1030' : '#2B3870'} />); }
    for (let wy = y + 14; wy < 232; wy += 18) for (let wx = x + 10; wx < x + w - 12; wx += 16) if (r() < 0.28) parts.push(<rect key={`w${k}${wx}${wy}`} x={wx} y={wy} width="7" height="9" fill={r() < 0.7 ? '#F6C46E' : '#FBF7EF'} opacity={0.55 + r() * 0.4} />);
    x += w + 3; k++;
  }
  return (
    <svg className="sky-svg" viewBox="0 0 1200 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs><linearGradient id="fsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#24346E" /><stop offset="1" stopColor="#10173A" /></linearGradient></defs>
      {Array.from({ length: 26 }, (_, i) => { const a = rng(i + 3); return <circle key={`s${i}`} cx={a() * 1200} cy={a() * 120} r={0.8 + a() * 1.2} fill="#FBF7EF" opacity={0.35 + a() * 0.4} />; })}
      <rect x="0" y="176" width="1200" height="30" fill="url(#fsea)" />
      <g className="shimmer">{Array.from({ length: 18 }, (_, i) => <rect key={`sh${i}`} x={(i * 71) % 1200} y={182 + (i % 4) * 5} width={18 + (i % 3) * 10} height="1.5" fill="#FBF7EF" opacity=".35" />)}</g>
      {parts}
      {/* kites on strings from the rooftops */}
      {[[180, 40, '#E8A33D', 120, 160], [640, 26, '#C46A8A', 600, 150], [1010, 52, '#A7D47E', 1060, 150]].map(([kx, ky, c, sx, sy], i) => (
        <g key={`k${i}`} className="fkite" style={{ ['--k' as string]: i }}>
          <path d={`M${kx} ${ky} L${sx} ${sy}`} stroke="#F5EEE1" strokeOpacity=".3" strokeWidth="1" fill="none" />
          <path d={`M${kx} ${(ky as number) - 13} l10 13 l-10 15 l-10 -15z`} fill={c as string} /><path d={`M${kx} ${(ky as number) + 15} l-3 12 l5 6`} stroke="#F5EEE1" strokeOpacity=".6" fill="none" />
        </g>))}
    </svg>
  );
}

export function SiteFooter({ w, links, labels, wa, line, onAgain }: {
  w: Record<string, string>; links: FootLinks; labels: FootLabels; wa: { href: string; display: string };
  line: { ur: string; en: string }; onAgain?: () => void;
}) {
  return (
    <footer className="sitefoot">
      <Skyline />
      <Chamak seed={2} h={16} className="fband" />
      <div className="fwrap">
        <Couplet ur={line.ur} en={line.en} className="fline" />
        <div className="fgrid">
          <div className="fl">
            <span className="mark"><b>پہنچ</b><span>Pohnch</span></span>
            <small>{w['foot.made']}</small>
            {onAgain && <button className="link" type="button" onClick={onAgain}>{w['foot.again']}</button>}
          </div>
          <nav aria-label={w['foot.g1']}><h3>{w['foot.g1']}</h3><a href={links.how}>{w['nav.how']}</a><a href={links.safety}>{w['nav.safety']}</a><a href={links.drivers}>{w['nav.drivers']}</a><a href={links.download}>{labels.download}</a></nav>
          <nav aria-label={w['foot.g2']}><h3>{w['foot.g2']}</h3><a href={links.story}>{w['nav.story']}</a><a href={links.progress}>{w['nav.progress']}</a><a href={links.schools}>{w['nav.schools']}</a></nav>
          <nav aria-label={w['foot.g3']}><h3>{w['foot.g3']}</h3><a href={links.privacy}>{labels.privacy}</a><a href={links.terms}>{labels.terms}</a><a href={links.delete}>{labels.delete}</a></nav>
          <nav aria-label={w['foot.g4']}><h3>{w['foot.g4']}</h3><a href={wa.href} rel="noreferrer">{labels.contact} <bdi dir="ltr" className="num">{wa.display}</bdi></a><a href={links.other} hrefLang={labels.otherLang} lang={labels.otherLang}>{labels.switchLang}</a></nav>
        </div>
      </div>
    </footer>
  );
}
