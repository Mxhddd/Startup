// Truck art, drawn properly (v19): the hand-painted language of Pakistan's trucks as plain SVG made
// from code. Used by the pages (CSS backgrounds and inline SVG) and by the 3D city (painted onto the
// van and the rooftop boards), so both look the same. Every motif has black outlines, as on a truck.
// - rose(): a layered rose with leaves (phool);
// - vineTile(): a band of scrolling vine with leaves, buds and small flowers (bel);
// - jhalarTile(): scalloped fringe with tassels and bells, hanging from a gold rail;
// - chamakTile(): reflective tape mosaic: foil diamonds, teardrops, stars and discs on black (chamak patti);
// - lehriyaTile(): wave lines (lehriya);
// - parrot(), peacock(): birds for the corners;
// - panelSvg(): a whole painted panel (border, corner roses, birds, fringe) with an empty middle for words.
// Colours: Pohnch's neel, zamurrad, kesar, pista, ghee and sona as foil, with gulabi (rose-magenta) as the
// hot colour. Shingarf red is never used: it means help, "late" and strikes (CLAUDE.md).

export const TC = {
  neel: '#1F2A5C', neelDeep: '#141C42', zam: '#17705A', zamDeep: '#0E5A47', pista: '#A7D47E', kesar: '#E8A33D',
  ghee: '#FAF6EE', sona: '#C9A24A', gulabi: '#C2185B', gulabiLight: '#E0567F', gulabiDeep: '#8E1144', sky: '#3E7CC4', ink: '#0E1022',
};
const f = (n: number) => Math.round(n * 100) / 100;
const INK = (w: number) => `stroke="${TC.ink}" stroke-width="${f(w)}" stroke-linejoin="round" stroke-linecap="round"`;
const wrap = (w: number, h: number, body: string, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${f(w)}" height="${f(h)}" viewBox="0 0 ${f(w)} ${f(h)}">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;
export const svgUri = (svg: string): string => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
export const svgSrc = (svg: string): string => `data:image/svg+xml,${encodeURIComponent(svg)}`;

/** An almond leaf from (x, y) pointing at angle a (radians), length l. */
function leaf(x: number, y: number, a: number, l: number, sw: number): string {
  const w = l * 0.36, deg = (a * 180) / Math.PI;
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(deg)})"><path d="M0 0Q${f(l * 0.5)} ${f(-w)} ${f(l)} 0Q${f(l * 0.5)} ${f(w)} 0 0Z" fill="${TC.zam}" ${INK(sw)}/><path d="M${f(l * 0.08)} 0L${f(l * 0.86)} 0" stroke="${TC.pista}" stroke-width="${f(sw * 0.9)}" stroke-linecap="round"/></g>`;
}

/** A layered rose at (cx, cy), radius r, with two leaves behind it. */
export function rose(cx: number, cy: number, r: number, leaves = true): string {
  const sw = Math.max(0.6, r * 0.07), out: string[] = [];
  if (leaves) { out.push(leaf(cx + r * 0.5, cy + r * 0.3, 0.5, r * 1.5, sw)); out.push(leaf(cx - r * 0.5, cy + r * 0.3, Math.PI - 0.5, r * 1.5, sw)); }
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 - Math.PI / 2; out.push(`<circle cx="${f(cx + Math.cos(a) * r * 0.52)}" cy="${f(cy + Math.sin(a) * r * 0.52)}" r="${f(r * 0.48)}" fill="${TC.gulabi}" ${INK(sw)}/>`); }
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 + 0.3; out.push(`<circle cx="${f(cx + Math.cos(a) * r * 0.3)}" cy="${f(cy + Math.sin(a) * r * 0.3)}" r="${f(r * 0.32)}" fill="${TC.gulabiLight}" ${INK(sw * 0.8)}/>`); }
  out.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.24)}" fill="${TC.gulabiDeep}" ${INK(sw * 0.8)}/>`);
  out.push(`<path d="M${f(cx - r * 0.1)} ${f(cy)}a${f(r * 0.1)} ${f(r * 0.1)} 0 1 1 ${f(r * 0.14)} ${f(r * 0.08)}" fill="none" stroke="${TC.ghee}" stroke-width="${f(sw * 0.8)}" stroke-linecap="round"/>`);
  // painted highlights on the outer petals
  for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + (k - 1) * 0.9; const x = cx + Math.cos(a) * r * 0.78, y = cy + Math.sin(a) * r * 0.78; out.push(`<path d="M${f(x - r * 0.12)} ${f(y)}q${f(r * 0.12)} ${f(-r * 0.1)} ${f(r * 0.24)} 0" fill="none" stroke="${TC.ghee}" stroke-width="${f(sw * 0.7)}" stroke-linecap="round" opacity=".85"/>`); }
  return out.join('');
}
/** A standalone rose, s wide. */
export function roseSvg(s = 40, leaves = true): string { return wrap(s, s, rose(s / 2, s / 2 - (leaves ? s * 0.06 : 0), s * (leaves ? 0.22 : 0.36), leaves)); }

