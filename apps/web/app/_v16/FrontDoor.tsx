'use client';
// The front door of pohnch.pk (v17): over the calm 3D city, two tall panels sum Pohnch up for
// parents and for drivers (three bullets each, and a real quote once there is one). "For drivers"
// goes to the drivers page. "Show me how it works" asks one optional question, "Where do you live?",
// then hands the chosen area (or none) to the home page, which starts the parent story with it.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { AreaMeter } from '@pohnch/core';
import type { SummaryStatus } from '../_lib/interest';
import { meterLine } from './areaMeter';
import { hhmm } from './hour';
import { DAY, dayState } from './scenes';
import type { AreaId } from '@pohnch/core';
import type { Area } from './Panel';
import type { Words } from './Phone';

const Arrow = () => <svg className="arr" width="22" height="12" viewBox="0 0 22 12" aria-hidden="true"><path d="M1 6h19M15 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
type Quote = { name: string; text: string } | null;

/** A tiny route map for the day dial: start, your home (green pin), the school (kesar flag), and the van on its way. */
const MINI = 'M8 34 C 44 34, 56 14, 92 16 S 150 34, 174 14';
function MiniRoute({ u }: { u: number }) {
  const path = useRef<SVGPathElement>(null), van = useRef<SVGGElement>(null), home = useRef<SVGGElement>(null);
  useEffect(() => {
    const p = path.current; if (!p) return; const L = p.getTotalLength();
    const put = (g: SVGGElement | null, k: number) => { if (!g) return; const pt = p.getPointAtLength(L * k); g.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`); };
    put(home.current, 0.5); put(van.current, Math.min(1, Math.max(0, u)));
  }, [u]);
  return (
    <svg className="miniroute" viewBox="0 0 182 44" width="182" height="44" aria-hidden="true">
      <path ref={path} d={MINI} fill="none" stroke="#C9B48E" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 6" />
      <g ref={home}><path d="M0 -12a5 5 0 0 1 5 5c0 4-5 9-5 9s-5-5-5-9a5 5 0 0 1 5-5z" fill="#17705A" /><circle cy="-7" r="1.8" fill="#FAF6EE" /></g>
      <g transform="translate(174 14)"><path d="M0 0V-14" stroke="#141A33" strokeWidth="1.6" /><path d="M0 -14h9l-3 3.5 3 3.5H0z" fill="#E8A33D" stroke="#141A33" strokeWidth="1" /></g>
      <g ref={van}><rect x="-7" y="-5" width="14" height="10" rx="3" fill="#1F2A5C" stroke="#141A33" strokeWidth="1" /><path d="M0 -2.4l.8 1.6 1.7.2-1.3 1.1.4 1.7L0 1.7-1.6 2.6l.4-1.7-1.3-1.1 1.7-.2z" fill="#E8A33D" /></g>
    </svg>
  );
}

const fill = (t: string | undefined, v: Record<string, string>) => (t ?? '').replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');

/** "A school day" (v19): drag through the day and the city behind the front door follows the van; below,
 *  your area's live meter (or the way to pick your area). Opens at the real Karachi time. */
function DayStrip({ w, min, night, nowMin, onDay, areaLabel, meter, status, onPickArea }: {
  w: Words; min: number | null; night: boolean; nowMin: number | null; onDay: (m: number) => void;
  areaLabel: string | null; meter: AreaMeter | undefined; status: SummaryStatus; onPickArea: () => void;
}) {
  if (min == null) return <div className="daystrip" aria-hidden="true" />;
  const d = dayState(min, 0.5), h = Math.floor(min / 60), m = Math.floor(min % 60);
  const caption = fill(w[`day.${d.key}`], { m: String(d.m ?? '') });
  const pct = (x: number) => `${((x - DAY.start) / (DAY.end - DAY.start)) * 100}%`;
  return (
    <div className="daystrip" data-testid="daystrip">
      <div className="dial">
        <div className="dtop"><label htmlFor="daydial" className="dk">{w['day.k']}</label><span className="dhint">{w['day.hint']}</span></div>
        <div className="dtrack">
          <input id="daydial" className="range" type="range" min={DAY.start} max={DAY.end} step={1} value={min} onChange={(e) => onDay(Number(e.target.value))} aria-label={w['day.label']} aria-valuetext={`${hhmm(h, m)} · ${caption}`} data-testid="daydial" />
          {[DAY.door, DAY.school, DAY.homeTime].map((x) => <i key={x} className="mark" style={{ insetInlineStart: pct(x) }} aria-hidden="true" />)}
          {nowMin != null && !night && <span className="now" style={{ insetInlineStart: pct(nowMin) }} aria-hidden="true">{w['day.now']}</span>}
        </div>
        <div className="caprow"><p className="cap" aria-live="polite" data-testid="daycap"><b className="num" dir="ltr">{hhmm(h, m)}</b><span>{caption}</span></p><MiniRoute u={d.u} /></div>
        {night && <small className="dnight">{w['day.night']}</small>}
      </div>
      <div className="arealine" data-testid="arealine">
        {areaLabel ? <><span className={status === 'loading' ? 'checking' : undefined} aria-live="polite">{status === 'loading' ? fill(w['meter.checking'], { area: areaLabel }) : status === 'error' ? fill(w['meter.error'], { area: areaLabel }) : meterLine(w, areaLabel, meter)}</span><button type="button" className="link" onClick={onPickArea}>{w['meter.change']}</button></>
          : <button type="button" className="link" onClick={onPickArea}>{w['meter.pick']}</button>}
      </div>
    </div>
  );
}

export function FrontDoor({ w, areas, driversHref, quotes, onParents, onArea, day, area, meter, meterStatus }: {
  w: Words; areas: Area[]; driversHref: string; quotes: { parent: Quote; driver: Quote };
  onParents: (area: AreaId | null) => void;
  /** v19: pick an area without starting the story (from the area line under the day dial). */
  onArea: (area: AreaId | null) => void;
  day: { min: number | null; night: boolean; nowMin: number | null; onDay: (m: number) => void };
  area: AreaId | null; meter: AreaMeter | undefined; meterStatus: SummaryStatus;
}) {
  // the area question opens either to start the story ('story') or only to set your area ('area')
  const [asking, setAsking] = useState<false | 'story' | 'area'>(false);
  const sheet = useRef<HTMLDivElement>(null), opener = useRef<HTMLElement | null>(null);
  // a real dialog: focus moves in, Tab stays inside, Escape closes, and focus returns to the button that opened it
  useEffect(() => {
    if (!asking) return;
    opener.current = document.activeElement as HTMLElement | null;
    const box = sheet.current;
    (box?.querySelector<HTMLElement>('[aria-current="true"]') ?? box?.querySelector<HTMLElement>('button'))?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setAsking(false); return; }
      if (e.key !== 'Tab' || !box) return;
      const all = [...box.querySelectorAll<HTMLElement>('button, a[href]')]; const first = all[0], last = all[all.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    addEventListener('keydown', key);
    return () => { removeEventListener('keydown', key); opener.current?.focus({ preventScroll: true }); };
  }, [asking]);
  const pick = (a: AreaId | null) => { const mode = asking; setAsking(false); if (mode === 'area') onArea(a); else onParents(a); };
  const areaLabel = area ? areas.find((x) => x.id === area)?.label ?? null : null;
  const panel = (role: 'parent' | 'driver', q: Quote, action: React.ReactNode) => (
    <article className={`door ${role}`} data-testid={`door-${role}`}>
      <h2>{w[`door.${role}.t`]}</h2>
      <ul>{[1, 2, 3].map((n) => <li key={n}>{w[`door.${role}.${n}`]}</li>)}</ul>
      {q ? <figure className="dq"><blockquote>{q.text}</blockquote><figcaption>{q.name}</figcaption></figure> : null}
      <div className="door-act">{action}</div>
    </article>
  );
  return (
    <div className="frontdoor">
      <div className="door-head">
        <p className="kick">{w['hero.k']}</p>
        <h1 id="h-hero">{w['door.h']}</h1>
        <p className="lede">{w['door.ask']}</p>
      </div>
      <div className="doors">
        {panel('parent', quotes.parent, <button type="button" className="btn" onClick={() => setAsking('story')} aria-haspopup="dialog">{w['door.parent.go']}<Arrow /></button>)}
        {panel('driver', quotes.driver, <a className="btn ghost" href={driversHref}>{w['door.driver.go']}<Arrow /></a>)}
      </div>
      <DayStrip w={w} min={day.min} night={day.night} nowMin={day.nowMin} onDay={day.onDay} areaLabel={areaLabel} meter={meter} status={meterStatus} onPickArea={() => setAsking('area')} />
      {asking && createPortal(
        <div className="area-sheet" role="dialog" aria-modal="true" aria-labelledby="area-q" ref={sheet} onClick={(e) => { if (e.target === e.currentTarget) setAsking(false); }}>
          <div className="area-card">
            <h2 id="area-q">{w['area.q']}</h2>
            <p>{w['area.p']}</p>
            <div className="area-list">{areas.filter((a) => a.id !== 'other').map((a) => <button key={a.id} type="button" onClick={() => pick(a.id)} data-area={a.id} aria-current={a.id === area ? 'true' : undefined}>{a.label}</button>)}</div>
            <button type="button" className="link" onClick={() => pick(null)}>{w['area.skip']}<Arrow /></button>
          </div>
        </div>, sheet.current?.closest('.v16') ?? document.querySelector('.v16') ?? document.body,
      )}
    </div>
  );
}
