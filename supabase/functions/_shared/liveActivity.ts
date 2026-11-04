// Updates the iPhone Live Activity on parents' lock screens from the server (v7), so the card keeps
// moving while the phone is locked and the app is closed:
// - on every van position (at most about once a minute per card): a fresh arrival time;
// - on every step: the new state, with an alert that lights up the Dynamic Island; at school or home
//   the card ends and leaves itself after 15 minutes.
// iPhone: sent straight to Apple (APNs) with Pohnch's key; until that key exists (it comes with the
// Apple Developer account) iPhone cards are skipped and the app updates them whenever it is open.
// Android: quiet data messages through Expo's push service refresh the live notification
// (needs the Firebase key in Expo, like every Android push).
// Logs carry counts only: never tokens, names or positions.
import text from './pushText.json' with { type: 'json' };
import type { PushStep } from './push.ts';

type Lang = 'ur' | 'en';
type Key = keyof (typeof text)['en'];
const T = (lang: Lang, key: Key, vars: Record<string, string> = {}) =>
  (text[lang][key] as string).replace(/\{(\w+)\}/g, (w, n: string) => vars[n] ?? w);

// The same sums as etaMinutes in packages/core/src/parent.ts (a test keeps them equal).
const ROAD_FACTOR = 1.35;
const DEFAULT_SPEED_MS = 5.5;
const MIN_SPEED_MS = 3;
const MAX_SPEED_MS = 14;
const AT_DOOR_M = 150;
export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export function serverEta(van: { lat: number; lng: number; speed: number | null }, stop: { lat: number; lng: number }): number | 'door' {
  const d = distanceM(van, stop);
  if (d <= AT_DOOR_M) return 'door';
  const speed = Math.min(MAX_SPEED_MS, Math.max(MIN_SPEED_MS, van.speed !== null && van.speed >= 1.4 ? van.speed : DEFAULT_SPEED_MS));
  return Math.max(1, Math.round((d * ROAD_FACTOR) / speed / 60));
}

export type Target = { token: string; kind?: 'update' | 'android'; child_id: string; first_name: string; lang: string; stop_lat: number | null; stop_lng: number | null; driver_name: string };

/** The card's content (the same fields as buildLiveCard in @pohnch/core makes in the app). */
export function serverCard(t: Target, o: { now: number; step: PushStep | null; van: { lat: number; lng: number; speed: number | null } | null }) {
  const lang: Lang = t.lang === 'en' ? 'en' : 'ur';
  const name = t.first_name;
  const place = o.step === 'picked' ? 'inVan' : o.step === 'reached_school' ? 'atSchool' : o.step === 'dropped' ? 'home' : o.step === 'left_school' ? 'inVan' : 'coming';
  const leadKey = `parent.place.${place}` as Key;
  const eta = place === 'coming' && o.van && t.stop_lat !== null && t.stop_lng !== null ? serverEta(o.van, { lat: t.stop_lat, lng: t.stop_lng }) : null;
  const arriveAt = typeof eta === 'number' ? o.now + eta * 60_000 : 0;
  const step = o.step && o.step !== 'late' && o.step !== 'arriving' ? T(lang, `moment.${o.step}` as Key, { name }) : '';
  return {
    state: eta === 'door' ? 'arriving' : place,
    initial: name.slice(0, 1),
    lead: T(lang, leadKey, { name }),
    headline: eta === 'door' ? T(lang, 'eta.door') : typeof eta === 'number' ? T(lang, 'eta.unit.home') : T(lang, leadKey, { name }),
    arriveAt,
    startAt: o.now,
    progress: eta === 'door' || place !== 'coming' ? 1 : 0,
    minutes: eta === 'door' ? '0' : typeof eta === 'number' ? String(eta) : '',
    ahead: '',
    footer: step ? `${step} · ${T(lang, 'timeline.by', { who: t.driver_name })}` : t.driver_name,
    // v9: the step row (left · in the van · there), the same as the app's buildLiveCard.
    steps: place === 'coming' ? 1 : place === 'inVan' ? 2 : 3,
    marks: T(lang, o.step === 'left_school' || o.step === 'dropped' ? 'live.marks.afternoon' : 'live.marks.morning'),
  };
}

/** The APNs payload for one card. Steps carry an alert (lights up the Island); arrivals end the card. */
export function activityPayload(card: ReturnType<typeof serverCard>, o: { now: number; step: PushStep | null; lang: Lang; name: string }) {
  const ends = o.step === 'reached_school' || o.step === 'dropped';
  const secs = Math.floor(o.now / 1000);
  return {
    aps: {
      timestamp: secs,
      event: ends ? 'end' : 'update',
      'content-state': { name: 'VanActivity', props: JSON.stringify(card) },
      'stale-date': secs + 180,
      ...(ends ? { 'dismissal-date': secs + 15 * 60 } : {}),
      ...(o.step ? { alert: { title: card.lead, body: card.footer } } : {}),
    },
  };
}