/** A five-dot flower (buds and small flowers along the vine). */
function blossom(cx: number, cy: number, r: number, col: string, sw: number): string {
  let o = '';
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; o += `<circle cx="${f(cx + Math.cos(a) * r)}" cy="${f(cy + Math.sin(a) * r)}" r="${f(r * 0.7)}" fill="${col}" ${INK(sw)}/>`; }
  return o + `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.5)}" fill="${TC.kesar}" ${INK(sw)}/>`;
}

/** One repeat of the vine band: neel ground, a scrolling stem, leaves, a rose bud and a small flower. 4h wide. */
export function vineTile(h = 28): string {
  const w = h * 4, sw = Math.max(0.6, h * 0.045), y = h / 2;
  const stem = `<path d="M0 ${f(y)}C${f(w * 0.12)} ${f(h * 0.08)} ${f(w * 0.38)} ${f(h * 0.08)} ${f(w * 0.5)} ${f(y)}S${f(w * 0.88)} ${f(h * 0.92)} ${f(w)} ${f(y)}" fill="none" stroke="${TC.pista}" stroke-width="${f(h * 0.07)}" stroke-linecap="round"/>`;
  const body = [
    `<rect width="${f(w)}" height="${f(h)}" fill="${TC.neel}"/>`, stem,
    leaf(w * 0.18, h * 0.3, -0.7, h * 0.42, sw), leaf(w * 0.34, h * 0.26, -2.5, h * 0.38, sw),
    leaf(w * 0.66, h * 0.72, 0.7, h * 0.42, sw), leaf(w * 0.82, h * 0.74, 2.5, h * 0.38, sw),
    rose(w * 0.26, h * 0.62, h * 0.24, false), blossom(w * 0.76, h * 0.34, h * 0.09, TC.ghee, sw * 0.8),
    `<path d="M0 ${f(sw)}H${f(w)}M0 ${f(h - sw)}H${f(w)}" stroke="${TC.sona}" stroke-width="${f(sw * 2)}"/>`,
  ];
  return wrap(w, h, body.join(''));
}

/** One repeat of the jhalar: a gold rail with three scallops in turn (gulabi, zamurrad, kesar), each with a tassel and bell. 3h wide. */
export function jhalarTile(h = 26): string {
  const s = h * 0.62, w = s * 3, sw = Math.max(0.6, h * 0.04), rail = h * 0.16, out: string[] = [];
  out.push(`<rect width="${f(w)}" height="${f(rail)}" fill="${TC.sona}" ${INK(sw)}/>`);
  [TC.gulabi, TC.zam, TC.kesar].forEach((c, i) => {
    const cx = s * i + s / 2, r = s / 2;
    out.push(`<path d="M${f(cx - r)} ${f(rail)}A${f(r)} ${f(r)} 0 0 0 ${f(cx + r)} ${f(rail)}Z" fill="${c}" ${INK(sw)}/>`);
    out.push(`<path d="M${f(cx - r * 0.55)} ${f(rail)}A${f(r * 0.55)} ${f(r * 0.55)} 0 0 0 ${f(cx + r * 0.55)} ${f(rail)}" fill="none" stroke="${TC.ghee}" stroke-width="${f(sw * 1.2)}"/>`);
    out.push(`<path d="M${f(cx)} ${f(rail + r)}V${f(h - h * 0.14)}" stroke="${TC.ink}" stroke-width="${f(sw)}"/>`);
    out.push(`<circle cx="${f(cx)}" cy="${f(h - h * 0.1)}" r="${f(h * 0.08)}" fill="${TC.sona}" ${INK(sw * 0.8)}/>`);
  });
  return wrap(w, h, out.join(''));
}

