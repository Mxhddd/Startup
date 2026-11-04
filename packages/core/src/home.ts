// v9: the parent's day as one clear state (canvas "Z9P-Day"): which state the home sheet is in, and
// the one obvious next action for it. Screens draw from this; it decides nothing about colours or words.
import type { TimelineItem } from './parent';

export type HomeState =
  | 'noChild' | 'notOnVan' | 'waiting' | 'vanOff' | 'chutti'
  | 'idle' | 'left' | 'coming' | 'door' | 'inVan' | 'school' | 'leftSchool' | 'home' | 'story';
export type NextAction = 'addChild' | 'join' | 'offToday' | 'undoOff' | 'ready' | 'openTrip' | 'week' | 'plan' | null;

export type HomeInput = {
  phase: 'notConfigured' | 'loading' | 'error' | 'noChild' | 'waiting' | 'notOnVan' | 'idle' | 'live';
  kind: 'morning' | 'afternoon';
  items: TimelineItem[];
  eta: number | 'door' | null;
  vanOff: 'today' | 'tomorrow' | null;
  absentToday: boolean;
  canUndoChutti: boolean;
  ready: boolean;
  /** A run finished today for this child (today's story can be told). */
  storyDone: boolean;
};

const done = (items: TimelineItem[], step: TimelineItem['step']) => items.some((i) => i.step === step && i.at);

export function homeState(i: HomeInput): { state: HomeState; action: NextAction } {
  if (i.phase === 'noChild') return { state: 'noChild', action: 'addChild' };
  if (i.phase === 'notOnVan') return { state: 'notOnVan', action: 'join' };
  if (i.phase === 'waiting') return { state: 'waiting', action: null };
  const live = i.phase === 'live';
  if (!live && i.vanOff === 'today') return { state: 'vanOff', action: 'plan' };
  if (i.absentToday) return { state: 'chutti', action: i.canUndoChutti ? 'undoOff' : 'plan' };
  if (live && i.kind === 'morning') {
    if (done(i.items, 'reached_school')) return { state: 'school', action: 'week' };
    if (done(i.items, 'picked')) return { state: 'inVan', action: 'openTrip' };
    if (i.eta === 'door') return { state: 'door', action: i.ready ? 'openTrip' : 'ready' };
    if (typeof i.eta === 'number') return { state: 'coming', action: i.eta <= 3 && !i.ready ? 'ready' : 'openTrip' };
    return { state: 'left', action: 'offToday' };
  }
  if (live) {
    if (done(i.items, 'dropped')) return { state: 'home', action: 'week' };
    if (i.eta === 'door') return { state: 'door', action: 'openTrip' };
    return { state: 'leftSchool', action: 'openTrip' };
  }
  if (i.storyDone) return { state: 'story', action: 'week' };
  return { state: 'idle', action: i.kind === 'morning' ? 'offToday' : 'plan' };
}
