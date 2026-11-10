'use client';
// The two phones on the home page (v16), drawn as real interface, not pictures:
// - ParentPhone: the Pohnch app (a mini map with the van, the minutes to your door, the steps of the
//   trip, an alert at the top) or the lock screen (iPhone Live Activity + Dynamic Island, or the
//   Android ongoing notification).
// - DriverPhone: Pohnch Driver (today's stops, Start trip, the big "Got in" tap).
// The page moves the van on the mini map with setVan() (every frame, no re-render); everything else
// comes in as props when it changes.
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export type Words = Record<string, string>;
export type ParentPhoneProps = {
  w: Words;
  mode: 'map' | 'lock';
  plat?: 'ios' | 'android';
  eta: number | null;          // minutes to your door; null = arrived
  step: number;                // 0 on the way, 1 at the door, 2 in the van, 3 at school
  title: string;
  alert?: string | null;       // the alert sliding down from the top
  off?: boolean;               // "off today": the stop is skipped
  lockP?: number;              // 0..1 lock-screen countdown progress
  className?: string;
};
export type PhoneHandle = { setVan: (k: number) => void };

const ROUTE_D = 'M18 330 C 40 280 70 250 92 206 S 150 140 168 98 S 200 58 214 34';

export const ParentPhone = forwardRef<PhoneHandle, ParentPhoneProps>(function ParentPhone({ w, mode, plat = 'ios', eta, step, title, alert, off, lockP = 0, className }, ref) {
  const path = useRef<SVGPathElement>(null), van = useRef<SVGGElement>(null), home = useRef<SVGGElement>(null), len = useRef(0);
  useImperativeHandle(ref, () => ({
    setVan(k: number) {
      const p = path.current, v = van.current; if (!p || !v) return;
      const L = (len.current ||= p.getTotalLength()), a = p.getPointAtLength(Math.max(0, Math.min(1, k)) * L), b = p.getPointAtLength(Math.min(L, Math.max(0, Math.min(1, k)) * L + 2));
      v.setAttribute('transform', `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${(Math.atan2(b.y - a.y, b.x - a.x) * 57.3 + 90).toFixed(1)})`);
    },
  }), []);
  useEffect(() => { const p = path.current, h = home.current; if (!p || !h) return; const q = p.getPointAtLength(p.getTotalLength() * 0.55); h.setAttribute('transform', `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)})`); }, []);
  const left = Math.max(0, 4 - Math.floor(lockP * 4.4)), here = lockP >= 1;
  return (
    <div className={`v-phone parent ${mode} ${plat} ${off ? 'off' : ''} ${here ? 'here' : ''} ${className ?? ''}`} aria-hidden="true">
      <div className="bezel">
        <div className="scr">
          <div className="island"><i /><span className="num">{mode === 'lock' && plat === 'ios' ? (here ? '✓' : `${left}m`) : ''}</span></div>
          <svg className="mmap" viewBox="0 0 250 360" preserveAspectRatio="xMidYMid slice">
            <rect width="250" height="360" fill="#ECE3D2" />
            <g fill="#E0D2B6"><rect x="10" y="10" width="72" height="62" rx="4" /><rect x="104" y="16" width="56" height="52" rx="4" /><rect x="178" y="10" width="64" height="64" rx="4" /><rect x="10" y="120" width="60" height="70" rx="4" /><rect x="178" y="122" width="64" height="58" rx="4" /><rect x="104" y="212" width="58" height="62" rx="4" /><rect x="10" y="236" width="64" height="62" rx="4" /><rect x="178" y="226" width="64" height="70" rx="4" /></g>
            <g fill="#CFD5B4"><circle cx="134" cy="150" r="16" /></g>
            <g stroke="#FBF7EE" strokeWidth="14" strokeLinecap="round"><path d="M0 98 H250 M0 206 H250 M92 0 V360 M168 0 V360" /></g>
            <path ref={path} d={ROUTE_D} stroke="#1F2A5C" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path className="flow" d={ROUTE_D} stroke="#E8A33D" strokeWidth="2.4" fill="none" strokeDasharray="2 9" strokeLinecap="round" />
            <g transform="translate(214 34)"><circle r="9" fill="#E8A33D" stroke="#fff" strokeWidth="3" /></g>
            <g ref={home} className="homepin"><circle r="9" fill="#17705A" stroke="#fff" strokeWidth="3" /><path className="x" d="M-4 -4 L4 4 M4 -4 L-4 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></g>
            <g ref={van} transform="translate(18 330)"><rect x="-8" y="-13" width="16" height="26" rx="5" fill="#1F2A5C" stroke="#fff" strokeWidth="2.5" /><rect x="-2" y="-4" width="4" height="10" rx="2" fill="#E8A33D" /></g>
          </svg>
          <div className={`alert ${alert ? 'on' : ''}`}>
            <span className="ic"><i /></span>
            <div><b>پہنچ · <span className="num">{w['phone.now']}</span></b><span>{alert ?? ''}</span></div>
          </div>
          <div className="sheet">
            <div className="grab" />
            <div className="row">
              <div className="eta">{eta === null ? <svg viewBox="0 0 40 40" width="40" height="40"><path d="M10 21l7 7 14-15" fill="none" stroke="#0B4A3D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg> : <><b className="num">{eta}</b><small>{(w['phone.eta'] ?? '').split(' ')[0]}</small></>}</div>
              <div className="t"><b>{title}</b><span>{w['phone.van']} · {w['phone.verified']}</span></div>
            </div>
            <div className="beads">{[0, 1, 2, 3].map((k) => <i key={k} className={k < step ? 'd' : k === step ? 'n' : ''} />)}</div>
          </div>
          <div className="lock">
            <div className="lk-day">{w['lock.day']}</div>
            <div className="lk-time num">7:05</div>
            <div className="la ios">
              <div className="la-top"><span className="lm">پہنچ</span><span>{w['phone.van']}</span></div>
              <div className="la-eta"><b className="num">{here ? w['lock.here'] : left}</b>{here ? null : <span>{w['phone.eta']}</span>}</div>
              <div className="la-bar" style={{ ['--la' as string]: (0.15 + 0.85 * lockP).toFixed(3) }}><i /><span className="vdot" /><span className="hdot" /></div>
            </div>
            <div className="la android">
              <div className="an-top"><span className="lm">پہنچ</span><span>Pohnch · {w['phone.now']}</span></div>
              <b>{here ? w['lock.here'] : `${w['lock.away']} · ${left} ${(w['phone.eta'] ?? '').split(' ')[0]}`}</b>
              <div className="la-bar" style={{ ['--la' as string]: (0.15 + 0.85 * lockP).toFixed(3) }}><i /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export function DriverPhone({ w, started, tapped, className }: { w: Words; started: boolean; tapped: boolean; className?: string }) {
  return (
    <div className={`v-phone driver ${started ? 'started' : ''} ${tapped ? 'tapped' : ''} ${className ?? ''}`} aria-hidden="true">
      <div className="bezel">
        <div className="scr">
          <div className="island" />
          <div className="dh"><span className="lm">پہنچ</span><b>{w['sides.driverApp']}</b></div>
          <div className="dtoday">{w['sides.today']}</div>
          <div className="dstart"><span>{w['sides.start']}</span><i className="pulse" /></div>
          <div className="dstops">
            <div className="ds done"><i /><span>{(w['sides.stop'] ?? '').replace('2', '1')}</span></div>
            <div className="ds cur"><i /><span>{w['sides.stop']}</span></div>
            <div className="dtap"><span>{tapped ? '✓ ' : ''}{w['sides.tap']}</span></div>
            <div className="ds"><i /><span>{(w['sides.stop'] ?? '').replace('2', '3')}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
