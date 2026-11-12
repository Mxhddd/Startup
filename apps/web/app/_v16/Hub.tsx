'use client';
// "Everything you'd ask" (v19): one place for what used to be a long run of separate sections after the
// story (how it starts, try it, safety, privacy, cost and calls, drivers, questions). Desktop: topics in
// a column on the left, the open one's panel on the right. Phone: the same markup is an accordion.
// It is a disclosure pattern (a button per topic that shows its panel), so it works with a keyboard
// and a screen reader. #safety, #privacy, #questions and the other topic names open their topic.
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { Roundel } from './truckart';

export type HubTopic = { id: string; label: string; content: ReactNode };
/** The address names that open each topic (#safety opens Safety, and so on). */
export const HUB_HASH: Record<string, string> = { '#start': 'how', '#how-it-starts': 'how', '#try': 'try', '#safety': 'safety', '#privacy': 'privacy', '#cost': 'cost', '#for-drivers': 'drivers', '#questions': 'questions' };

export function Hub({ kick, title, lead, topics, open, onOpen }: { kick: string; title: string; lead: string; topics: HubTopic[]; open: string | null; onOpen: (id: string | null) => void }) {
  const [wide, setWide] = useState(true);
  useEffect(() => { const mq = matchMedia('(min-width: 900px)'); const on = () => setWide(mq.matches); on(); mq.addEventListener('change', on); return () => mq.removeEventListener('change', on); }, []);
  return (
    <section id="hub" className="sec hub paper" data-sec="hub" aria-labelledby="h-hub">
      <div className="wrap">
        <p className="kick">{kick}</p>
        <h2 id="h-hub">{title}</h2>
        <p className="hublead">{lead}</p>
        <div className="hubgrid" style={{ ['--n' as string]: topics.length }}>
          {topics.map((t, i) => {
            const isOpen = open === t.id;
            return (
              <Fragment key={t.id}>
                <button type="button" id={`hubtab-${t.id}`} className={`hubtab ${isOpen ? 'open' : ''}`} style={{ ['--row' as string]: i + 1 }}
                  aria-expanded={isOpen} aria-controls={`hub-${t.id}`} onClick={(e) => { const el = e.currentTarget; onOpen(isOpen && !wide ? null : t.id); if (!wide && !isOpen) requestAnimationFrame(() => el.scrollIntoView({ block: 'start', behavior: 'smooth' })); }} data-topic={t.id}>
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
