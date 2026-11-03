// The landing page's hero (v8): the Pohnch map, alive. Warm land, white roads, a park and water; the
// route flows toward your home pin while our top-down van drives along it, ripples spreading from it;
// a frosted card says how many minutes. Pure SVG and CSS (no JavaScript, nothing loaded): the van
// rides the route with SVG animateMotion, and people who ask for less motion see it parked instead.
// Decoration only: hidden from screen readers (the headline next to it says the same in words).
import { t, type Lang } from '@pohnch/messages';
import { colors, mapColors } from '@pohnch/ui/theme';

const ROUTE = 'M40 380 C 120 380 120 300 200 290 S 300 200 330 170 S 380 90 440 80';

export function LivingMap({ lang }: { lang: Lang }) {
  const rtl = lang === 'ur';
  return (
    <div aria-hidden="true" style={{ position: 'relative', width: '100%', maxWidth: 480, aspectRatio: '480 / 460', borderRadius: 32, overflow: 'hidden', background: mapColors.land, boxShadow: '0 30px 60px rgba(20,26,51,.18), 0 2px 0 rgba(20,26,51,.04)' }}>
      <svg viewBox="0 0 480 460" width="100%" height="100%" style={{ display: 'block' }}>
        {/* city */}
        <rect x="0" y="0" width="480" height="460" fill={mapColors.land} />
        <rect x="20" y="40" width="140" height="110" rx="14" fill={mapColors.parks} />
        <path d="M300 460 C 330 400 420 380 480 390 L480 460 Z" fill={mapColors.water} />
        {[60, 150, 250, 350, 430].map((x) => <rect key={`v${x}`} x={x} y="0" width="14" height="460" fill={mapColors.road} />)}
        {[30, 130, 230, 330, 420].map((y) => <rect key={`h${y}`} x="0" y={y} width="480" height="12" fill={mapColors.road} />)}
        {[[180, 160], [270, 60], [370, 250], [90, 260], [190, 360]].map(([x, y]) => <rect key={`b${x}${y}`} x={x} y={y} width="56" height="50" rx="6" fill={mapColors.building} />)}
        {/* the road behind (solid) and ahead (flowing dashes) */}
        <path d={ROUTE} fill="none" stroke={colors.neel} strokeOpacity=".18" strokeWidth="14" strokeLinecap="round" />
        <path className="pohnch-flow" d={ROUTE} fill="none" stroke={colors.neel} strokeWidth="5" strokeLinecap="round" strokeDasharray="2 12" />
        {/* home pin */}
        <g transform="translate(440 80)">
          <circle className="pohnch-ping" r="16" fill={colors.zamurrad} opacity=".5" />
          <circle r="16" fill={colors.zamurrad} stroke={colors.white} strokeWidth="4" />
          <path d="M-6 2 L0 -5 L6 2 V7 H-6 Z" fill={colors.white} />
        </g>
        {/* the van, driving the route */}
        <g className="pohnch-van">
          <circle className="pohnch-ripple" r="30" fill={colors.neel} />
          <circle className="pohnch-ripple late" r="30" fill={colors.neel} />
          <g transform="rotate(90) translate(-40 -40)">
            <ellipse cx="42" cy="44" rx="13" ry="22" fill={colors.siyahi} opacity=".22" />
            <rect x="27" y="17" width="26" height="46" rx="9" fill={colors.neel} stroke={colors.white} strokeWidth="3" />
            <rect x="31" y="22" width="18" height="9" rx="3" fill={mapColors.water} />
            <rect x="37" y="34" width="6" height="22" rx="3" fill={colors.kesar} />
          </g>
          <animateMotion dur="9s" repeatCount="indefinite" rotate="auto" keyPoints="0;0.92;0.92" keyTimes="0;0.85;1" calcMode="spline" keySplines="0.45 0 0.35 1;0 0 1 1" path={ROUTE} />
        </g>
        {/* parked, for less motion */}
        <g className="pohnch-van-still" style={{ display: 'none' }} transform="translate(330 170) rotate(-40) rotate(90) translate(-40 -40)">
          <rect x="27" y="17" width="26" height="46" rx="9" fill={colors.neel} stroke={colors.white} strokeWidth="3" />
          <rect x="37" y="34" width="6" height="22" rx="3" fill={colors.kesar} />
        </g>
      </svg>
      {/* the frosted minutes card */}
      <div dir={rtl ? 'rtl' : 'ltr'} style={{ position: 'absolute', insetInline: 18, bottom: 18, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 22, background: 'rgba(255,255,255,.78)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', boxShadow: '0 10px 30px rgba(20,26,51,.14)' }}>
        <span style={{ width: 10, height: 10, borderRadius: 5, background: colors.zamurrad, flex: 'none' }} />
        <span style={{ flex: 1, fontWeight: 700, fontSize: 17 }}>{t(lang, 'web.map.van')}</span>
        <bdi dir="ltr" style={{ fontFamily: 'var(--font-latin), sans-serif', fontWeight: 800, fontSize: 34, lineHeight: 1, color: colors.siyahi }}>6</bdi>
        <span style={{ fontWeight: 700, color: colors.ink2 }}>{t(lang, 'min.short')}</span>
      </div>
    </div>
  );
}
