import { describe, expect, it, vi } from 'vitest';
import { buildDayOffPushes, buildPushes, sendExpoPushes, type DayOffRecipient, type Recipient } from './push.ts';
import { notifyDayOff, notifyTrip } from './notify.ts';
import { STEP_SOUND, TIME_SENSITIVE } from './push.ts';
import { MOMENTS } from '../../../packages/core/src/moments.ts';
import pushText from './pushText.json' with { type: 'json' };
// @ts-expect-error plain .mjs script without types
import { pushText as fromMessages } from '../../../scripts/gen-push-text.mjs';

const r = (over: Partial<Recipient>): Recipient => ({
  child_id: 'c-ali', first_name: 'علی', token: 'ExponentPushToken[a]', platform: 'android', lang: 'ur', driver_name: 'رفیق بھائی', ...over,
});

describe('push messages', () => {
  it('say what happened, name first, and who marked it, in Urdu (v9)', () => {
    const [m] = buildPushes('picked', [r({})]);
    expect(m).toMatchObject({ to: 'ExponentPushToken[a]', title: 'علی وین میں بیٹھ گئے', body: 'رفیق بھائی', channelId: 'step-picked', sound: 'a_picked.wav', categoryId: 'trip' });
  });

  it("use each phone's own language", () => {
    const [m] = buildPushes('reached_school', [r({ lang: 'en', first_name: 'Ali', driver_name: 'Rafiq bhai' })]);
    expect(m?.title).toBe('Ali reached school');
    expect(m?.body).toBe('Rafiq bhai');
  });

  it('put brothers and sisters in one message per phone', () => {
    const msgs = buildPushes('left', [r({}), r({ child_id: 'c-sara', first_name: 'سارہ' }), r({ token: 'ExponentPushToken[b]', first_name: 'حمزہ', child_id: 'c-h' })]);
    expect(msgs).toHaveLength(2);
    expect(msgs[0]?.title).toBe('علی، سارہ کی وین نکل گئی');
  });

  it('say "at your door" for arriving and give the late reason', () => {
    expect(buildPushes('arriving', [r({})])[0]).toMatchObject({ title: 'علی کی وین دروازے پر ہے', body: 'تیار رہیں · رفیق بھائی' });
    expect(buildPushes('late', [r({ lang: 'en' })], 'breakdown')[0]?.body).toBe('The van is running late: Breakdown');
  });

  it('use the same words as the apps (pushText.json is up to date)', () => {
    expect(pushText).toEqual(fromMessages());
  });
});

describe('sending', () => {
  it('sends to Expo in batches of 100 and reports phones that are gone', async () => {
    const f = vi.fn(async (_u: string, init: RequestInit) => {
      const batch = JSON.parse(init.body as string) as unknown[];
      return new Response(JSON.stringify({ data: batch.map((_, i) => (i === 0 ? { status: 'error', details: { error: 'DeviceNotRegistered' } } : { status: 'ok' })) }));
    });
    const msgs = buildPushes('left', Array.from({ length: 150 }, (_, i) => r({ token: `T${i}` })));
    const res = await sendExpoPushes(msgs, { fetch: f as unknown as typeof fetch });
    expect(f).toHaveBeenCalledTimes(2);
    expect(res).toEqual({ sent: 148, dead: ['T0', 'T100'] });
  });

  it('notifyTrip removes dead tokens and logs only counts', async () => {
    const logs: string[] = [];
    const rpc = vi.fn(async (fn: string) => (fn === 'push_recipients' ? { data: [r({ token: 'gone' })], error: null } : { data: 1, error: null }));
    const f = vi.fn(async () => new Response(JSON.stringify({ data: [{ status: 'error', details: { error: 'DeviceNotRegistered' } }] })));
    await notifyTrip({ tripId: 't', step: 'picked', children: ['c-ali'] }, { rpc, fetch: f as unknown as typeof fetch, log: (l) => logs.push(l) });
    expect(rpc).toHaveBeenCalledWith('remove_push_tokens', { p_tokens: ['gone'] });
    expect(rpc).toHaveBeenCalledWith('record_push_stats', { p_sent: 0, p_dead: 1, p_failed: 0 });
    expect(logs).toEqual(['push picked sent=0 dead=1']);
    expect(logs.join('')).not.toContain('علی');
  });

  it("never throws: a push problem does not undo the driver's tap", async () => {
    const logs: string[] = [];
    const rpc = vi.fn(async () => ({ data: null, error: { message: 'boom' } }));
    await expect(notifyTrip({ tripId: 't', step: 'left', children: null }, { rpc, fetch: vi.fn() as unknown as typeof fetch, log: (l) => logs.push(l) })).resolves.toBeUndefined();
    expect(logs).toEqual(['push left failed']);
  });
});

