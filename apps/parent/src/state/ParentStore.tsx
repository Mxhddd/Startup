// The parent app's state. Screens read from useParent().
// One child is "selected" (the first by default); everything else follows from that child:
// their van (once approved), their stop, today's trip, its steps and the van's latest position.
// Live updates come from Supabase Realtime; a 30-second refresh catches anything missed.
import { parent, type Child, type Membership, type MyStop, type ParentTrip, type ParentVan, type Position } from '@pohnch/client';
import {
  ApiError, canUndoChutti, defaultRunKind, etaMinutes, karachiDate, signalState, timelineFor, type ParentEvent,
} from '@pohnch/core';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type Data = {
  loading: boolean;
  error: string | null;
  children: Child[];
  membership: Membership | null;
  van: ParentVan | null;
  driverName: string | null;
  stop: MyStop | null;
  trips: ParentTrip[];
  events: ParentEvent[];
  position: Position | null;
  speeds: (number | null)[];
  stopsAhead: number | null;
  absences: string[];
};

const empty: Data = {
  loading: true, error: null, children: [], membership: null, van: null, driverName: null, stop: null,
  trips: [], events: [], position: null, speeds: [], stopsAhead: null, absences: [],
};

function useParentState(enabled: boolean) {
  const [d, setD] = useState<Data>({ ...empty, loading: enabled });
  const [childId, setChildId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const children = await parent.myChildren();
      const child = children.find((c) => c.id === childId) ?? children[0] ?? null;
      if (!child) return setD({ ...empty, loading: false, children });
      const membership = await parent.membershipOf(child.id);
      const approved = membership?.status === 'approved';
      const van = membership ? await parent.van(membership.van_id) : null;
      const [driverName, stop, trips, absences] = await Promise.all([
        van && approved ? parent.driverName(van.driver_id) : Promise.resolve(null),
        approved && membership?.stop_id ? parent.myStop(membership.stop_id) : Promise.resolve(null),
        van && approved ? parent.tripsToday(van.id) : Promise.resolve([]),
        parent.absenceDates(child.id),
      ]);
      const running = trips.find((x) => x.status === 'running') ?? null;
      const shown = running ?? trips[trips.length - 1] ?? null;
      const [events, position, speeds, stopsAhead] = await Promise.all([
        shown && van ? parent.eventsOf(shown.id, { id: van.driver_id, name: driverName }) : Promise.resolve([]),
        running ? parent.latestPosition(running.id) : Promise.resolve(null),
        running ? parent.recentSpeeds(running.id) : Promise.resolve([]),
        running ? parent.stopsAhead(child.id) : Promise.resolve(null),
      ]);
      setChildId(child.id);
      setD({ loading: false, error: null, children, membership, van, driverName, stop, trips, events, position, speeds, stopsAhead, absences });
    } catch (e) {
      setD((old) => ({ ...old, loading: false, error: e instanceof ApiError ? e.code : 'offline' }));
    }
  }, [enabled, childId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const running = d.trips.find((x) => x.status === 'running') ?? null;

  // Live updates for the van, plus a slower safety refresh.
  useEffect(() => {
    if (!enabled || !d.van || d.membership?.status !== 'approved') return;
    const stop = parent.watchVan(d.van.id, running?.id ?? null, () => refresh());
    const id = setInterval(refresh, running ? 30_000 : 120_000);
    return () => {
      stop();
      clearInterval(id);
    };
  }, [enabled, d.van, d.membership?.status, running?.id, refresh]);

  // A clock for "last seen 40 s ago".
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const child = d.children.find((c) => c.id === childId) ?? null;
  const today = karachiDate(new Date(now));
  const shownTrip = running ?? d.trips[d.trips.length - 1] ?? null;
  const kind = shownTrip?.kind ?? defaultRunKind(new Date(now));
  const timeline = child ? timelineFor(kind, child.id, d.events) : { items: [], arriving: false, late: null };
  const signal = d.position ? signalState(Date.parse(d.position.recorded_at), now) : null;
  const vanLeftToday = d.trips.some((x) => x.kind === 'morning') && d.events.some((e) => e.step === 'left' && !e.undone);

  // Minutes: to your stop in the morning before pick-up and in the afternoon before drop-off.
  const eta = useMemo(() => {
    if (!running || !d.position || !d.stop) return null;
    const childDone = timeline.items.some((i) => (i.step === 'picked' || i.step === 'dropped') && i.at);
    if (childDone) return null;
    if (timeline.arriving) return 'door' as const;
    return etaMinutes({
      van: { latitude: d.position.lat, longitude: d.position.lng },
      target: { latitude: d.stop.lat, longitude: d.stop.lng },
      recentSpeeds: d.speeds,
      stopsAhead: d.stopsAhead ?? 0,
    });
  }, [running, d.position, d.stop, d.speeds, d.stopsAhead, timeline]);

  const phase: 'notConfigured' | 'loading' | 'error' | 'noChild' | 'waiting' | 'notOnVan' | 'idle' | 'live' = !enabled
    ? 'notConfigured'
    : d.loading
      ? 'loading'
      : d.error && d.children.length === 0
        ? 'error'
        : !child
          ? 'noChild'
          : !d.membership
            ? 'notOnVan'
            : d.membership.status === 'pending' || !d.van?.verified_at
              ? 'waiting'
              : running
                ? 'live'
                : 'idle';

  const actions = {
    refresh,
    selectChild: (id: string) => setChildId(id),
    async toggleChutti(date: string) {
      if (!child) return;
      if (d.absences.includes(date)) await parent.parentApi.clearAbsence(child.id, date);
      else await parent.parentApi.setAbsence(child.id, date);
      await refresh();
    },
  };

  return {
    ...d, child, phase, running, shownTrip, kind, timeline, signal, eta, today, now,
    absentToday: d.absences.includes(today),
    canUndoChuttiToday: canUndoChutti(today, today, vanLeftToday),
    actions,
  };
}

export type ParentStore = ReturnType<typeof useParentState>;
const Ctx = createContext<ParentStore | null>(null);

export function ParentProvider({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const store = useParentState(enabled);
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useParent(): ParentStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useParent must be inside <ParentProvider>');
  return v;
}
