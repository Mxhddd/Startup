// The driver app's state in one place. Screens read from useDriver() and call its actions.
// - Data comes from Supabase (driver.* in packages/client) and refreshes after each action.
// - Taps show on screen at once, are saved in the offline queue, and are sent in order in the background.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { driver, driverApiQueueSend, type JoinRequest, type Stop, type Trip, type Van } from './data';
import { addDays, ApiError, buildRun, createQueue, defaultRunKind, karachiDate, runProgress, type EventRow, type QueueItem, type RiderRow, type StopGroup } from '@pohnch/core';
import { randomUUID } from 'expo-crypto';
import { useLang } from '@pohnch/ui';
import { feel } from '@pohnch/ui/native';
import { ensureTripLocation, startTripLocation, stopTripLocation, type LocationStart } from '../location/tripLocation';
import { clearTripLive } from '../notifications/tripLive';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

const QUEUE_KEY = 'pohnch.driver.queue.v1';
// Audit: trips ended on this phone (kept until the server agrees), so a trip ended without signal
// never comes back as "running" and never restarts location.
const ENDED_KEY = 'pohnch.driver.endedTrips.v1';
async function endedTrips(): Promise<string[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(ENDED_KEY)) ?? '[]') as string[];
  } catch {
    return [];
  }
}

/** Taps still waiting in the queue for this trip, as events, so a refresh doesn't hide them. */
function queuedEvents(items: QueueItem[], tripId: string): EventRow[] {
  const out: EventRow[] = [];
  for (const it of items) {
    if (it.action !== 'tap' || it.body.tripId !== tripId) continue;
    const step = String(it.body.step);
    const kids = Array.isArray(it.body.childIds) ? (it.body.childIds as string[]) : [];
    if (kids.length) kids.forEach((childId) => out.push({ childId, step, undone: false }));
    else out.push({ childId: null, step, undone: false });
  }
  return out;
}

/** v21: `added` is what the tap put on screen, so undo can take exactly that off again at once. */
export type UndoState = { clientId: string; text: string; at: number; added?: EventRow[] } | null;

type State = {
  loading: boolean;
  error: string | null;
  van: Van | null;
  stops: Stop[];
  riders: RiderRow[];
  requests: JoinRequest[];
  absent: string[];
  trips: Trip[];
  events: EventRow[];
  dayOff: boolean;
  /** Days off from today on (YYYY-MM-DD), for the day-off screen. */
  daysOff: string[];
  name: string | null;
  /** v8: the school pin, and children whose family said "we're ready" on the running trip. */
  school: { lat: number; lng: number } | null;
  ready: string[];
  /** v8: the last 7 days' trips, and how many were tracked start to finish. */
  week: { done: number; tracked: number } | null;
  /** v12: one-run chutti today (child ids per run), families' quick signals, team notices,
   * one-day start times, and things found in the van not yet collected. */
  runOff: { morning: string[]; afternoon: string[] };
  signals: driver.Signal[];
  notices: driver.Notice[];
  changes: { date: string; kind: 'morning' | 'afternoon'; time: string }[];
  found: driver.FoundItem[];
};

const empty: State = { loading: true, error: null, van: null, stops: [], riders: [], requests: [], absent: [], trips: [], events: [], dayOff: false, daysOff: [], name: null, school: null, ready: [], week: null, runOff: { morning: [], afternoon: [] }, signals: [], notices: [], changes: [], found: [] };

