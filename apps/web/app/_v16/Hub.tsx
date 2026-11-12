'use client';
// "Everything you'd ask" (v19, reused across the site in v20): one place for many answers. Desktop: topics
// in a column on the left, the open one's panel on the right. Phone: the same markup is an accordion.
// It is a disclosure pattern (a button per topic that shows its panel), so it works with a keyboard and a
// screen reader. Links such as #safety open their topic (each page passes its own map of addresses).
// Hub is controlled (the home page keeps the open topic, because its top bar and menu open topics too);
// PageHub keeps its own state for the inner pages (Safety, Drivers).
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { Roundel } from './truckart';

export type HubTopic = { id: string; label: string; content: ReactNode };
/** The home page's addresses that open each topic (#safety opens Safety, and so on). */
export const HUB_HASH: Record<string, string> = { '#start': 'how', '#how-it-starts': 'how', '#try': 'try', '#safety': 'safety', '#privacy': 'privacy', '#cost': 'cost', '#for-drivers': 'drivers', '#questions': 'questions' };

type HubProps = { sid?: string; kick: string; title: string; lead?: string; topics: HubTopic[]; open: string | null; onOpen: (id: string | null) => void; className?: string };

export function Hub({ sid = 'hub', kick, title, lead, topics, open, onOpen, className = '' }: HubProps) {
  const [wide, setWide] = useState(true);
  useEffect(() => { const mq = matchMedia('(min-width: 900px)'); const on = () => setWide(mq.matches); on(); mq.addEventListener('change', on); return () => mq.removeEventListener('change', on); }, []);
  return (
    <section id={sid} className={`sec hub paper ${className}`} data-sec={sid === 'hub' ? 'hub' : undefined} aria-labelledby={`h-${sid}`}>
      <div className="wrap">
        <p className="kick">{kick}</p>
        <h2 id={`h-${sid}`}>{title}</h2>
        {lead ? <p className="hublead">{lead}</p> : null}
        <div className="hubgrid" style={{ ['--n' as string]: topics.length }}>
          {topics.map((t, i) => {
            const isOpen = open === t.id;
            return (
              <Fragment key={t.id}>
                <button type="button" id={`hubtab-${t.id}`} className={`hubtab ${isOpen ? 'open' : ''}`} style={{ ['--row' as string]: i + 1 }}
                  aria-expanded={isOpen} aria-controls={`hub-${t.id}`} data-topic={t.id}
                  onClick={(e) => { const el = e.currentTarget; onOpen(isOpen && !wide ? null : t.id); if (!wide && !isOpen) requestAnimationFrame(() => el.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })); }}>
                  <Roundel size={22} /><span>{t.label}</span><i className="chev" aria-hidden="true" />
                </button>
                <div id={`hub-${t.id}`} className="hubpanel" role="region" aria-labelledby={`hubtab-${t.id}`} hidden={!isOpen} data-testid={`hub-${t.id}`}>{t.content}</div>
              </Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** A hub that keeps its own open topic: opens the first topic, or the one named in the address (#help). */
export function PageHub({ hashes, first, ...rest }: Omit<HubProps, 'open' | 'onOpen'> & { hashes: Record<string, string>; first: string }) {
  const [open, setOpen] = useState<string | null>(first);
  useEffect(() => {
    const go = () => { const t = hashes[location.hash]; if (t) { setOpen(t); setTimeout(() => document.getElementById(`hubtab-${t}`)?.scrollIntoView({ block: 'start' }), 60); } };
    go(); addEventListener('hashchange', go); return () => removeEventListener('hashchange', go);
  }, [hashes]);
  return <Hub {...rest} open={open} onOpen={setOpen} />;
}
