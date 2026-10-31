import { describe, expect, it, vi } from 'vitest';
import { ApiError, buildRun, createQueue, retryDelayMs, runProgress, shouldSendPosition, type QueueItem } from './index';

const memStore = () => {
  let saved: QueueItem[] = [];
  return { load: async () => [...saved], save: async (i: QueueItem[]) => { saved = [...i]; }, peek: () => saved };
};
const item = (id: string, action = 'tap'): QueueItem => ({ id, action, body: { clientId: id }, queuedAt: 0 });

describe('offline queue', () => {
  it('sends taps in order when there is signal', async () => {
    const sent: string[] = [];
    const q = createQueue(memStore(), async (_a, b) => { sent.push(b.clientId as string); });
    await q.add(item('a'));
    await q.add(item('b'));
    expect(sent).toEqual(['a', 'b']);
    expect(await q.pending()).toBe(0);
  });

  it('keeps everything, in order, while offline, and sends it all when the signal returns', async () => {
    let online = false;
    const sent: string[] = [];
    const store = memStore();
    const q = createQueue(store, async (_a, b) => {
      if (!online) throw new ApiError('offline', 0);
      sent.push(b.clientId as string);
    });
    await q.add(item('a'));
    await q.add(item('b'));
    await q.add(item('c'));
    expect(sent).toEqual([]);
    expect(store.peek().map((i) => i.id)).toEqual(['a', 'b', 'c']); // saved on the phone
    online = true;
    await q.flush();
    expect(sent).toEqual(['a', 'b', 'c']);
    expect(await q.pending()).toBe(0);
  });

  it('survives the app closing: a new queue picks up what was saved', async () => {
    const store = memStore();
    const q1 = createQueue(store, async () => { throw new ApiError('offline', 0); });
    await q1.add(item('a'));
    const sent: string[] = [];
    const q2 = createQueue(store, async (_a, b) => { sent.push(b.clientId as string); });
    await q2.flush();
    expect(sent).toEqual(['a']);
  });

  it('drops a refused tap with its reason and carries on with the rest', async () => {
    const sent: string[] = [];
    const q = createQueue(memStore(), async (_a, b) => {
      if (b.clientId === 'bad') throw new ApiError('child_not_on_van', 422);
      sent.push(b.clientId as string);
    });
    await q.add(item('bad'));
    await q.add(item('good'));
    expect(sent).toEqual(['good']);
    expect(q.dropped()).toEqual([{ item: item('bad'), code: 'child_not_on_van' }]);
  });

  it('does not queue the same tap twice', async () => {
    const send = vi.fn(async () => { throw new ApiError('offline', 0); });
    const q = createQueue(memStore(), send);
    await q.add(item('a'));
    await q.add(item('a'));
    expect(await q.pending()).toBe(1);
  });

  it('lets an unsent tap be removed (undone while offline)', async () => {
    const q = createQueue(memStore(), async () => { throw new ApiError('offline', 0); });
    await q.add(item('a'));
    expect(await q.remove('a')).toBe(true);
    expect(await q.pending()).toBe(0);
  });

  it('waits longer after each failed try, up to a minute', () => {
    expect([0, 1, 2, 3, 10].map(retryDelayMs)).toEqual([2000, 4000, 8000, 16000, 60000]);
  });
});

describe('position cadence', () => {
  it('sends every 5 s while moving and every 30 s when stopped', () => {
    expect(shouldSendPosition(null, 0, 0)).toBe(true);
    expect(shouldSendPosition(0, 5000, 8)).toBe(true);
    expect(shouldSendPosition(0, 3000, 8)).toBe(false);
    expect(shouldSendPosition(0, 10_000, 0)).toBe(false);
    expect(shouldSendPosition(0, 30_000, 0)).toBe(true);
  });
});

describe("today's run", () => {
  const stops = [{ id: 's2', position: 2, label: 'Street 4' }, { id: 's1', position: 1, label: 'Block 13' }, { id: 's3', position: 3, label: 'Gate 2' }];
  const riders = [
    { childId: 'ali', firstName: 'Ali', stopId: 's1' },
    { childId: 'sara', firstName: 'Sara', stopId: 's1' },
    { childId: 'hamza', firstName: 'Hamza', stopId: 's2' },
    { childId: 'zoya', firstName: 'Zoya', stopId: 's3' },
    { childId: 'omar', firstName: 'Omar', stopId: null },
  ];

  it('orders stops, puts siblings together, and marks the first waiting stop as next', () => {
    const g = buildRun({ stops, riders, absentChildIds: [], events: [], kind: 'morning', noStopLabel: '—' });
    expect(g.map((x) => x.label)).toEqual(['Block 13', 'Street 4', 'Gate 2', '—']);
    expect(g[0]?.children.map((c) => c.firstName)).toEqual(['Ali', 'Sara']);
    expect(g.map((x) => x.isNext)).toEqual([true, false, false, false]);
  });

  it('moves "next" on after a tap, and skips a stop where everyone is on chutti', () => {
    const g = buildRun({
      stops, riders, absentChildIds: ['hamza'], kind: 'morning', noStopLabel: '—',
      events: [{ childId: 'ali', step: 'picked', undone: false }, { childId: 'sara', step: 'picked', undone: false }],
    });
    expect(g.map((x) => x.state)).toEqual(['done', 'absent', 'waiting', 'waiting']);
    expect(g.find((x) => x.isNext)?.label).toBe('Gate 2');
    expect(runProgress(g)).toEqual({ done: 2, total: 4 });
  });

  it('ignores an undone tap', () => {
    const g = buildRun({ stops, riders, absentChildIds: [], kind: 'morning', noStopLabel: '—', events: [{ childId: 'ali', step: 'picked', undone: true }] });
    expect(g[0]?.children.find((c) => c.childId === 'ali')?.state).toBe('waiting');
  });

  it('goes home in reverse order in the afternoon and counts "dropped" taps', () => {
    const g = buildRun({ stops, riders, absentChildIds: [], kind: 'afternoon', noStopLabel: '—', events: [{ childId: 'zoya', step: 'dropped', undone: false }] });
    expect(g.map((x) => x.label)).toEqual(['Gate 2', 'Street 4', 'Block 13', '—']);
    expect(g[0]?.state).toBe('done');
    expect(g.find((x) => x.isNext)?.label).toBe('Street 4');
  });
});

import { toPositionBody } from './index';
describe('GPS readings', () => {
  it('passes good readings through and turns "unknown" (-1) into nothing', () => {
    expect(toPositionBody('t', { latitude: 24.9, longitude: 67.1, heading: 90, speed: 7.5 }, 0)).toEqual({
      tripId: 't', lat: 24.9, lng: 67.1, heading: 90, speed: 7.5, recordedAt: '1970-01-01T00:00:00.000Z',
    });
    const odd = toPositionBody('t', { latitude: 24.9, longitude: 67.1, heading: -1, speed: -1 }, 0);
    expect(odd.heading).toBeNull();
    expect(odd.speed).toBeNull();
  });
});