describe('alert sounds, urgency and settings (v7)', () => {
  it('gives every step its own tone and channel (v9)', () => {
    expect(buildPushes('reached_school', [r({})])[0]).toMatchObject({ sound: 'a_reached_school.wav', channelId: 'step-reached-school' });
    expect(buildPushes('dropped', [r({})])[0]).toMatchObject({ sound: 'a_dropped.wav', channelId: 'step-dropped' });
    expect(buildPushes('left', [r({})])[0]).toMatchObject({ sound: 'a_left.wav', channelId: 'step-left' });
  });

  it('only "arriving" and "late" break through Focus', () => {
    expect(buildPushes('arriving', [r({})])[0]?.interruptionLevel).toBe('time-sensitive');
    expect(buildPushes('late', [r({})], 'traffic')[0]?.interruptionLevel).toBe('time-sensitive');
    expect(buildPushes('picked', [r({})])[0]?.interruptionLevel).toBe('active');
  });

  it('a parent who chose quiet alerts gets no sound', () => {
    expect(buildPushes('reached_school', [r({ sound: false })])[0]).toMatchObject({ sound: null, channelId: 'step-quiet' });
  });

  it('asks the database for this step, so switched-off alerts are left out', async () => {
    const rpc = vi.fn(async () => ({ data: [], error: null }));
    await notifyTrip({ tripId: 't1', step: 'left', children: null }, { rpc, fetch: vi.fn() as unknown as typeof fetch, log: () => undefined });
    expect(rpc).toHaveBeenCalledWith('push_recipients', { p_trip: 't1', p_children: null, p_step: 'left' });
  });

  it('uses the same sounds and urgency as the apps (packages/core moments)', () => {
    for (const [step, m] of Object.entries(MOMENTS)) {
      expect(STEP_SOUND[step as keyof typeof STEP_SOUND], step).toBe(m.sound);
      expect(TIME_SENSITIVE.includes(step as never), step).toBe(m.timeSensitive);
    }
  });
});

describe('whole-van day off (v8)', () => {
  const d = (over: Partial<DayOffRecipient>): DayOffRecipient => ({ first_name: 'علی', token: 'ExponentPushToken[a]', lang: 'ur', driver_name: 'رفیق بھائی', ...over });

  it('says when, who gave the day off, and whose children, one message per phone', () => {
    const msgs = buildDayOffPushes(
      [d({}), d({ first_name: 'سارہ' }), d({ token: 'ExponentPushToken[b]', lang: 'en', first_name: 'Hamza', driver_name: 'Rafiq bhai' })],
      { date: '2026-11-04', today: '2026-11-03', off: true },
    );
    expect(msgs).toHaveLength(2);
    expect(msgs[0]?.title).toBe('کل وین کی چھٹی');
    expect(msgs[0]?.body).toBe('رفیق بھائی نے وین کی چھٹی کی · علی، سارہ');
    expect(msgs[1]?.title).toBe('No van tomorrow');
    expect(msgs[0]?.data).toEqual({ kind: 'dayoff', date: '2026-11-04', off: true });
  });

  it('names today, a later date, and a cancelled day off', () => {
    expect(buildDayOffPushes([d({ lang: 'en' })], { date: '2026-11-03', today: '2026-11-03', off: true })[0]?.title).toBe('No van today');
    expect(buildDayOffPushes([d({ lang: 'en' })], { date: '2026-11-12', today: '2026-11-03', off: true })[0]?.title).toBe('No van on 12/11');
    expect(buildDayOffPushes([d({ lang: 'en' })], { date: '2026-12-01', today: '2026-11-30', off: false })[0]?.title).toBe('The van is coming tomorrow');
  });

  it('keeps a quiet phone quiet', () => {
    const [m] = buildDayOffPushes([d({ sound: false })], { date: '2026-11-03', today: '2026-11-03', off: true });
    expect(m?.sound).toBeNull();
    expect(m?.channelId).toBe('step-quiet');
  });

  it('notifyDayOff asks for the van\'s families and logs only counts', async () => {
    const rpc = vi.fn(async (fn: string) => ({ data: fn === 'dayoff_recipients' ? [d({})] : null, error: null }));
    const logs: string[] = [];
    const fetch = vi.fn(async () => new Response(JSON.stringify({ data: [{ status: 'ok' }] })));
    await notifyDayOff({ vanId: 'v', date: '2026-11-03', today: '2026-11-03', off: true }, { rpc, fetch, log: (l) => logs.push(l) });
    expect(rpc).toHaveBeenCalledWith('dayoff_recipients', { p_van: 'v' });
    expect(logs).toEqual(['push dayoff sent=1 dead=0']);
  });
});