/** One repeat of chamak patti: on black, foil shapes (silver diamond, gulabi teardrop, gold star, blue disc) with outlines and shine. 4h wide. */
export function chamakTile(h = 18, seed = 0): string {
  const w = h * 4, sw = Math.max(0.5, h * 0.05), cy = h / 2;
  const defs = `<linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#B9C4D6"/><stop offset="1" stop-color="#EEF2F8"/></linearGradient>`
    + `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE7A3"/><stop offset=".5" stop-color="${TC.sona}"/><stop offset="1" stop-color="#FFF1C7"/></linearGradient>`
    + `<linearGradient id="p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${TC.gulabiLight}"/><stop offset=".55" stop-color="${TC.gulabi}"/><stop offset="1" stop-color="#F07AA0"/></linearGradient>`
    + `<linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7FB3EE"/><stop offset=".55" stop-color="${TC.sky}"/><stop offset="1" stop-color="#A9CCF4"/></linearGradient>`;
  const order = ['s', 'p', 'g', 'b'], o = (seed % 4 + 4) % 4, shapes: string[] = [];
  for (let i = 0; i < 4; i++) {
    const kind = order[(i + o) % 4]!, cx = h * i + h / 2, r = h * 0.38;
    if (kind === 's') shapes.push(`<path d="M${f(cx)} ${f(cy - r)}L${f(cx + r)} ${f(cy)}L${f(cx)} ${f(cy + r)}L${f(cx - r)} ${f(cy)}Z" fill="url(#s)" ${INK(sw)}/>`);
    if (kind === 'p') shapes.push(`<path d="M${f(cx)} ${f(cy - r)}C${f(cx + r * 0.9)} ${f(cy)} ${f(cx + r * 0.7)} ${f(cy + r)} ${f(cx)} ${f(cy + r)}C${f(cx - r * 0.7)} ${f(cy + r)} ${f(cx - r * 0.9)} ${f(cy)} ${f(cx)} ${f(cy - r)}Z" fill="url(#p)" ${INK(sw)}/>`);
    if (kind === 'g') { let d = ''; for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? r * 0.48 : r; d += `${k ? 'L' : 'M'}${f(cx + Math.cos(a) * rr)} ${f(cy + Math.sin(a) * rr)}`; } shapes.push(`<path d="${d}Z" fill="url(#g)" ${INK(sw)}/>`); }
    if (kind === 'b') shapes.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.8)}" fill="url(#b)" ${INK(sw)}/><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r * 0.32)}" fill="url(#g)" ${INK(sw * 0.8)}/>`);
    shapes.push(`<path d="M${f(cx - r * 0.35)} ${f(cy - r * 0.25)}l${f(r * 0.25)} ${f(-r * 0.2)}" stroke="#fff" stroke-width="${f(sw * 1.2)}" stroke-linecap="round" opacity=".9"/>`);
  }
  return wrap(w, h, `<rect width="${f(w)}" height="${f(h)}" fill="${TC.ink}"/>${shapes.join('')}<path d="M0 ${f(sw)}H${f(w)}M0 ${f(h - sw)}H${f(w)}" stroke="${TC.sona}" stroke-width="${f(sw * 1.6)}"/>`, defs);
}

/** One repeat of lehriya: three wave lines. 2h wide. */
export function lehriyaTile(h = 12): string {
  const w = h * 2, lines = [TC.kesar, TC.gulabi, TC.zam].map((c, i) => { const y = h * (0.25 + i * 0.25); return `<path d="M0 ${f(y)}Q${f(w * 0.25)} ${f(y - h * 0.16)} ${f(w * 0.5)} ${f(y)}T${f(w)} ${f(y)}" fill="none" stroke="${c}" stroke-width="${f(h * 0.1)}" stroke-linecap="round"/>`; });
  return wrap(w, h, lines.join(''));
}

