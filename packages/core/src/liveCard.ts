// What the iPhone Live Activity / Dynamic Island (and the Android live notification) show for a
// trip, as plain values the widget can draw. Built once here, so the app now (and the server later,
// when it updates a locked phone) fill the card the same way.
import { childPlace, type TimelineItem } from './parent';

export type LiveState = 'coming' | 'arriving' | 'inVan' | 'atSchool' | 'home' | 'stale';

export type LiveCard = {
  state: LiveState;
  /** The child's initial, for the compact Island. */
  initial: string;
  /** The small line on top ("Ali's van is on its way"). */
  lead: string;
  /** Next to the big number ("min to your door"), or the whole line when there is no number. */
  headline: string;
  /** When the van should arrive (ms since 1970), so the minutes count down by themselves. 0 = none. */
  arriveAt: number;
  /** When the countdown started (ms), for the bar that fills by itself. */
  startAt: number;
  /** 0..1, for the circular gauge in the minimal Island and the lock-screen widget. */
  progress: number;
  /** Minutes as text, for places that can't run a timer. */
  minutes: string;
  /** "2 stops before you" */
  ahead: string;
  /** The bottom line: the last step and who marked it, or "last seen 40 s ago". */
  footer: string;
  /** v9: the step row: how many of three steps are done, and their names joined by "|". */
  steps: number;
  marks: string;
};

export type LiveText = {
  lead: (place: 'coming' | 'inVan' | 'atSchool' | 'home') => string;
  unit: string;
  door: string;
  ahead: (n: number) => string;
  next: string;
  stale: (secondsAgo: number) => string;
  /** v9: the three step names for the step row, joined by "|" ("وین نکلی|بیٹھ گئے|اسکول"). */
  marks: (kind: 'morning' | 'afternoon') => string;
};

/** v9: how many of the three steps in the step row are done (left · in the van · there). */
export function stepsDone(place: 'coming' | 'inVan' | 'atSchool' | 'home'): number {
  return place === 'coming' ? 1 : place === 'inVan' ? 2 : 3;
}

export function buildLiveCard(o: {
  name: string;
  kind: 'morning' | 'afternoon';
  items: TimelineItem[];
  eta: number | 'door' | null;
  now: number;
  /** When this trip's countdown began (the van left), for the progress bar. */
  startedAt: number;
  stopsAhead: number | null;
  stale: boolean;
  secondsAgo: number;
  lastStep: string;
  text: LiveText;
}): LiveCard {
  const place = childPlace(o.kind, o.items);
  const counting = o.eta !== null && (place === 'coming' || (o.kind === 'afternoon' && place === 'inVan'));
  const arriveAt = counting && typeof o.eta === 'number' ? o.now + o.eta * 60_000 : 0;
  const total = arriveAt ? arriveAt - o.startedAt : 0;
  const progress = o.eta === 'door' ? 1 : total > 0 ? Math.min(1, Math.max(0, (o.now - o.startedAt) / total)) : place === 'coming' ? 0 : 1;
  const state: LiveState = o.stale && counting ? 'stale' : o.eta === 'door' && counting ? 'arriving' : place;
  const ahead = o.stopsAhead === null ? '' : o.stopsAhead > 0 ? o.text.ahead(o.stopsAhead) : o.text.next;
  return {
    state,
    initial: o.name.slice(0, 1),
    lead: o.text.lead(place),
    headline: o.eta === 'door' && counting ? o.text.door : counting ? o.text.unit : o.text.lead(place),
    arriveAt: state === 'stale' ? 0 : arriveAt,
    startAt: o.startedAt,
    progress,
    minutes: o.eta === 'door' ? '0' : typeof o.eta === 'number' ? String(o.eta) : '',
    ahead,
    footer: o.stale ? o.text.stale(o.secondsAgo) : o.lastStep,
    steps: stepsDone(place),
    marks: o.text.marks(o.kind),
  };
}

/** v21: a text progress bar any phone can draw (Android's live trip notification): 10 cells, filled first. */
export function textBar(progress: number, cells = 10): string {
  const n = Math.max(0, Math.min(cells, Math.round(progress * cells)));
  return '\u25B0'.repeat(n) + '\u25B1'.repeat(cells - n);
}

/** v21: the Android live trip notification's title and text, from the same card as the Live Activity. */
export function liveText(card: LiveCard, unit: string): { title: string; body: string } {
  const title = card.minutes ? `${card.lead} · ${card.minutes} ${unit}` : card.headline;
  const lines = [card.minutes ? card.headline : card.lead, `${textBar(card.progress)}${card.ahead ? ` · ${card.ahead}` : ''}`];
  if (card.footer) lines.push(card.footer);
  return { title, body: lines.filter(Boolean).join('\n') };
}
