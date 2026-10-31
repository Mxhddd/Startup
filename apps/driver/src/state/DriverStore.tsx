// The driver app's state in one place. Screens read from useDriver() and call its actions.
// - Data comes from Supabase (driver.* in packages/client) and refreshes after each action.
// - Taps show on screen at once, are saved in the offline queue, and are sent in order in the background.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { driver, driverApiQueueSend, type JoinRequest, type Stop, type Trip, type Van } from './data';
import { ApiError, buildRun, createQueue, defaultRunKind, karachiDate, runProgress, type EventRow, type QueueItem, type RiderRow, type StopGroup } from '@pohnch/core';
import { randomUUID } from 'expo-crypto';
import { useLang } from '@pohnch/ui';
import { startTripLocation, stopTripLocation, type LocationStart } from '../location/tripLocation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

const QUEUE_KEY = 'pohnch.driver.queue.v1';

export type UndoState = { clientId: string; text: string; at: number } | null;

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
};

const empty: State = { loading: true, error: null, van: null, stops: [], riders: [], requests: [], absent: [], trips: [], events: [], dayOff: false };

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
      const van = await driver.myVan();
      if (!van) {
        await stopTripLocation();
        setS({ ...empty, loading: false });
        return;
      }
      const today = karachiDate(new Date());
      const [stops, rs, absent, trips, dayOff] = await Promise.all([
        driver.stopsOf(van.id),
        driver.ridersOf(van.id),
        driver.absencesOn(today),
        driver.tripsToday(van.id),
        driver.isDayOff(van.id, today),
      ]);
      const running = trips.find((x) => x.status === 'running');
      const events = running ? await driver.eventsOf(running.id) : [];
      // Location follows the trip: on while one runs (also after the app restarts mid-trip), off otherwise.
      // Practice trips never share location.
      if (running && !running.is_practice) {
        setLocation(await startTripLocation(running.id, { title: t('location.notification.title'), body: t('location.notification.body') }));
      } else {
        await stopTripLocation();
        setLocation('off');
      }
      setS({ loading: false, error: null, van, stops, riders: rs.riders, requests: rs.requests, absent, trips, events, dayOff });
    } catch (e) {
      setS((old) => ({ ...old, loading: false, error: e instanceof ApiError ? e.code : 'offline' }));
    }
  }, [t]);

  useEffect(() => {
    refresh();
    queue.pending().then(setPending);
  }, [refresh, queue]);

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

  const run = useMemo(() => {
    const kind = running?.kind ?? defaultRunKind(new Date());
    return { kind, groups: buildRun({ stops: s.stops, riders: s.riders, absentChildIds: s.absent, events: s.events, kind, noStopLabel: '—' }) };
  }, [running, s.stops, s.riders, s.absent, s.events]);

  const actions = {
    refresh,

    async startTrip(kind: 'morning' | 'afternoon') {
      if (!s.van) return;
      await driver.driverApi.startTrip(s.van.id, kind, randomUUID());
      await refresh();
    },

    /** One tap for the children at one stop: shown at once, queued, sent when there is signal. */
    async tapStop(group: StopGroup, text: string) {
      if (!running) return;
      const clientId = randomUUID();
      const step = running.kind === 'morning' ? 'picked' : 'dropped';
      const childIds = group.children.filter((c) => c.state === 'waiting').map((c) => c.childId);
      if (childIds.length === 0) return;
      setS((old) => ({ ...old, events: [...old.events, ...childIds.map((childId) => ({ childId, step, undone: false }))] }));
      setUndo({ clientId, text, at: Date.now() });
      await queue.add({ id: clientId, action: 'tap', body: { tripId: running.id, step, childIds, clientId, happenedAt: new Date().toISOString() }, queuedAt: Date.now() });
    },

    /** A van-wide step (reached school), then the morning run ends. */
    async reachedSchool(text: string) {
      if (!running) return;
      const clientId = randomUUID();
      setUndo({ clientId, text, at: Date.now() });
      await queue.add({ id: clientId, action: 'tap', body: { tripId: running.id, step: 'reached_school', clientId, happenedAt: new Date().toISOString() }, queuedAt: Date.now() });
    },

    async undoLast() {
      if (!undo) return;
      const { clientId } = undo;
      setUndo(null);
      // Still on the phone? Just take it out of the queue. Already sent? Ask the server to undo it.
      const wasWaiting = await queue.remove(clientId);
      if (!wasWaiting) await queue.add({ id: `undo-${clientId}`, action: 'tap.undo', body: { clientId }, queuedAt: Date.now() });
      await refresh();
    },

    clearUndo: () => setUndo(null),

    async late(reason: 'traffic' | 'breakdown' | 'roadClosed') {
      if (!running) return;
      const clientId = randomUUID();
      await queue.add({ id: clientId, action: 'late', body: { tripId: running.id, reason, clientId }, queuedAt: Date.now() });
    },

    async endTrip() {
      if (!running) return;
      await stopTripLocation(); // stop sharing at once, even before the server hears about it
      setLocation('off');
      await queue.add({ id: `end-${running.id}`, action: 'trip.end', body: { tripId: running.id }, queuedAt: Date.now() });
      await refresh();
    },
  };

  return { ...s, pending, undo, running, run, location, progress: runProgress(run.groups), actions };
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