/** A parrot in profile facing right, sitting at (x, y) (its feet), size s; flip to face left. */
export function parrot(x: number, y: number, s: number, flip = false): string {
  const sw = Math.max(0.6, s * 0.03);
  const g = [
    `<path d="M${f(-s * 0.18)} ${f(-s * 0.05)}L${f(-s * 0.62)} ${f(s * 0.42)}L${f(-s * 0.48)} ${f(s * 0.46)}L${f(-s * 0.08)} ${f(s * 0.06)}Z" fill="${TC.zamDeep}" ${INK(sw)}/>`, // tail
    `<path d="M${f(-s * 0.1)} ${f(-s * 0.02)}L${f(-s * 0.5)} ${f(s * 0.5)}L${f(-s * 0.36)} ${f(s * 0.52)}Z" fill="${TC.sky}" ${INK(sw)}/>`,
    `<ellipse cx="0" cy="${f(-s * 0.3)}" rx="${f(s * 0.2)}" ry="${f(s * 0.3)}" transform="rotate(-20 0 ${f(-s * 0.3)})" fill="${TC.zam}" ${INK(sw)}/>`, // body
    `<path d="M${f(-s * 0.16)} ${f(-s * 0.42)}Q${f(-s * 0.02)} ${f(-s * 0.18)} ${f(-s * 0.1)} ${f(-s * 0.02)}Q${f(-s * 0.26)} ${f(-s * 0.2)} ${f(-s * 0.16)} ${f(-s * 0.42)}Z" fill="${TC.zamDeep}" ${INK(sw)}/>`, // wing
    `<circle cx="${f(s * 0.08)}" cy="${f(-s * 0.62)}" r="${f(s * 0.15)}" fill="${TC.pista}" ${INK(sw)}/>`, // head
    `<path d="M${f(s * 0.2)} ${f(-s * 0.68)}Q${f(s * 0.36)} ${f(-s * 0.66)} ${f(s * 0.3)} ${f(-s * 0.5)}Q${f(s * 0.26)} ${f(-s * 0.58)} ${f(s * 0.19)} ${f(-s * 0.56)}Z" fill="${TC.kesar}" ${INK(sw)}/>`, // beak
    `<circle cx="${f(s * 0.11)}" cy="${f(-s * 0.66)}" r="${f(s * 0.04)}" fill="${TC.ghee}" ${INK(sw * 0.6)}/><circle cx="${f(s * 0.115)}" cy="${f(-s * 0.66)}" r="${f(s * 0.016)}" fill="${TC.ink}"/>`,
    `<path d="M${f(-s * 0.02)} ${f(-s * 0.52)}Q${f(s * 0.12)} ${f(-s * 0.44)} ${f(s * 0.14)} ${f(-s * 0.52)}" fill="none" stroke="${TC.gulabi}" stroke-width="${f(sw * 1.6)}" stroke-linecap="round"/>`, // ring
    `<path d="M${f(-s * 0.04)} 0V${f(s * 0.04)}M${f(s * 0.06)} ${f(-s * 0.02)}V${f(s * 0.04)}" stroke="${TC.kesar}" stroke-width="${f(sw * 1.4)}" stroke-linecap="round"/>`,
  ];
  return `<g transform="translate(${f(x)} ${f(y)})${flip ? ' scale(-1 1)' : ''}">${g.join('')}</g>`;
}

/** A peacock in profile with its tail fanned behind, standing at (x, y), size s. */
export function peacock(x: number, y: number, s: number, flip = false): string {
  const sw = Math.max(0.6, s * 0.025), out: string[] = [];
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI * 0.95 + (k / 6) * Math.PI * 0.62, l = s * 0.62, ex = Math.cos(a) * l, ey = Math.sin(a) * l - s * 0.2;
    out.push(`<path d="M0 ${f(-s * 0.2)}L${f(ex)} ${f(ey)}" stroke="${TC.zamDeep}" stroke-width="${f(sw * 1.5)}"/>`);
    out.push(`<ellipse cx="${f(ex)}" cy="${f(ey)}" rx="${f(s * 0.1)}" ry="${f(s * 0.13)}" transform="rotate(${f((a * 180) / Math.PI + 90)} ${f(ex)} ${f(ey)})" fill="${TC.zam}" ${INK(sw)}/>`);
    out.push(`<circle cx="${f(ex)}" cy="${f(ey)}" r="${f(s * 0.055)}" fill="${TC.sona}" ${INK(sw * 0.7)}/><circle cx="${f(ex)}" cy="${f(ey)}" r="${f(s * 0.028)}" fill="${TC.neel}"/>`);
  }
  out.push(`<path d="M${f(-s * 0.12)} ${f(-s * 0.08)}Q${f(-s * 0.02)} ${f(-s * 0.42)} ${f(s * 0.1)} ${f(-s * 0.62)}Q${f(s * 0.16)} ${f(-s * 0.66)} ${f(s * 0.16)} ${f(-s * 0.56)}Q${f(s * 0.12)} ${f(-s * 0.3)} ${f(s * 0.14)} ${f(-s * 0.06)}Q${f(0)} ${f(s * 0.02)} ${f(-s * 0.12)} ${f(-s * 0.08)}Z" fill="${TC.sky}" ${INK(sw)}/>`);
  out.push(`<path d="M${f(s * 0.15)} ${f(-s * 0.6)}l${f(s * 0.09)} ${f(s * 0.02)}l${f(-s * 0.08)} ${f(s * 0.03)}Z" fill="${TC.kesar}" ${INK(sw * 0.8)}/>`);
  out.push(`<circle cx="${f(s * 0.12)}" cy="${f(-s * 0.6)}" r="${f(s * 0.016)}" fill="${TC.ink}"/>`);
  for (let k = 0; k < 3; k++) out.push(`<path d="M${f(s * 0.1)} ${f(-s * 0.64)}l${f((k - 1) * s * 0.04)} ${f(-s * 0.1)}" stroke="${TC.ink}" stroke-width="${f(sw)}"/><circle cx="${f(s * 0.1 + (k - 1) * s * 0.04)}" cy="${f(-s * 0.75)}" r="${f(s * 0.018)}" fill="${TC.sona}"/>`);
  out.push(`<path d="M${f(-s * 0.04)} ${f(-s * 0.06)}V${f(s * 0.02)}M${f(s * 0.06)} ${f(-s * 0.06)}V${f(s * 0.02)}" stroke="${TC.kesar}" stroke-width="${f(sw * 1.5)}" stroke-linecap="round"/>`);
  return `<g transform="translate(${f(x)} ${f(y)})${flip ? ' scale(-1 1)' : ''}">${out.join('')}</g>`;
}

