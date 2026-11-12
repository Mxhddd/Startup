// Truck art (v18): the hand-painted language of Pakistan's trucks, in Pohnch's colours, used only at
// brand moments (CLAUDE.md: ornamental frames are for brand moments). Everything here is plain SVG
// made from a seed, so the same pattern is drawn on the server and in the browser:
// - chamak patti: a band of painted diamonds with a little mirror in each, framed in sona;
// - a roundel: an eight-petal flower in kesar and rose around a zamurrad centre;
// - a couplet panel: one of Pohnch's own lines in Gulzar inside a painted frame;
// - glints: the sparkle of mirror-work, catching on hover and at moments.
// Shingarf red is never used for decoration (it means help, "late" and strikes).
import type { CSSProperties } from 'react';
import './truckart.css';

export const TA = { neel: '#1F2A5C', kesar: '#E8A33D', zam: '#17705A', sona: '#C9A24A', pista: '#A7D47E', ghee: '#FAF6EE', rose: '#C46A8A' };
const PAIRS: [string, string][] = [[TA.kesar, TA.zam], [TA.rose, TA.ghee], [TA.zam, TA.kesar], [TA.pista, TA.neel], [TA.ghee, TA.rose]];

function rng(seed: number) { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
const f = (n: number) => Number(n.toFixed(2));

/** One repeating tile of chamak patti, `h` tall and 3h wide: three painted diamonds with mirrors. */
export function chamakTile(seed = 1, h = 16): string {
  const r = rng(seed), w = h * 3, out: string[] = [`<rect width="${w}" height="${h}" fill="${TA.neel}"/>`];
  for (let i = 0; i < 3; i++) {
    const [c1, c2] = PAIRS[(i + Math.floor(r() * PAIRS.length)) % PAIRS.length]!, cx = h * i + h / 2, cy = h / 2;
    out.push(`<path d="M${f(cx)} ${f(h * 0.08)}L${f(cx + h * 0.42)} ${f(cy)}L${f(cx)} ${f(h * 0.92)}L${f(cx - h * 0.42)} ${f(cy)}Z" fill="${c1}"/>`);
    out.push(`<path d="M${f(cx)} ${f(h * 0.27)}L${f(cx + h * 0.22)} ${f(cy)}L${f(cx)} ${f(h * 0.73)}L${f(cx - h * 0.22)} ${f(cy)}Z" fill="${c2}"/>`);
    out.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(h * 0.09)}" fill="#fff"/>`);
    out.push(`<path d="M${f(h * (i + 1))} 0l${f(h * 0.12)} ${f(h * 0.2)}h${f(-h * 0.24)}Z M${f(h * (i + 1))} ${h}l${f(h * 0.12)} ${f(-h * 0.2)}h${f(-h * 0.24)}Z" fill="${TA.sona}"/>`);
  }
  out.push(`<path d="M0 ${f(h * 0.04)}H${w} M0 ${f(h * 0.96)}H${w}" stroke="${TA.sona}" stroke-width="${f(h * 0.08)}"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${out.join('')}</svg>`;
}
/** A painted roundel (eight petals), `s` wide. */
export function roundelSvg(s = 32): string {
  const c = s / 2, out: string[] = [];
  for (let k = 0; k < 8; k++) { const a = (k / 8) * 360; out.push(`<ellipse cx="${f(c + s * 0.27)}" cy="${c}" rx="${f(s * 0.2)}" ry="${f(s * 0.1)}" fill="${k % 2 ? TA.kesar : TA.rose}" transform="rotate(${a} ${c} ${c})"/>`); }
  out.push(`<circle cx="${c}" cy="${c}" r="${f(s * 0.16)}" fill="${TA.zam}"/><circle cx="${c}" cy="${c}" r="${f(s * 0.07)}" fill="${TA.ghee}"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">${out.join('')}</svg>`;
}
export const dataUri = (svg: string): string => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/** CSS variables for a page that uses truck art: put them on the page's root element. */
export function truckVars(): CSSProperties {
  return { ['--chamak' as string]: dataUri(chamakTile(1, 16)), ['--chamak2' as string]: dataUri(chamakTile(4, 16)), ['--chamak-s' as string]: dataUri(chamakTile(7, 10)), ['--roundel' as string]: dataUri(roundelSvg(32)) };
}

/** A painted band (decorative only). */
export function Chamak({ className = '', seed = 1, h = 14 }: { className?: string; seed?: number; h?: number }) {
  return <span className={`chamak ${className}`} aria-hidden="true" style={{ height: h, backgroundImage: dataUri(chamakTile(seed, h)) }} />;
}
/** A painted roundel (decorative only). */
export function Roundel({ size = 28, className = '' }: { size?: number; className?: string }) {
  return <span className={`roundel ${className}`} aria-hidden="true" style={{ width: size, height: size, backgroundImage: dataUri(roundelSvg(size)) }} />;
}
/** Mirror-work sparkles that twinkle once at a moment (and on hover of their parent). */
export function Glints({ n = 3 }: { n?: number }) {
  return <span className="glints" aria-hidden="true">{Array.from({ length: n }, (_, k) => <i key={k} style={{ ['--k' as string]: k }} />)}</span>;
}
/** One of Pohnch's own lines in a painted frame: Urdu in Gulzar, English underneath. */
export function Couplet({ ur, en, className = '' }: { ur: string; en: string; className?: string }) {
  return (
    <figure className={`couplet ${className}`}>
      <Chamak seed={3} />
      <div className="cp-in"><Roundel size={30} /><blockquote><b lang="ur" dir="rtl">{ur}</b><span lang="en" dir="ltr">{en}</span></blockquote><Roundel size={30} /></div>
      <Chamak seed={6} />
      <Glints n={4} />
    </figure>
  );
}
