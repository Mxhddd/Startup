'use client';
// The small working demos on pohnch.pk (v16), shared by the home page and the drivers page:
// "Off today" with Undo, the driver's hold-to-tap button, the no-signal underpass, and the
// calls-a-morning counter. Every word comes in as props (w = web.* words in one language).
import { useEffect, useRef, useState } from 'react';
import { ParentPhone, type PhoneHandle, type Words } from './Phone';

// slow motion for recording videos on slow test machines (?timescale=0.125); 1 for everyone else
import { TS } from './timescale';
export { TS };

/* ---------------- try it: three small working demos ---------------- */
export function OffDemo({ w, phone }: { w: Words; phone: React.RefObject<PhoneHandle | null> }) {
  const [off, setOff] = useState(false), [left, setLeft] = useState(0), [msg, setMsg] = useState('');
  useEffect(() => { phone.current?.setVan(0.3); }, [phone]);
  useEffect(() => { if (left <= 0) return; const t = setTimeout(() => setLeft(left - 1), 1000); return () => clearTimeout(t); }, [left]);
  return (
    <article className="demo" data-tilt="">
      <ParentPhone ref={phone} className="mini" w={w} mode="map" eta={off ? null : 4} step={0} off={off} title={off ? w['try.off.btn'] ?? '' : w['morning.1h'] ?? ''} />
      <h3>{w['try.off.t']}</h3><p>{w['try.off.p']}</p>
      <div className="ctl">
        <button type="button" className="btn ghost" aria-pressed={off} disabled={off} onClick={() => { setOff(true); setLeft(5); setMsg(w['try.off.done'] ?? ''); }}>{w['try.off.btn']}</button>
        <span className="msg" aria-live="polite">{msg}{left > 0 && <> · <span className="num">{left}</span> <button type="button" className="undo" onClick={() => { setOff(false); setLeft(0); setMsg(w['try.undone'] ?? ''); }}>{w['try.undo']}</button></>}</span>
      </div>
    </article>
  );
}
export function HoldDemo({ w }: { w: Words }) {
  const [h, setH] = useState(0), [done, setDone] = useState(false), [left, setLeft] = useState(0);
  const raf = useRef(0), t0 = useRef(0);
  useEffect(() => { if (left <= 0) return; const t = setTimeout(() => setLeft(left - 1), 1000); return () => clearTimeout(t); }, [left]);
  const begin = (e: React.PointerEvent | React.KeyboardEvent) => {
    if (done) return; if ('pointerId' in e) { try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* ignore */ } }
    t0.current = performance.now();
    const step = () => { const k = Math.min(1, (performance.now() - t0.current) / (800 / TS)); setH(k); if (k >= 1) { setDone(true); setLeft(5); return; } raf.current = requestAnimationFrame(step); };
    raf.current = requestAnimationFrame(step);
  };
  const end = () => { cancelAnimationFrame(raf.current); if (!done) setH(0); };
  return (
    <article className="demo" data-tilt="">
      <div className="hold-stage">
        <button type="button" className={`holdbtn ${done ? 'done' : ''}`} style={{ ['--h' as string]: h }} onPointerDown={begin} onPointerUp={end} onPointerCancel={end} onPointerLeave={end} onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); begin(e); } }} onKeyUp={end} onContextMenu={(e) => e.preventDefault()}>
          <span className="fill" /><b>{done ? w['try.hold.done'] : w['try.hold.btn']}</b>{!done && <small>{w['try.hold.s']}</small>}
        </button>
      </div>
      <h3>{w['try.hold.t']}</h3><p>{w['try.hold.p']}</p>
      <div className="ctl"><span className="msg" aria-live="polite">{left > 0 && <><span className="num">{left}</span> <button type="button" className="undo" onClick={() => { setDone(false); setH(0); setLeft(0); }}>{w['try.undo']}</button></>}</span></div>
    </article>
  );
}
export function SignalDemo({ w }: { w: Words }) {
  const [x, setX] = useState(20);
  const inTunnel = x >= 45 && x <= 70, after = x > 70;
  return (
    <article className="demo" data-tilt="">
      <div className={`road-demo ${inTunnel ? 'lost' : after ? 'back' : ''}`}>
        <div className="tunnel" aria-hidden="true" />
        <div className="vanchip" style={{ insetInlineStart: `calc(${x}% - 22px)` }} aria-hidden="true"><i /></div>
        <span className="status">{inTunnel ? w['try.sig.lost'] : after ? w['try.sig.back'] : w['try.sig.live']}</span>
        <input type="range" min={0} max={100} value={x} onChange={(e) => setX(Number(e.target.value))} aria-label={w['try.sig.label']} />
      </div>
      <h3>{w['try.sig.t']}</h3><p>{w['try.sig.p']}</p>
    </article>
  );
}
export function CallsCounter({ label }: { label: string }) {
  const [n, setN] = useState(14);
  useEffect(() => { if (n <= 0) return; const t = setTimeout(() => setN(n - 1), n === 14 ? 600 : 110); return () => clearTimeout(t); }, [n]);
  return <div className={`counter ${n === 0 ? 'calm' : ''}`}><b className="num">{n}</b><span>{label}</span></div>;
}