/** A whole painted panel, w × h: ground colour, vine border top, jhalar fringe bottom, roses in the
 *  corners and (if wide enough) a parrot on each side. The middle is left clear for words. */
export function panelSvg(w: number, h: number, opts: { ground?: string; birds?: boolean; seed?: number } = {}): string {
  const ground = opts.ground ?? TC.ghee, b = Math.max(14, Math.round(h * 0.13)), out: string[] = [];
  // each tile is defined once as a symbol and stamped along its band (plain and reliable wherever the SVG is shown)
  const inner = (svg: string) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  // ids are unique to this panel's size, look and seed, so several panels can sit inline on one page
  const u = `t${Math.round(w)}x${Math.round(h)}${(opts.ground ?? TC.ghee).slice(1)}${opts.seed ?? 0}${opts.birds ? 'b' : ''}`;
  const sym = (svg: string, tw: number, th: number, id: string) => `<symbol id="${u}${id}" viewBox="0 0 ${f(tw)} ${f(th)}">${inner(svg)}</symbol>`;
  const stamp = (id: string, tw: number, th: number, y: number) => { let o = ''; for (let x = 0; x < w; x += tw) o += `<use href="#${u}${id}" x="${f(x)}" y="${f(y)}" width="${f(tw)}" height="${f(th)}"/>`; return o; };
  const jh = Math.round(b * 1.1), ch = Math.round(b * 0.62), jw = jh * 0.62 * 3;
  const defs = sym(vineTile(b), b * 4, b, 'v') + sym(chamakTile(ch, opts.seed ?? 0), ch * 4, ch, 'c') + sym(jhalarTile(jh), jw, jh, 'j') + `<clipPath id="${u}k"><rect width="${f(w)}" height="${f(h)}" rx="${f(b * 0.5)}"/></clipPath>`;
  out.push(`<rect width="${f(w)}" height="${f(h)}" rx="${f(b * 0.5)}" fill="${ground}"/>`);
  out.push(`<g clip-path="url(#${u}k)">${stamp('v', b * 4, b, 0)}${stamp('c', ch * 4, ch, b)}${stamp('j', jw, jh, h - jh)}</g>`);
  out.push(`<rect x="${f(b * 0.35)}" y="${f(b * 1.8)}" width="${f(w - b * 0.7)}" height="${f(h - b * 1.8 - jh - b * 0.25)}" rx="${f(b * 0.4)}" fill="none" stroke="${TC.sona}" stroke-width="${f(Math.max(1, b * 0.08))}"/>`);
  const rr = Math.min(h * 0.16, w * 0.07);
  out.push(rose(rr * 2.3, h * 0.52, rr), rose(w - rr * 2.3, h * 0.52, rr));
  if (opts.birds && w > h * 2.4) { out.push(parrot(rr * 5, h * 0.5 + rr * 0.9, rr * 2.3), parrot(w - rr * 5, h * 0.5 + rr * 0.9, rr * 2.3, true)); }
  return wrap(w, h, out.join(''), defs);
}