describe('"Off today" on the van-left alert (v8)', () => {
  it('gives the van-left alert the chutti button and the children\'s ids, never their names', () => {
    const [m] = buildPushes('left', [r({}), r({ child_id: 'c-sara', first_name: 'سارہ' })]);
    expect(m?.categoryId).toBe('trip-left');
    expect(m?.data).toEqual({ kind: 'trip', step: 'left', children: ['c-ali', 'c-sara'] });
    const [p] = buildPushes('picked', [r({})]);
    expect(p?.categoryId).toBe('trip');
    expect(p?.data).toEqual({ kind: 'trip', step: 'picked' });
  });
});

import { inQuietHours } from './push.ts';
describe('notifications v2 (v9)', () => {
  it('gives the at-the-door alert a "We\'re ready" button, with the trip and children ids', () => {
    const [m] = buildPushes('arriving', [r({})], null, { tripId: 't-1' });
    expect(m?.categoryId).toBe('trip-door');
    expect(m?.data).toEqual({ kind: 'trip', step: 'arriving', children: ['c-ali'], trip: 't-1' });
  });
  it('keeps quiet from 21:00 to 06:00 in Karachi, except for "late"', () => {
    expect(inQuietHours(new Date('2026-11-04T17:00:00Z'))).toBe(true); // 22:00 in Karachi
    expect(inQuietHours(new Date('2026-11-04T00:30:00Z'))).toBe(true); // 05:30
    expect(inQuietHours(new Date('2026-11-04T02:00:00Z'))).toBe(false); // 07:00
    expect(buildPushes('picked', [r({})], null, { quietHours: true })[0]).toMatchObject({ sound: null, channelId: 'step-quiet' });
    expect(buildPushes('late', [r({})], 'traffic', { quietHours: true })[0]?.sound).toBe('a_late.wav');
  });
});

import { buildDriverPushes } from './push.ts';
import { notifyDriver } from './notify.ts';
describe("the driver's alerts (v9)", () => {
  it('names the child in a request, in the driver\'s language, one per phone', () => {
    const msgs = buildDriverPushes('request', [{ token: 't1', lang: 'en', first_name: 'Zoya' }, { token: 't1', lang: 'en', first_name: 'Zoya' }]);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toMatchObject({ title: 'A new family request', channelId: 'driver', data: { kind: 'driver', what: 'request' } });
    expect(msgs[0]?.body).toContain('Zoya');
  });
  it('asks the database for the right list and logs only counts', async () => {
    const rpc = vi.fn(async (fn: string) => ({ data: fn === 'driver_push_targets' ? [{ token: 't1', lang: 'ur' }] : null, error: null }));
    const logs: string[] = [];
    const fetch = vi.fn(async () => new Response(JSON.stringify({ data: [{ status: 'ok' }] })));
    await notifyDriver({ what: 'verified', vanId: 'v' }, { rpc, fetch, log: (l) => logs.push(l) });
    expect(rpc).toHaveBeenCalledWith('driver_push_targets', { p_van: 'v' });
    expect(logs).toEqual(['push driver sent=1 dead=0']);
  });
});

