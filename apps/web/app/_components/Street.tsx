// The paper-cut Karachi street (v13 "Parat"): sky, far rooftops, a mid street, a dark near plane with
// one small lit arch window. Four planes; Parallax (a client wrapper) moves them apart with the
// pointer, the phone's tilt and scrolling through CSS variables. Drawn on the server, decoration only.
import { streetColors, type StreetTime } from '@pohnch/ui/theme';
import { arch, seeded } from '../_lib/loop';
import { farRoofs, midStreet, type Shape } from '../_lib/street';

const W = 1200;

function draw(shapes: Shape[], fill: string) {
  return shapes.map((s, i) =>
    s.rect ? <rect key={i} x={s.rect[0]} y={s.rect[1]} width={s.rect[2]} height={s.rect[3]} rx={s.rect[4] ?? 0} fill={fill} />
      : s.stroke ? <path key={i} d={s.d} stroke={fill} strokeWidth={s.stroke} fill="none" strokeLinecap="round" />
        : <path key={i} d={s.d} fill={fill} />,
  );
}

export function Street({ time = 'morning', h = 300, window: lit = true, near = true, rickshaw = true, ground, sky = true }: { time?: StreetTime; h?: number; window?: boolean; near?: boolean; rickshaw?: boolean; ground?: string; sky?: boolean }) {
  const base = streetColors[time];
  const p = ground ? { ...base, near: ground, edge: 'rgba(31,42,92,.12)' } : base;
  const night = time === 'night' || time === 'evening';
  const r = seeded(11);
  const stars = time === 'night' ? Array.from({ length: 40 }, (_, i) => <circle key={i} cx={Math.round(r() * W)} cy={Math.round(r() * h * 0.5)} r={r() < 0.3 ? 1.6 : 1} fill="#fff" style={{ animation: `s-twinkle ${(2 + r() * 3).toFixed(1)}s ${(r() * 3).toFixed(1)}s infinite` }} />) : null;
  const farBase = h - 70;
  const midBase = h - 52;
  const mid = midStreet(W, midBase);
  const nearD = `M-10 ${h - 58} C${W * 0.18} ${h - 70} ${W * 0.42} ${h - 48} ${W * 0.62} ${h - 62} S${W * 0.9} ${h - 68} ${W + 10} ${h - 56} L${W + 10} ${h + 2} L-10 ${h + 2} Z`;
  const box = `0 0 ${W} ${h}`;
  return (
    <div className="street" aria-hidden="true" style={{ background: sky ? `linear-gradient(180deg, ${p.sky1}, ${p.sky2})` : 'transparent' }}>
      {sky ? <svg viewBox={box} preserveAspectRatio="xMidYMax slice">
        {stars}
        {time === 'night'
          ? <><circle cx={W * 0.2} cy={h * 0.28} r="16" fill={p.sun} /><circle cx={W * 0.2 + 8} cy={h * 0.28 - 5} r="15" fill={p.sky1} /></>
          : <><circle cx={W * 0.2} cy={h * 0.3} r="60" fill={p.sun} opacity=".35" /><circle cx={W * 0.2} cy={h * 0.3} r="26" fill={p.sun} /></>}
      </svg> : null}
      {sky ? <div className="cloud" /> : null}
      <svg className="l1" viewBox={box} preserveAspectRatio="xMidYMax slice">{draw(farRoofs(W, farBase), p.far)}</svg>
      {sky ? <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%', background: `linear-gradient(180deg, rgba(0,0,0,0), ${p.haze})` }} /> : null}
      <svg className="l2" viewBox={box} preserveAspectRatio="xMidYMax slice">
        {draw(mid.solid, p.mid)}
        {draw(mid.windows, night ? 'rgba(255,214,140,.95)' : 'rgba(255,255,255,.2)')}
        {draw(mid.lines, p.mid)}
        {rickshaw ? (
          <g transform={`translate(${W * 0.54} ${midBase - 26})`}>
            <path d="M0 18 L4 4 Q6 0 12 0 L30 0 Q36 0 36 6 L36 18 Z" fill={p.near} />
            <circle cx="8" cy="20" r="5" fill={p.near} /><circle cx="30" cy="20" r="5" fill={p.near} />
            <rect x="14" y="4" width="10" height="7" rx="2" fill={p.haze} />
          </g>
        ) : null}
      </svg>
      {near ? (
        <svg className="l3" viewBox={box} preserveAspectRatio="xMidYMax slice">
          <path d={nearD} fill={p.near} />
          <path d={nearD} fill="none" stroke={p.edge} strokeWidth="1.5" opacity=".8" />
          {lit && !ground ? (
            <>
              <path d={arch(W * 0.06, h - 58, 34, 46)} fill="#F6C46E" />
              <path d={arch(W * 0.06 + 6, h - 51, 22, 38)} fill="#FFE7B0" />
            </>
          ) : null}
        </svg>
      ) : null}
    </div>
  );
}