// ---- APNs: a short-lived signed token (ES256 JWT), cached for 50 minutes.
const b64url = (b: ArrayBuffer | Uint8Array | string) => {
  const bytes = typeof b === 'string' ? new TextEncoder().encode(b) : new Uint8Array(b);
  let s = '';
  for (const x of bytes) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
let cached: { jwt: string; at: number } | null = null;
export async function apnsJwt(key: { keyId: string; teamId: string; p8: string }, now = Date.now()): Promise<string> {
  if (cached && now - cached.at < 50 * 60_000) return cached.jwt;
  const pem = key.p8.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const k = await crypto.subtle.importKey('pkcs8', der, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const head = b64url(JSON.stringify({ alg: 'ES256', kid: key.keyId }));
  const body = b64url(JSON.stringify({ iss: key.teamId, iat: Math.floor(now / 1000) }));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, k, new TextEncoder().encode(`${head}.${body}`));
  cached = { jwt: `${head}.${body}.${b64url(sig)}`, at: now };
  return cached.jwt;
}

export type ApnsConfig = { keyId: string; teamId: string; p8: string; bundleId: string; host: string };

export type LiveDeps = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  fetch: typeof fetch;
  apns: ApnsConfig | null;
  /** For Android's quiet data messages (sent through Expo's push service). */
  expoAccessToken?: string;
  log: (line: string) => void;
  now?: () => number;
};

/** The quiet data message for an Android phone: the card under one key (see findLivePayload). */
export function androidMessage(t: Target, card: ReturnType<typeof serverCard>, step: PushStep | null) {
  const lang: Lang = t.lang === 'en' ? 'en' : 'ur';
  const end = step === 'reached_school' || step === 'dropped';
  return { to: t.token, priority: 'high' as const, data: { pohnchLive: JSON.stringify({ card, unit: T(lang, 'min.short'), end }) } };
}

export async function updateLiveActivities(job: { tripId: string; step: PushStep | null; van: { lat: number; lng: number; speed: number | null } | null }, deps: LiveDeps): Promise<void> {
  try {
    const { data, error } = await deps.rpc('live_activity_targets', { p_trip: job.tripId, p_force: job.step !== null });
    if (error) throw new Error('targets');
    // iPhone cards need Apple's key; without it only Android phones are refreshed.
    const targets = ((data ?? []) as Target[]).filter((t) => t.kind === 'android' || deps.apns);
    if (targets.length === 0) return;
    const now = deps.now?.() ?? Date.now();
    const sentTokens: string[] = [];
    const dead: string[] = [];

    const android = targets.filter((t) => t.kind === 'android');
    if (android.length) {
      const messages = android.map((t) => androidMessage(t, serverCard(t, { now, step: job.step, van: job.van }), job.step));
      const res = await deps.fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json', ...(deps.expoAccessToken ? { authorization: `Bearer ${deps.expoAccessToken}` } : {}) },
        body: JSON.stringify(messages),
      });
      const json = res.ok ? ((await res.json().catch(() => ({}))) as { data?: { status: string; details?: { error?: string } }[] }) : {};
      (json.data ?? []).forEach((ticket, i) => {
        const token = (android[i] as Target).token;
        if (ticket.status === 'ok') sentTokens.push(token);
        else if (ticket.details?.error === 'DeviceNotRegistered') dead.push(token);
      });
    }

    const iphone = targets.filter((t) => t.kind !== 'android');
    if (iphone.length && deps.apns) {
      const jwt = await apnsJwt(deps.apns, now);
      for (const t of iphone) {
        const card = serverCard(t, { now, step: job.step, van: job.van });
        const payload = activityPayload(card, { now, step: job.step, lang: t.lang === 'en' ? 'en' : 'ur', name: t.first_name });
        const res = await deps.fetch(`https://${deps.apns.host}/3/device/${t.token}`, {
          method: 'POST',
          headers: {
            authorization: `bearer ${jwt}`,
            'apns-push-type': 'liveactivity',
            'apns-topic': `${deps.apns.bundleId}.push-type.liveactivity`,
            'apns-priority': job.step ? '10' : '5',
            'content-type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) sentTokens.push(t.token);
        else if (res.status === 410 || res.status === 400) dead.push(t.token);
      }
    }

    await deps.rpc('mark_activity_pushed', { p_tokens: sentTokens, p_dead: dead });
    const sent = sentTokens.length;
    deps.log(`live ${job.step} sent=${sent} dead=${dead.length}`);
  } catch {
    deps.log(`live ${job.step} failed`);
  }
}
