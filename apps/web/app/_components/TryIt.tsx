'use client';
// "Try it" (landing section 3): two phones. Hold the driver's big key (800 ms, like the app) and the
// parent's phone gets the push, the timeline fills and the window says the child is in the van; Undo
// for 5 seconds. On the parent's phone: "Off today" (with Undo) and "We're ready" show up on the
// driver's phone. All local: nothing is sent anywhere.
import { HOLD_MS, UNDO_MS, holdProgress } from '@pohnch/core';
import { useEffect, useRef, useState } from 'react';
import { ParentScreen, type ParentCopy } from './ParentScreen';

export type TryCopy = {
  driverPhone: string; parentPhone: string; stop: string; key: string; hold: string; done: string; undo: string; undone: string;
  again: string; waiting: string; push: string; chutti: string; chuttiDone: string; ready: string; readyDone: string; child: string;
  trip: string; parent: ParentCopy;
};

type State = 'waiting' | 'done' | 'undone';

export function TryIt({ copy }: { copy: TryCopy }) {
  const [state, setState] = useState<State>('waiting');
  const [hold, setHold] = useState(0);
  const [undoLeft, setUndoLeft] = useState(0);
  const [chutti, setChutti] = useState<null | number>(null); // when "off today" was set (for its undo)
  const [ready, setReady] = useState(false);
  const [say, setSay] = useState('');
  const started = useRef<number | null>(null);
  const frame = useRef(0);

  // the hold: fill the key while pressed; confirm at 100 %
  const begin = () => {
    if (state === 'done' || chutti !== null) return;
    started.current = performance.now();
    const tick = () => {
      if (started.current === null) return;
      const p = holdProgress(started.current, performance.now(), HOLD_MS);
      setHold(p);
      if (p >= 1) { started.current = null; setHold(0); setState('done'); setSay(copy.push); setUndoLeft(Math.ceil(UNDO_MS / 1000)); return; }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };
  const end = () => { started.current = null; cancelAnimationFrame(frame.current); setHold(0); };
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // the 5-second undo, for the tap and for "off today"
  useEffect(() => {
    if (undoLeft <= 0) return;
    const id = setTimeout(() => setUndoLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [undoLeft]);

  const undoTap = () => { setState('undone'); setUndoLeft(0); setSay(copy.undone); };
  const reset = () => { setState('waiting'); setChutti(null); setReady(false); setSay(''); setUndoLeft(0); };
  const toggleChutti = () => {
    if (chutti !== null) { setChutti(null); setSay(copy.undone); return; }
    if (state === 'done') return;
    setChutti(Date.now()); setReady(false); setSay(copy.chuttiDone);
  };
  const toggleReady = () => { if (chutti !== null || state === 'done') return; setReady((r) => !r); setSay(ready ? '' : copy.readyDone); };

  const inVan = state === 'done';
  return (
    <div>
      <div className="try-grid">
        {/* the driver's phone (plain, high contrast) */}
        <div>
          <div className="try-label">{copy.driverPhone}</div>
          <div className="phone">
            <div className="phone-screen" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="phone-notch" />
              <div className="lacquer" style={{ padding: '48px 18px 16px', borderRadius: '0 0 24px 24px' }}>
                <div style={{ fontWeight: 800, fontSize: 17 }}>{copy.trip}</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 10 }} aria-hidden="true">{Array.from({ length: 9 }, (_, k) => <i key={k} style={{ flex: 1, height: 6, borderRadius: 3, background: k < 1 || (k === 1 && inVan) ? '#1E8A6E' : k === 1 ? '#E8A33D' : 'rgba(255,255,255,.2)' }} />)}</div>
              </div>
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                <div className="paper" style={{ borderRadius: 20, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="latin" style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--neel)', color: 'var(--ghee)', display: 'grid', placeItems: 'center', fontWeight: 800 }}>2</span>
                    <div style={{ flex: 1 }}><b style={{ fontSize: 20 }}>{copy.child}</b><div style={{ fontSize: 14, color: 'var(--ink2)', fontWeight: 700 }}>{copy.stop}</div></div>
                  </div>
                  {chutti !== null ? <div className="chip" style={{ marginTop: 10, background: '#EEE9DF', color: '#5E5A52' }}>{copy.chutti}</div> : null}
                  {ready && chutti === null ? <div className="chip chip-green" style={{ marginTop: 10 }}>{copy.ready}</div> : null}
                </div>
                <div style={{ marginTop: 'auto' }}>
                  {inVan && undoLeft > 0 ? (
                    <div className="undo-bar"><span>{copy.done} · <bdi className="latin">{undoLeft}</bdi></span><button type="button" onClick={undoTap}>{copy.undo}</button></div>
                  ) : (
                    <button
                      type="button"
                      className="key key-green"
                      data-down={hold > 0 ? 'true' : 'false'}
                      disabled={inVan || chutti !== null}
                      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); begin(); }}
                      onPointerUp={end} onPointerCancel={end} onPointerLeave={end}
                      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); begin(); } }}
                      onKeyUp={end}
                      onContextMenu={(e) => e.preventDefault()}
                      style={{ width: '100%', height: 104, fontSize: 22, flexDirection: 'column', gap: 2 }}
                      data-testid="try-key"
                    >
                      <span className="hold-fill" style={{ ['--hold' as string]: hold }} />
                      <span>{inVan ? copy.done : copy.key}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, opacity: 0.85 }}>{copy.hold}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* the parent's phone */}
        <div>
          <div className="try-label">{copy.parentPhone}</div>
          <div className="phone">
            <ParentScreen
              uid="try"
              copy={copy.parent}
              minutes={inVan ? null : chutti !== null ? null : 2}
              here={inVan ? '' : chutti !== null ? copy.chutti : undefined}
              title={inVan ? copy.done : chutti !== null ? copy.chuttiDone : copy.waiting}
              stones={inVan ? ['done', 'done', 'now', 'todo'] : ['done', 'now', 'todo', 'todo']}
              push={inVan ? copy.push : null}
              extra={
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button type="button" className="key key-sand" aria-pressed={chutti !== null} onClick={toggleChutti} disabled={inVan} style={{ flex: 1, height: 46, fontSize: 15, borderRadius: 14 }} data-testid="try-chutti">{chutti !== null ? copy.undo : copy.chutti}</button>
                  <button type="button" className="key key-sand" aria-pressed={ready} onClick={toggleReady} disabled={inVan || chutti !== null} style={{ flex: 1, height: 46, fontSize: 15, borderRadius: 14 }} data-testid="try-ready">{copy.ready}</button>
                </div>
              }
            />
          </div>
        </div>
      </div>
      <p className="say" role="status" aria-live="polite" data-testid="try-say">{say}</p>
      <p style={{ textAlign: 'center', margin: '6px 0 0' }}>
        <button type="button" className="key key-sand" onClick={reset} style={{ height: 46, padding: '0 18px', fontSize: 15 }}>{copy.again}</button>
      </p>
    </div>
  );
}
