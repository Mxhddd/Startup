// Truck art for the pages (v18, redrawn in v19). The motifs themselves (roses, vines, jhalar fringe,
// chamak foil tiles, birds) live in truckartSvg.ts as plain SVG, shared with the 3D city; these are the
// small React pieces and CSS variables the pages use. Brand moments only (CLAUDE.md: ornamental frames
// are for brand moments), and never shingarf red.
import type { CSSProperties } from 'react';
import { chamakTile, jhalarTile, panelSvg, roseSvg, svgUri, vineTile } from './truckartSvg';
import './truckart.css';

export { chamakTile, roseSvg } from './truckartSvg';

/** CSS variables for a page that uses truck art: put them on the page's root element. */
export function truckVars(): CSSProperties {
  return {
    ['--chamak' as string]: svgUri(chamakTile(18, 0)), ['--chamak-s' as string]: svgUri(chamakTile(12, 2)),
    ['--vine' as string]: svgUri(vineTile(28)), ['--jhalar' as string]: svgUri(jhalarTile(26)),
    ['--roundel' as string]: svgUri(roseSvg(40, false)), ['--rose' as string]: svgUri(roseSvg(64)),
  };
}

/** A band of chamak foil tiles (decorative only). */
export function Chamak({ className = '', seed = 0, h = 14 }: { className?: string; seed?: number; h?: number }) {
  return <span className={`chamak ${className}`} aria-hidden="true" style={{ height: h, backgroundImage: svgUri(chamakTile(h, seed)) }} />;
}
/** A band of scrolling vine with roses (decorative only). */
export function Vine({ className = '', h = 24 }: { className?: string; h?: number }) {
  return <span className={`chamak vine ${className}`} aria-hidden="true" style={{ height: h, backgroundImage: svgUri(vineTile(h)) }} />;
}
/** Hanging jhalar fringe with tassels and bells (decorative only). */
export function Jhalar({ className = '', h = 26 }: { className?: string; h?: number }) {
  return <span className={`chamak jhalar ${className}`} aria-hidden="true" style={{ height: h, backgroundImage: svgUri(jhalarTile(h)) }} />;
}
/** A painted rose (decorative only). */
export function Roundel({ size = 28, className = '', leaves = false }: { size?: number; className?: string; leaves?: boolean }) {
  return <span className={`roundel ${className}`} aria-hidden="true" style={{ width: size, height: size, backgroundImage: svgUri(roseSvg(size, leaves)) }} />;
}
/** Mirror-work sparkles that twinkle (and on hover of their parent). */
export function Glints({ n = 3 }: { n?: number }) {
  return <span className="glints" aria-hidden="true">{Array.from({ length: n }, (_, k) => <i key={k} style={{ ['--k' as string]: k }} />)}</span>;
}
/** One of Pohnch's own lines on a painted panel: vine and foil on top, roses at the sides, jhalar below. */
export function Couplet({ ur, en, className = '', birds = false }: { ur: string; en: string; className?: string; birds?: boolean }) {
  return (
    <div className={`cpbox ${className}`}>
    <figure className={`couplet ${birds ? 'birds' : ''}`}>
      <span className="cp-art wide" aria-hidden="true" style={{ backgroundImage: svgUri(panelSvg(640, 230, { birds })) }} />
      <span className="cp-art narrow" aria-hidden="true" style={{ backgroundImage: svgUri(panelSvg(400, 230)) }} />
      <blockquote><b lang="ur" dir="rtl">{ur}</b><span lang="en" dir="ltr">{en}</span></blockquote>
      <Glints n={4} />
    </figure>
    </div>
  );
}
