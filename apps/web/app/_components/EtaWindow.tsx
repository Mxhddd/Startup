'use client';
// The one arch on the screen (v13): a glass window holding "minutes to your door". The light inside
// warms from neel to kesar as the van comes closer. With `loop`, it counts 6 → 0 on its own (the hero);
// otherwise it shows the minutes it is given (the day loop, the try-it phones).
import { useEffect, useState } from 'react';
import { arch, warmth } from '../_lib/loop';

function mix(a: string, b: string, t: number): string {
  const p = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  const c = [1, 3, 5].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * t));
  return `rgb(${c.join(',')})`;
}

export function EtaWindow({ minutes, loop = false, w = 132, unit, here, uid = 'e' }: { minutes?: number | null; loop?: boolean; w?: number; unit: string; here: string; uid?: string }) {
  const h = Math.round(w * 1.14);
  const [n, setN] = useState<number | null>(minutes ?? 6);
  useEffect(() => { if (!loop) setN(minutes ?? null); }, [minutes, loop]);
  useEffect(() => {
    if (!loop || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setN((v) => (v === null ? 6 : v <= 0 ? null : v - 1)), 1800);
    return () => clearInterval(id);
  }, [loop]);
  const t = warmth(n);
  const d = arch(2, 2, w - 4, h - 4);
  return (
    <div className="eta" style={{ width: w, height: h }} aria-live={loop ? 'off' : 'polite'}>
      <svg width={w} height={h}>
        <defs>
          <radialGradient id={`${uid}-g`} cx="50%" cy="78%" r="80%">
            <stop offset="0" stopColor="#FFF4DC" />
            <stop offset=".45" stopColor={mix('#9FB2E6', '#F6C46E', t)} />
            <stop offset="1" stopColor={mix('#3A4A96', '#E8A33D', t)} />
          </radialGradient>
          <linearGradient id={`${uid}-r`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" /><stop offset=".5" stopColor="#F2D9A6" /><stop offset="1" stopColor="#B9802A" /></linearGradient>
        </defs>
        <path d={d} fill={`url(#${uid}-g)`} style={{ transition: 'fill .6s' }} />
        <path d={arch(w * 0.09, h * 0.09, w * 0.82, h * 0.86)} fill="rgba(255,255,255,.14)" />
        <path d={d} fill="none" stroke={`url(#${uid}-r)`} strokeWidth="3" />
        <path d={`M${w * 0.2} ${h * 0.38} C${w * 0.24} ${h * 0.2} ${w * 0.38} ${h * 0.12} ${w * 0.5} ${h * 0.08}`} stroke="rgba(255,255,255,.8)" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
      <div className="eta-glow" />
      <div className="eta-num">
        {n === null && here === '' ? (
          <svg key="tick" className="roll" width={w * 0.36} height={w * 0.36} viewBox="0 0 24 24" aria-hidden="true" style={{ marginBottom: '6%' }}><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#0B4A3D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : n === null ? (
          <b key="here" className="roll" style={{ fontSize: w * 0.16, letterSpacing: 0, fontFamily: 'inherit', textAlign: 'center', padding: '0 10%' }}>{here}</b>
        ) : (
          <>
            <b key={n} className="roll" style={{ fontSize: w * 0.44 }}>{n}</b>
            <span style={{ fontWeight: 800, fontSize: Math.max(14, w * 0.11) }}>{unit}</span>
          </>
        )}
      </div>
    </div>
  );
}
