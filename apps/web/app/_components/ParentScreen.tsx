'use client';
// A parent's phone screen in the v13 look, drawn for the website: a small map, the glass slab with
// the arch window, the stepping-stone timeline, and a push sliding in from the top. Presentational:
// the day loop and the try-it toy tell it what to show.
import { EtaWindow } from './EtaWindow';

export type Stone = 'done' | 'now' | 'todo';
export type ParentCopy = { van: string; driver: string; unit: string; here: string; app: string; now: string };

export function ParentScreen({ copy, minutes, here, title, stones, push, extra, uid }: { copy: ParentCopy; minutes: number | null; here?: string; title: string; stones: Stone[]; push: string | null; extra?: React.ReactNode; uid: string }) {
  return (
    <div className="phone-screen">
      <div className="phone-notch" />
      <svg aria-hidden="true" viewBox="0 0 300 380" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '70%' }}>
        <rect width="300" height="380" fill="#EDE4D3" />
        <rect x="170" y="70" width="90" height="60" rx="14" fill="#D9E8C6" />
        <g stroke="#fff" strokeWidth="12"><path d="M0 110 H300M0 250 H300M60 0 V380M220 0 V380" /></g>
        <path d="M40 380 C 60 300 120 280 150 230 S 220 160 230 90" stroke="#2B3A7E" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path className="flow" d="M40 380 C 60 300 120 280 150 230 S 220 160 230 90" stroke="#F6C46E" strokeWidth="3" fill="none" strokeDasharray="2 12" strokeLinecap="round" />
        <circle cx="230" cy="90" r="11" fill="#17705A" stroke="#fff" strokeWidth="3" />
        <g transform="translate(150 230) rotate(-35)"><rect x="-11" y="-19" width="22" height="38" rx="8" fill="#1F2A5C" stroke="#fff" strokeWidth="3" /><rect x="-2.5" y="-4" width="5" height="16" rx="2.5" fill="#E8A33D" /></g>
      </svg>
      <div className={`push glass${push ? ' on' : ''}`} role="status" aria-live="polite">
        <span className="ico" aria-hidden="true" style={{ background: 'linear-gradient(160deg,#3A4A96,#1F2A5C)', display: 'grid', placeItems: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" fill="#E8A33D" /><rect x="5" y="5" width="14" height="14" fill="#E8A33D" transform="rotate(45 12 12)" /><circle cx="12" cy="12" r="3.4" fill="#1F2A5C" /></svg>
        </span>
        <div style={{ flex: 1, minWidth: 0 }}><b>{copy.app} <span style={{ display: 'inline', fontWeight: 600, color: 'var(--ink2)' }}>· {copy.now}</span></b><span>{push ?? ''}</span></div>
      </div>
      <div className="slab glass">
        <div aria-hidden="true" style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(20,26,51,.18)', margin: '0 auto 8px' }} />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <EtaWindow minutes={minutes} w={86} unit={copy.unit} here={here ?? copy.here} uid={uid} />
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
            <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.45 }}>{title}</div>
            <div style={{ fontSize: 14, color: 'var(--ink2)', fontWeight: 700 }}>{copy.driver}</div>
          </div>
        </div>
        <div className="stones" aria-hidden="true">
          {stones.map((s, i) => (
            <span key={i} className={`stone ${s}`}>
              {s === 'done' ? <svg width="11" height="11" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#17705A" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
            </span>
          ))}
        </div>
        {extra}
      </div>
    </div>
  );
}
