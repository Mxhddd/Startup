'use client';
// The front door of pohnch.pk (v17): over the calm 3D city, two tall panels sum Pohnch up for
// parents and for drivers (three bullets each, and a real quote once there is one). "For drivers"
// goes to the drivers page. "Show me how it works" asks one optional question, "Where do you live?",
// then hands the chosen area (or none) to the home page, which starts the parent story with it.
import { useEffect, useRef, useState } from 'react';
import type { AreaId } from '@pohnch/core';
import type { Area } from './Panel';
import type { Words } from './Phone';

const Arrow = () => <svg className="arr" width="22" height="12" viewBox="0 0 22 12" aria-hidden="true"><path d="M1 6h19M15 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
type Quote = { name: string; text: string } | null;

export function FrontDoor({ w, areas, driversHref, quotes, onParents, onPlay }: {
  w: Words; areas: Area[]; driversHref: string; quotes: { parent: Quote; driver: Quote };
  onParents: (area: AreaId | null) => void; onPlay: () => void;
}) {
  const [asking, setAsking] = useState(false);
  const sheet = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!asking) return;
    sheet.current?.querySelector<HTMLElement>('button')?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAsking(false); };
    addEventListener('keydown', esc); return () => removeEventListener('keydown', esc);
  }, [asking]);
  const pick = (a: AreaId | null) => { setAsking(false); onParents(a); };
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
        {panel('parent', quotes.parent, <><button type="button" className="btn" onClick={() => setAsking(true)} aria-haspopup="dialog">{w['door.parent.go']}<Arrow /></button><button type="button" className="play" onClick={onPlay}><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 2l9 5-9 5z" fill="currentColor" /></svg>{w.play}</button></>)}
        {panel('driver', quotes.driver, <a className="btn ghost" href={driversHref}>{w['door.driver.go']}<Arrow /></a>)}
      </div>
      {asking && (
        <div className="area-sheet" role="dialog" aria-modal="true" aria-labelledby="area-q" ref={sheet} onClick={(e) => { if (e.target === e.currentTarget) setAsking(false); }}>
          <div className="area-card">
            <h2 id="area-q">{w['area.q']}</h2>
            <p>{w['area.p']}</p>
            <div className="area-list">{areas.filter((a) => a.id !== 'other').map((a) => <button key={a.id} type="button" onClick={() => pick(a.id)} data-area={a.id}>{a.label}</button>)}</div>
            <button type="button" className="link" onClick={() => pick(null)}>{w['area.skip']}<Arrow /></button>
          </div>
        </div>
      )}
    </div>
  );
}
