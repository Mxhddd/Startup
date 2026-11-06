// The lit 3D map (v13): a pitched ground with real CSS 3D buildings lit from the top left, the route
// raised above the ground with its own shadow, the van with a ground shadow driving to the home pin,
// and haze at the horizon. Server-drawn; the van moves with SVG animateMotion (parked with less motion).
import type { CSSProperties } from 'react';

const ROUTE = 'M300 900 C 300 760 240 700 250 600 C 260 500 380 470 380 380 C 380 320 370 290 380 250';
const SPOTS: [number, number, number, number, number][] = [
  [30, 40, 80, 60, 34], [140, 30, 60, 46, 56], [30, 150, 54, 80, 26], [300, 40, 80, 50, 40], [450, 30, 70, 70, 64],
  [500, 150, 80, 60, 30], [30, 340, 66, 60, 44], [150, 340, 50, 50, 72], [450, 340, 90, 60, 36], [300, 470, 60, 60, 30],
  [30, 560, 70, 80, 40], [460, 560, 80, 60, 50], [150, 700, 60, 60, 34], [440, 700, 70, 60, 46], [270, 160, 60, 40, 22],
];

function Building({ x, y, w, d, h }: { x: number; y: number; w: number; d: number; h: number }) {
  return (
    <div className="bld" style={{ left: x, top: y, width: w, height: d }}>
      <i className="sh" style={{ transform: `translate(${h * 0.35}px, ${h * 0.25}px)` }} />
      <i className="fr" style={{ height: h }} />
      <i className="sd" style={{ left: w, width: h }} />
      <i className="tp" style={{ transform: `translateZ(${h}px)` }} />
    </div>
  );
}

export function LitMap({ style }: { style?: CSSProperties }) {
  return (
    <div className="lit" aria-hidden="true" style={{ background: 'linear-gradient(180deg, #B9CBE6, #F3E2C6 60%)', ...style }}>
      <div className="lit-plane">
        <svg width="640" height="900" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <rect x="140" y="440" width="130" height="90" rx="20" fill="#D9E8C6" />
          <rect x="350" y="610" width="90" height="70" rx="18" fill="#D9E8C6" />
          <g stroke="#DCD1BC" strokeWidth="24" fill="none"><path d="M0 120 H640M0 300 H640M0 660 H640M110 0 V900M420 0 V900" /></g>
          <g stroke="#FFFFFF" strokeWidth="17" fill="none"><path d="M0 120 H640M0 300 H640M0 660 H640M110 0 V900M420 0 V900" /></g>
          <path d={ROUTE} stroke="rgba(20,26,51,.28)" strokeWidth="18" fill="none" strokeLinecap="round" transform="translate(8 11)" style={{ filter: 'blur(4px)' }} />
          <path d={ROUTE} stroke="#2B3A7E" strokeWidth="12" fill="none" strokeLinecap="round" />
          <path className="flow" d={ROUTE} stroke="#F6C46E" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="3 16" />
          <g transform="translate(380 250)">
            <circle className="ripple" r="18" fill="#17705A" />
            <circle r="15" fill="#17705A" stroke="#fff" strokeWidth="4" />
            <path d="M-6 3 L0 -5 L6 3 V8 H-6 Z" fill="#fff" />
          </g>
          <g className="van-moving">
            <circle className="ripple" r="34" fill="#1F2A5C" />
            <circle className="ripple late" r="34" fill="#1F2A5C" />
            <g transform="rotate(90) translate(-40 -40)">
              <rect x="22" y="18" width="40" height="56" rx="12" fill="rgba(10,14,40,.35)" style={{ filter: 'blur(5px)' }} transform="translate(8 10)" />
              <rect x="25" y="13" width="30" height="54" rx="10" fill="#1F2A5C" stroke="#fff" strokeWidth="3" />
              <rect x="29" y="18" width="22" height="11" rx="4" fill="#CFDCE8" />
              <rect x="37" y="32" width="6" height="22" rx="3" fill="#E8A33D" />
              <circle cx="30" cy="64" r="2" fill="#F07A5E" /><circle cx="50" cy="64" r="2" fill="#F07A5E" />
            </g>
            <animateMotion dur="12s" repeatCount="indefinite" rotate="auto-reverse" keyPoints="0;0.9;0.9" keyTimes="0;0.85;1" calcMode="spline" keySplines="0.4 0 0.3 1;0 0 1 1" path={ROUTE} />
          </g>
          <g className="van-still" style={{ display: 'none' }} transform="translate(250 600)">
            <rect x="-15" y="-27" width="30" height="54" rx="10" fill="#1F2A5C" stroke="#fff" strokeWidth="3" />
            <rect x="-3" y="-6" width="6" height="22" rx="3" fill="#E8A33D" />
          </g>
        </svg>
        {SPOTS.map(([x, y, w, d, h], i) => <Building key={i} x={x} y={y} w={w} d={d} h={h} />)}
      </div>
      <div className="lit-haze" />
    </div>
  );
}
