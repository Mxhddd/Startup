import { describe, expect, it, vi } from 'vitest';
import { buildPushes, sendExpoPushes, type Recipient } from './push.ts';
import { notifyTrip } from './notify.ts';
import pushText from './pushText.json' with { type: 'json' };
// @ts-expect-error plain .mjs script without types
import { pushText as fromMessages } from '../../../scripts/gen-push-text.mjs';

const r = (over: Partial<Recipient>): Recipient => ({
  child_id: 'c-ali', first_name: 'علی', token: 'ExponentPushToken[a]', platform: 'android', lang: 'ur', driver_name: 'رفیق بھائی', ...over,
});

describe('push messages', () => {
  it('say what happened and who marked it, in Urdu', () => {
    const [m] = buildPushes('picked', [r({})]);
    expect(m).toMatchObject({ to: 'ExponentPushToken[a]', title: 'علی', body: 'وین میں بیٹھ گئے · رفیق بھائی نے مارک کیا', channelId: 'trip' });
  });

  it("use each phone's own language", () => {
    const [m] = buildPushes('reached_school', [r({ lang: 'en', first_name: 'Ali', driver_name: 'Rafiq bhai' })]);
    expect(m?.body).toBe('Reached school · Marked by Rafiq bhai');
  });

  it('put brothers and sisters in one message per phone', () => {
    const msgs = buildPushes('left', [r({}), r({ child_id: 'c-sara', first_name: 'سارہ' }), r({ token: 'ExponentPushToken[b]', first_name: 'حمزہ', child_id: 'c-h' })]);
    expect(msgs).toHaveLength(2);
    expect(msgs[0]?.title).toBe('علی، سارہ');
  });

  it('say "at your door" for arriving and give the late reason', () => {
    expect(buildPushes('arriving', [r({})])[0]?.body).toBe('وین دروازے پر ہے');
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
