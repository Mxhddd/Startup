import { describe, expect, it, vi } from 'vitest';
import { activityPayload, apnsJwt, serverCard, serverEta, updateLiveActivities, type Target } from './liveActivity.ts';
import { etaMinutes } from '../../../packages/core/src/parent.ts';

const target: Target = { token: 'la-1', child_id: 'c1', first_name: 'علی', lang: 'ur', stop_lat: 24.92, stop_lng: 67.1, driver_name: 'رفیق بھائی' };
const van = { lat: 24.905, lng: 67.08, speed: 8 };

async function testKey() {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const der = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
  const b64 = btoa(String.fromCharCode(...der));
  return { p8: `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----`, pair };
}

describe('Live Activity updates from the server', () => {
  it('works out the minutes exactly like the app does', () => {
    for (const v of [van, { ...van, speed: null }, { lat: 24.919, lng: 67.0995, speed: 5 }]) {
      const app = etaMinutes({ van: { latitude: v.lat, longitude: v.lng }, target: { latitude: 24.92, longitude: 67.1 }, recentSpeeds: [v.speed], stopsAhead: 0 });
      expect(serverEta(v, { lat: 24.92, lng: 67.1 })).toEqual(app);
    }
  });

  it('fills the card: an arrival time to count down to, in the phone\'s language', () => {
    const c = serverCard(target, { now: 1_000_000, step: null, van });
    expect(c.state).toBe('coming');
    expect(c.arriveAt).toBeGreaterThan(1_000_000);
    expect(c.lead).toBe('علی کی وین آ رہی ہے');
    expect(serverCard({ ...target, lang: 'en', first_name: 'Ali' }, { now: 0, step: 'picked', van: null }).lead).toBe('Ali is in the van');
  });

  it('a step lights up the Island; reaching school ends the card after 15 minutes', () => {
    const now = 1_700_000_000_000;
    const card = serverCard(target, { now, step: 'reached_school', van: null });
    const p = activityPayload(card, { now, step: 'reached_school', lang: 'ur', name: 'علی' });
    expect(p.aps.event).toBe('end');
    expect(p.aps['dismissal-date']).toBe(Math.floor(now / 1000) + 900);
    expect(p.aps.alert?.title).toBe(card.lead);
    expect(JSON.parse(p.aps['content-state'].props).state).toBe('atSchool');
    expect(activityPayload(serverCard(target, { now, step: null, van }), { now, step: null, lang: 'ur', name: 'علی' }).aps.alert).toBeUndefined();
  });

  it('signs a valid ES256 token for Apple', async () => {
    const { p8, pair } = await testKey();
    const jwt = await apnsJwt({ keyId: 'KEY123', teamId: 'TEAM45', p8 }, 1);
    const [h, b, s] = jwt.split('.');
    const dec = (x: string) => Uint8Array.from(atob(x.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
    expect(JSON.parse(new TextDecoder().decode(dec(h!)))).toEqual({ alg: 'ES256', kid: 'KEY123' });
    expect(JSON.parse(new TextDecoder().decode(dec(b!))).iss).toBe('TEAM45');
    const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pair.publicKey, dec(s!), new TextEncoder().encode(`${h}.${b}`));
    expect(ok).toBe(true);
  });

  it('does nothing without Apple\'s key, and sends, marks and forgets dead cards with it', async () => {
    const rpc = vi.fn(async (fn: string) => (fn === 'live_activity_targets' ? { data: [target, { ...target, token: 'gone' }], error: null } : { data: null, error: null }));
    await updateLiveActivities({ tripId: 't1', step: null, van }, { rpc, fetch: vi.fn() as unknown as typeof fetch, apns: null, log: () => undefined });
    expect(rpc).not.toHaveBeenCalled();

    const { p8 } = await testKey();
    const fetch = vi.fn(async (url: RequestInfo | URL) => new Response('', { status: String(url).endsWith('/gone') ? 410 : 200 }));
    await updateLiveActivities(
      { tripId: 't1', step: 'picked', van: null },
      { rpc, fetch: fetch as unknown as typeof globalThis.fetch, apns: { keyId: 'K', teamId: 'T', p8, bundleId: 'pk.pohnch.parent', host: 'api.push.apple.com' }, log: () => undefined },
    );
    expect(rpc).toHaveBeenCalledWith('live_activity_targets', { p_trip: 't1', p_force: true });
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.push.apple.com/3/device/la-1');
    expect((init.headers as Record<string, string>)['apns-topic']).toBe('pk.pohnch.parent.push-type.liveactivity');
    expect(rpc).toHaveBeenCalledWith('mark_activity_pushed', { p_tokens: ['la-1'], p_dead: ['gone'] });
  });
});