function useDriverState() {
  const [s, setS] = useState<State>(empty);
  const [pending, setPending] = useState(0);
  const [undo, setUndo] = useState<UndoState>(null);
  const [location, setLocation] = useState<LocationStart | 'off'>('off');
  const { t } = useLang();

  const queue = useMemo(
    () =>
      createQueue(
        {
          load: async () => {
            try {
              return JSON.parse((await AsyncStorage.getItem(QUEUE_KEY)) ?? '[]') as QueueItem[];
            } catch {
              return [];
            }
          },
          save: (items) => AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items)),
        },
        driverApiQueueSend,
        (n) => setPending(n),
      ),
    [],
  );

  const refresh = useCallback(async () => {
    try {
      const [van, name] = await Promise.all([driver.myVan(), driver.myName().catch(() => null)]);
      if (!van) {
        await stopTripLocation();
        setS({ ...empty, loading: false, name });
        return;
      }
      const today = karachiDate(new Date());
      // v21: one round of reads (was two after each other), so every refresh is about twice as quick.
      const [stops, rs, absent, trips, daysOff, offM, offA, signals, notices, changes, found] = await Promise.all([
        driver.stopsOf(van.id),
        driver.ridersOf(van.id),
        driver.absencesOn(today),
        driver.tripsToday(van.id),
        driver.daysOffFrom(van.id, today),
        driver.runAbsencesOn(today, 'morning').catch(() => []),
        driver.runAbsencesOn(today, 'afternoon').catch(() => []),
        driver.signalsToday().catch(() => []),
        driver.activeNotices().catch(() => []),
        driver.runChangesFrom(van.id, today).catch(() => []),
        driver.foundItems(van.id).catch(() => []),
      ]);
      const dayOff = daysOff.includes(today);
      // A trip this phone has ended counts as ended, even before the server has heard.
      const ended = await endedTrips();
      const tripsSeen = trips.map((x) => (x.status === 'running' && ended.includes(x.id) ? { ...x, status: 'ended' as const } : x));
      const running = tripsSeen.find((x) => x.status === 'running');
      const [serverEvents, school, ready, week, waiting] = await Promise.all([
        running ? driver.eventsOf(running.id) : Promise.resolve([]),
        driver.schoolPoint(van.id).catch(() => null),
        running && !running.is_practice ? driver.readyOn(running.id).catch(() => []) : Promise.resolve([]),
        driver.weekTrips(van.id, addDays(today, -6)).catch(() => null),
        queue.list(),
      ]);
      // Taps still in the queue stay on screen (a refresh used to flip them back to "waiting").
      const events = running ? [...serverEvents, ...queuedEvents(waiting, running.id)] : serverEvents;
      // Location follows the trip: on while one runs (also after the app restarts mid-trip), off otherwise.
      // Practice trips never share location.
      // Audit: refresh never asks for permission again (only starting a trip does).
      if (running && !running.is_practice) {
        setLocation(await ensureTripLocation(running.id, { title: t('location.notification.title'), body: t('location.notification.body') }));
      } else {
        await stopTripLocation();
        setLocation('off');
        if (!running) void clearTripLive();
      }
      setS({ loading: false, error: null, van, stops, riders: rs.riders, requests: rs.requests, absent, trips: tripsSeen, events, dayOff, daysOff, name, school, ready, week, runOff: { morning: offM, afternoon: offA }, signals, notices, changes, found });
    } catch (e) {
      setS((old) => ({ ...old, loading: false, error: e instanceof ApiError ? e.code : 'offline' }));
    }
  }, [t, queue]);

  useEffect(() => {
    refresh();
    queue.pending().then(setPending);
  }, [refresh, queue]);

  // Audit: when the queue empties (signal came back), read the server again.
  const lastPending = useRef(0);
  useEffect(() => {
    if (lastPending.current > 0 && pending === 0) void refresh();
    lastPending.current = pending;
  }, [pending, refresh]);

  // While anything waits in the queue, try again every 5 s.
  const retry = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (pending > 0 && !retry.current) retry.current = setInterval(() => queue.flush(), 5000);
    if (pending === 0 && retry.current) {
      clearInterval(retry.current);
      retry.current = null;
    }
  }, [pending, queue]);
  useEffect(() => () => { if (retry.current) clearInterval(retry.current); }, []);

  const running = s.trips.find((t) => t.status === 'running') ?? null;

  // During a real trip, look for "we're ready" from families every 15 s.
  useEffect(() => {
    if (!running || running.is_practice) return;
    const id = setInterval(() => {
      driver.signalsToday().then((signals) => setS((old) => {
        if (signals.length === old.signals.length) return old;
        if (signals.length > old.signals.length) feel('toggleOn');
        return { ...old, signals };
      })).catch(() => undefined);
      driver.readyOn(running.id).then((ready) => setS((old) => {
        if (old.ready.join() === ready.join()) return old;
        // v9: a family said "we're ready": a soft sound only (no banner over the trip screen).
        if (ready.some((id) => !old.ready.includes(id))) feel('toggleOn');
        return { ...old, ready };
      })).catch(() => undefined);
    }, 15_000);
    return () => clearInterval(id);
  }, [running?.id, running?.is_practice]); // eslint-disable-line react-hooks/exhaustive-deps

  // The run to show: the running one, else the next one not done today (morning first), else by the clock.
  const doneKinds = new Set(s.trips.filter((x) => !x.is_practice && x.status !== 'cancelled').map((x) => x.kind));
  const nextKind: 'morning' | 'afternoon' | null = !doneKinds.has('morning') ? 'morning' : !doneKinds.has('afternoon') ? 'afternoon' : null;
  const run = useMemo(() => {
    const kind = running?.kind ?? nextKind ?? defaultRunKind(new Date());
    // v12: a one-run chutti counts as off for that run only.
    const absentChildIds = [...s.absent, ...s.runOff[kind]];
    return { kind, groups: buildRun({ stops: s.stops, riders: s.riders, absentChildIds, events: s.events, kind, noStopLabel: '—' }) };
  }, [running, nextKind, s.stops, s.riders, s.absent, s.runOff, s.events]);

  const actions = {
    refresh,

    async startTrip(kind: 'morning' | 'afternoon') {
      if (!s.van) return;
      const { tripId } = await driver.driverApi.startTrip(s.van.id, kind, randomUUID());
      // v21: the trip shows as running the moment the server says yes (the trip screen opens), and
      // location and the full reload follow behind it instead of in front of it.
      if (tripId) {
        setS((old) => (old.trips.some((x) => x.id === tripId) ? old : { ...old, events: [], trips: [...old.trips, { id: tripId, kind, status: 'running', is_practice: false, started_at: new Date().toISOString() }] }));
        // Starting a trip is the one moment the app asks for location permission.
        void startTripLocation(tripId, { title: t('location.notification.title'), body: t('location.notification.body') })
          .then(setLocation)
          .finally(() => void refresh());
      } else void refresh();
    },

    /**
     * One tap for the children at one stop (or only some of them, when one sibling isn't there):
     * shown at once, queued, sent when there is signal.
     */
    async tapStop(group: StopGroup, text: string, only?: string[]) {
      if (!running) return;
      const clientId = randomUUID();
      const step = running.kind === 'morning' ? 'picked' : 'dropped';
      const childIds = group.children.filter((c) => c.state === 'waiting' && (!only || only.includes(c.childId))).map((c) => c.childId);
      if (childIds.length === 0) return;
      const added = childIds.map((childId) => ({ childId, step, undone: false }));
      setS((old) => ({ ...old, events: [...old.events, ...added] }));
      setUndo({ clientId, text, at: Date.now(), added });
      await queue.add({ id: clientId, action: 'tap', body: { tripId: running.id, step, childIds, clientId, happenedAt: new Date().toISOString() }, queuedAt: Date.now() });
    },

    /** A van-wide step (reached school), then the morning run ends. Sent once per trip. */
    async reachedSchool(text: string) {
      if (!running) return;
      if (s.events.some((e) => e.childId === null && e.step === 'reached_school' && !e.undone)) return;
      const clientId = randomUUID();
      const added = [{ childId: null, step: 'reached_school', undone: false }];
      setS((old) => ({ ...old, events: [...old.events, ...added] }));
      setUndo({ clientId, text, at: Date.now(), added });
      await queue.add({ id: clientId, action: 'tap', body: { tripId: running.id, step: 'reached_school', clientId, happenedAt: new Date().toISOString() }, queuedAt: Date.now() });
    },

    async undoLast() {
      if (!undo) return;
      const { clientId, added } = undo;
      setUndo(null);
      // v21: the tap comes off the screen at once (exactly the rows it added), before any network.
      if (added?.length) setS((old) => ({ ...old, events: old.events.filter((e) => !added.includes(e)) }));
      // Still on the phone? Just take it out of the queue. Already sent? Ask the server to undo it.
      const wasWaiting = await queue.remove(clientId);
      if (!wasWaiting) await queue.add({ id: `undo-${clientId}`, action: 'tap.undo', body: { clientId }, queuedAt: Date.now() });
      void refresh();
    },

    clearUndo: () => setUndo(null),

    async late(reason: 'traffic' | 'breakdown' | 'roadClosed' | 'rain') {
      if (!running) return;
      const clientId = randomUUID();
      await queue.add({ id: clientId, action: 'late', body: { tripId: running.id, reason, clientId }, queuedAt: Date.now() });
    },

    /** The whole van off (or back on) for a day; the server tells every family. */
    async setDayOff(date: string, off: boolean) {
      if (!s.van) return;
      const today = karachiDate(new Date());
      // v21: shown at once; put back by the reload if the server says no.
      setS((old) => {
        const daysOff = off ? [...new Set([...old.daysOff, date])] : old.daysOff.filter((x) => x !== date);
        return { ...old, daysOff, dayOff: daysOff.includes(today) };
      });
      try {
        await driver.driverApi.dayOff(s.van.id, date, off);
      } finally {
        void refresh();
      }
    },

    /** v12: a one-day start time for a run (null = back to usual). Families are told by push. */
    async changeTime(kind: 'morning' | 'afternoon', date: string, time: string | null) {
      if (!s.van) return;
      setS((old) => ({ ...old, changes: [...old.changes.filter((c) => !(c.date === date && c.kind === kind)), ...(time ? [{ date, kind, time }] : [])] }));
      try {
        await driver.v12Api.runChange(s.van.id, kind, date, time);
      } finally {
        void refresh();
      }
    },
    async markFound(childId: string, what: driver.FoundItem['what']) {
      if (!s.van) return;
      try {
        await driver.markFound(s.van.id, childId, what);
      } finally {
        void refresh();
      }
    },
    async markCollected(id: string) {
      setS((old) => ({ ...old, found: old.found.filter((f) => f.id !== id) }));
      await driver.markCollected(id).catch(() => refresh());
    },

    /**
     * End the trip: location stops at once, the live notification goes, and the trip counts as ended on
     * this phone straight away (kept on the phone until the server agrees), so no signal can't leave the
     * driver stuck on a dead trip or restart location. The seat check is queued before the end.
     */
    async endTrip(seatChecked = false) {
      if (!running) return;
      const id = running.id;
      await stopTripLocation();
      setLocation('off');
      void clearTripLive();
      setUndo(null);
      const ended = await endedTrips();
      await AsyncStorage.setItem(ENDED_KEY, JSON.stringify([...ended.filter((x) => x !== id), id].slice(-10))).catch(() => undefined);
      setS((old) => ({ ...old, trips: old.trips.map((x) => (x.id === id ? { ...x, status: 'ended' as const } : x)) }));
      if (seatChecked && !running.is_practice) await queue.add({ id: `seat-${id}`, action: 'trip.seatCheck', body: { tripId: id }, queuedAt: Date.now() });
      await queue.add({ id: `end-${id}`, action: 'trip.end', body: { tripId: id }, queuedAt: Date.now() });
      void refresh();
    },
  };

  return { ...s, pending, undo, running, run, nextKind, location, progress: runProgress(run.groups), actions };
}

export type DriverStore = ReturnType<typeof useDriverState>;
const Ctx = createContext<DriverStore | null>(null);

export function DriverProvider({ children }: { children: ReactNode }) {
  const store = useDriverState();
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useDriver(): DriverStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDriver must be inside <DriverProvider>');
  return v;
}
