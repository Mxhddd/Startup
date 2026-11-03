// The parent app's state. Screens read from useParent().
// One child is "selected" (the first by default); everything else follows from that child:
// their van (once approved), their stop, today's trip, its steps and the van's latest position.
// Live updates come from Supabase Realtime; a 30-second refresh catches anything missed.
import { parent, type Child, type Membership, type MyStop, type ParentTrip, type ParentVan, type Position } from '@pohnch/client';
import {
  addDays, ApiError, arrivedAt, canUndoChutti, storyOf, defaultRunKind, etaMinutes, karachiDate, signalState, timelineFor, type ParentEvent,
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
  trail: { lat: number; lng: number }[];
  stopsAhead: number | null;
  absences: string[];
  /** The van's days off from today on (YYYY-MM-DD). */
  vanDaysOff: string[];
  /** v8: the school pin, and whether this child's family already said "we're ready" on the running trip. */
  school: { lat: number; lng: number } | null;
  ready: boolean;
};

const empty: Data = {
  loading: true, error: null, children: [], membership: null, van: null, driverName: null, stop: null,
  trips: [], events: [], position: null, speeds: [], trail: [], stopsAhead: null, absences: [], vanDaysOff: [], school: null, ready: false,
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
      const [driverName, stop, trips, absences, vanDaysOff, school] = await Promise.all([
        van && approved ? parent.driverName(van.driver_id) : Promise.resolve(null),
        approved && membership?.stop_id ? parent.myStop(membership.stop_id) : Promise.resolve(null),
        van && approved ? parent.tripsToday(van.id) : Promise.resolve([]),
        parent.absenceDates(child.id),
        van && approved ? parent.vanDaysOff(van.id, karachiDate(new Date())).catch(() => []) : Promise.resolve([]),
        van && approved ? parent.schoolPoint(van.id).catch(() => null) : Promise.resolve(null),
      ]);
      const running = trips.find((x) => x.status === 'running') ?? null;
      const shown = running ?? trips[trips.length - 1] ?? null;
      const [events, position, recent, stopsAhead, ready] = await Promise.all([
        shown && van ? parent.eventsOf(shown.id, { id: van.driver_id, name: driverName }) : Promise.resolve([]),
        running ? parent.latestPosition(running.id) : Promise.resolve(null),
        running ? parent.recentPositions(running.id) : Promise.resolve([]),
        running ? parent.stopsAhead(child.id) : Promise.resolve(null),
        running ? parent.isReady(running.id, child.id).catch(() => false) : Promise.resolve(false),
      ]);
      setChildId(child.id);
      const speeds = recent.slice(0, 6).map((r) => r.speed);
      // The trail: positions from the last 3 minutes, oldest first.
      const since = Date.now() - 3 * 60_000;
      const trail = recent.filter((r) => Date.parse(r.recorded_at) >= since).reverse().map((r) => ({ lat: r.lat, lng: r.lng }));
      setD({ loading: false, error: null, children, membership, van, driverName, stop, trips, events, position, speeds, trail, stopsAhead, absences, vanDaysOff, school, ready });
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

  // v8: after pick-up in the morning, minutes to school (when the driver has placed it).
  const schoolEta = useMemo(() => {
    if (!running || running.kind !== 'morning' || !d.position || !d.school) return null;
    const picked = timeline.items.some((i) => i.step === 'picked' && i.at);
    const atSchool = timeline.items.some((i) => i.step === 'reached_school' && i.at);
    if (!picked || atSchool) return null;
    return etaMinutes({ van: { latitude: d.position.lat, longitude: d.position.lng }, target: { latitude: d.school.lat, longitude: d.school.lng }, recentSpeeds: d.speeds, stopsAhead: 0 });
  }, [running, d.position, d.school, d.speeds, timeline]);
  // v8: since when the van has been at the door (counting up), and the story of a finished run.
  const doorSince = child && timeline.arriving ? arrivedAt(child.id, d.events) : null;
  const story = !running && shownTrip?.status === 'ended' ? storyOf(kind, timeline.items) : null;

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
    async sayReady() {
      if (!child || !running) return;
      setD((old) => ({ ...old, ready: true }));
      await parent.sayReady(running.id, child.id).catch(() => setD((old) => ({ ...old, ready: false })));
    },
    async toggleChutti(date: string) {
      if (!child) return;
      if (d.absences.includes(date)) await parent.parentApi.clearAbsence(child.id, date);
      else await parent.parentApi.setAbsence(child.id, date);
      await refresh();
    },
  };

  return {
    ...d, child, phase, running, shownTrip, kind, timeline, signal, eta, today, now, schoolEta, doorSince, story,
    absentToday: d.absences.includes(today),
    /** The driver gave the whole van today (or tomorrow) off. */
    vanOff: d.vanDaysOff.includes(today) ? ('today' as const) : d.vanDaysOff.includes(addDays(today, 1)) ? ('tomorrow' as const) : null,
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
