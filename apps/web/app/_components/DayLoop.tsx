'use client';
// The day loop (landing section 2): a tall section whose inside sticks to the screen while you scroll.
// The van drives the drawn loop (home → school → home), the clock runs, and the phone beside it shows
// what the parent sees at each step, with the push sliding in. With "reduce motion" the same thing
// happens in steps, without the van gliding.
import { useEffect, useMemo, useRef, useState } from 'react';
import { LOOP_STEPS, clockAt, etaAt, stepAt } from '../_lib/loop';
import { useScrollProgress } from '../_lib/hooks';
import { ParentScreen, type ParentCopy, type Stone } from './ParentScreen';

export type LoopCopy = { steps: { t: string; n: string }[]; home: string; school: string; hand: boolean; parent: ParentCopy; waiting: string };

const PATH = 'M520 170 C 520 30, 80 30, 80 170 C 80 310, 520 310, 520 170';

export function DayLoop({ copy }: { copy: LoopCopy }) {
  const box = useRef<HTMLElement>(null);
  const path = useRef<SVGPathElement>(null);
  const progress = useScrollProgress(box);
  const [len, setLen] = useState(1);
  useEffect(() => { if (path.current) setLen(path.current.getTotalLength()); }, []);
  const p = progress;
  const i = stepAt(p);
  const at = path.current ? path.current.getPointAtLength(p * len) : { x: 520, y: 170 };
  const ahead = path.current ? path.current.getPointAtLength(Math.min(len, p * len + 2)) : { x: 520, y: 168 };
  const angle = (Math.atan2(ahead.y - at.y, ahead.x - at.x) * 180) / Math.PI;
  const marks = useMemo(() => LOOP_STEPS.map((s) => (path.current ? path.current.getPointAtLength(s.at * len) : { x: 0, y: 0 })), [len]);
  const step = i >= 0 ? copy.steps[i]! : null;
  const stones: Stone[] = LOOP_STEPS.map((_, k) => (k < i ? 'done' : k === i ? 'now' : 'todo'));
  const minutes = etaAt(p);
  return (
    <section ref={box} className="loop" id="loop" aria-label={copy.steps.map((s) => s.t).join(' · ')}>
      <div className="wrap loop-stage">
        <div>
          <svg className="loop-svg" viewBox="0 0 600 340" aria-hidden="true">
            <path d={PATH} fill="none" stroke="#E2DCCD" strokeWidth="14" strokeLinecap="round" strokeDasharray="1 18" />
            <path ref={path} d={PATH} fill="none" stroke="#1F2A5C" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${p * len} ${len}`} />
            {marks.map((m, k) => (
              <circle key={k} cx={m.x} cy={m.y} r={k === i ? 11 : 8} fill={k < i ? '#17705A' : k === i ? '#E8A33D' : '#FFFDF9'} stroke={k <= i ? '#fff' : '#DCD3C1'} strokeWidth="3" style={{ transition: 'all .3s' }} />
            ))}
            <g transform="translate(520 170)"><circle r="26" fill="#17705A" /><path d="M-10 4 L0 -8 L10 4 V13 H-10 Z" fill="#fff" /></g>
            <g transform="translate(80 170)"><circle r="26" fill="#E8A33D" /><path d="M-12 -2 L0 -9 L12 -2 L0 5 Z M-7 1 V8 C-3 11 3 11 7 8 V1" fill="none" stroke="#141A33" strokeWidth="2.6" strokeLinejoin="round" /></g>
            <text x="520" y="222" textAnchor="middle" fontWeight="800" fontSize="20" fill="#141A33" style={{ fontFamily: 'inherit' }}>{copy.home}</text>
            <text x="80" y="222" textAnchor="middle" fontWeight="800" fontSize="20" fill="#141A33" style={{ fontFamily: 'inherit' }}>{copy.school}</text>
            <g transform={`translate(${at.x} ${at.y}) rotate(${angle})`}>
              <ellipse cx="3" cy="5" rx="24" ry="14" fill="rgba(20,26,51,.25)" />
              <rect x="-22" y="-12" width="44" height="24" rx="8" fill="#1F2A5C" stroke="#fff" strokeWidth="3" />
              <rect x="8" y="-8" width="9" height="16" rx="3" fill="#CFDCE8" />
              <rect x="-14" y="-3" width="18" height="6" rx="3" fill="#E8A33D" />
            </g>
          </svg>
          <div style={{ marginTop: 10 }}>
            <div className="loop-clock"><bdi dir="ltr">{clockAt(p)}</bdi></div>
            <div className="loop-title">{step ? step.t : copy.waiting}</div>
            <div className={`loop-note${copy.hand ? ' hand' : ''}`}>{step ? step.n : ''}</div>
            <div className="loop-dots" aria-hidden="true">{LOOP_STEPS.map((_, k) => <i key={k} className={k < i ? 'on' : k === i ? 'now' : ''} />)}</div>
          </div>
        </div>
        <div className="phone"><ParentScreen uid="loop" copy={copy.parent} minutes={minutes} here={i >= 2 ? '' : undefined} title={step ? step.t : copy.waiting} stones={stones} push={step ? step.t : null} /></div>
      </div>
    </section>
  );
}
