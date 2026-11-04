// Push notifications for trip steps, sent through Expo's push service (which passes them to Apple and Google).
// The words come from pushText.json (generated from the apps' ur.json and en.json), in each phone's language.
// Logs carry counts only: never tokens, phone numbers or children's names.
import text from './pushText.json' with { type: 'json' };

export type Recipient = { child_id: string; first_name: string; token: string; platform: string; lang: string; driver_name: string; sound?: boolean };
export type PushStep = 'left' | 'picked' | 'arriving' | 'reached_school' | 'left_school' | 'dropped' | 'late';
/** Android channels (v9): one per step, each with its own tone (Android fixes a channel's sound when it is made). */
export type AlertChannel = `step-${string}` | 'step-quiet';

export type ExpoMessage = {
  to: string;
  title: string;
  body: string;
  /** iPhone: the step's own Pohnch tone ("a_picked.wav"), or null for a quiet alert. Android takes the channel's sound. */
  sound: `a_${PushStep}.wav` | 'default' | null;
  priority: 'high';
  channelId: AlertChannel | 'driver';
  /** iPhone: "arriving" and "late" may show through Focus; the rest are ordinary. */
  interruptionLevel: 'time-sensitive' | 'active';
  /**
   * The notification's buttons, registered by the app: 'trip' has "Open trip"; 'trip-left' (the
   * morning "van left" alert, before pick-up) also has "Off today", which opens the chutti calendar.
   */
  categoryId: 'trip' | 'trip-left' | 'trip-door' | 'driver';
  /** children / trip: ids only (never names), for "Off today" and "We're ready". */
  data: { kind: 'trip'; step: PushStep; children?: string[]; trip?: string } | { kind: 'dayoff'; date: string; off: boolean } | { kind: 'driver'; what: 'request' | 'verified' };
};

// The same table the apps use (packages/core/src/moments.ts), copied by value: Edge Functions can't
// import the app workspace. push.test.ts checks the two stay in step.
export const STEP_SOUND: Record<PushStep, PushStep> = {
  left: 'left', picked: 'picked', arriving: 'arriving', reached_school: 'reached_school', left_school: 'left_school', dropped: 'dropped', late: 'late',
};
/** The app makes the same channel names (apps/parent/src/notifications/setup.ts, stepChannel). */
export const stepChannel = (step: PushStep): AlertChannel => `step-${STEP_SOUND[step].replace(/_/g, '-')}`;
export const TIME_SENSITIVE: PushStep[] = ['arriving', 'late'];

type Lang = 'ur' | 'en';
type Key = keyof (typeof text)['en'];
const T = (lang: Lang, key: Key, vars: Record<string, string> = {}) =>
  (text[lang][key] as string).replace(/\{(\w+)\}/g, (w, n: string) => vars[n] ?? w);

/** v9 quiet hours: from 21:00 to 06:00 in Karachi, alerts arrive silently (except "late"). */
export function inQuietHours(now: Date): boolean {
  const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', hour12: false }).format(now)) % 24;
  return h >= 21 || h < 6;
}

/**
 * One message per phone; brothers and sisters in one step share it ("علی، سارہ").
 * v9 words: the title says what happened, name first ("علی وین میں بیٹھ گئے"); the body says who.
 */
export function buildPushes(step: PushStep, recipients: Recipient[], reason?: string | null, opts: { tripId?: string; quietHours?: boolean } = {}): ExpoMessage[] {
  const byToken = new Map<string, Recipient[]>();
  for (const r of recipients) byToken.set(r.token, [...(byToken.get(r.token) ?? []), r]);
  const out: ExpoMessage[] = [];
  for (const [token, rows] of byToken) {
    const first = rows[0] as Recipient;
    const lang: Lang = first.lang === 'en' ? 'en' : 'ur';
    const names = [...new Set(rows.map((r) => r.first_name))].join(lang === 'ur' ? '، ' : ', ');
    let body: string;
    if (step === 'arriving') body = T(lang, 'push.body.arriving', { who: first.driver_name });
    else if (step === 'late') {
      const r = (['traffic', 'breakdown', 'roadClosed'].includes(reason ?? '') ? reason : 'traffic') as 'traffic' | 'breakdown' | 'roadClosed';
      body = T(lang, 'parent.late', { reason: T(lang, `help.reason.${r}`) });
    } else body = T(lang, 'push.body.by', { who: first.driver_name });
    const quiet = first.sound === false || (opts.quietHours === true && step !== 'late');
    const kids = [...new Set(rows.map((r) => r.child_id))];
    const tone = STEP_SOUND[step];
    out.push({
      to: token,
      title: T(lang, `push.title.${step}` as Key, { names }),
      body,
      sound: quiet ? null : `a_${tone}.wav`,
      priority: 'high',
      channelId: quiet ? 'step-quiet' : stepChannel(step),
      interruptionLevel: TIME_SENSITIVE.includes(step) ? 'time-sensitive' : 'active',
      categoryId: step === 'left' ? 'trip-left' : step === 'arriving' ? 'trip-door' : 'trip',
      data: step === 'left' ? { kind: 'trip', step, children: kids }
        : step === 'arriving' ? { kind: 'trip', step, children: kids, ...(opts.tripId ? { trip: opts.tripId } : {}) }
        : { kind: 'trip', step },
    });
  }
  return out;
}

export type DayOffRecipient = { first_name: string; token: string; lang: string; driver_name: string; sound?: boolean };

/** "today", "tomorrow" or "on 12/11", in the phone's language. Dates are Karachi school days (YYYY-MM-DD). */
function whenText(lang: Lang, date: string, today: string): string {
  if (date === today) return T(lang, 'push.when.today');
  const next = new Date(`${today}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  if (date === next.toISOString().slice(0, 10)) return T(lang, 'push.when.tomorrow');
  const [, m, d] = date.split('-');
  return T(lang, 'push.when.date', { date: `${Number(d)}/${Number(m)}` });
}

/** The driver gave the whole van a day off (or cancelled it): one message per phone, naming its children. */
export function buildDayOffPushes(recipients: DayOffRecipient[], job: { date: string; today: string; off: boolean }): ExpoMessage[] {
  const byToken = new Map<string, DayOffRecipient[]>();
  for (const r of recipients) byToken.set(r.token, [...(byToken.get(r.token) ?? []), r]);
  const out: ExpoMessage[] = [];
  for (const [token, rows] of byToken) {
    const first = rows[0] as DayOffRecipient;
    const lang: Lang = first.lang === 'en' ? 'en' : 'ur';
    const names = [...new Set(rows.map((r) => r.first_name))].join(lang === 'ur' ? '، ' : ', ');
    const when = whenText(lang, job.date, job.today);
    const quiet = first.sound === false;
    out.push({
      to: token,
      title: T(lang, job.off ? 'push.dayOff.title' : 'push.dayOn.title', { when }),
      body: T(lang, job.off ? 'push.dayOff.body' : 'push.dayOn.body', { who: first.driver_name, names }),
      sound: quiet ? null : 'a_left.wav',
      priority: 'high',
      channelId: quiet ? 'step-quiet' : stepChannel('left'),
      interruptionLevel: 'active',
      categoryId: 'trip',
      data: { kind: 'dayoff', date: job.date, off: job.off },
    });
  }
  return out;
}

export type DriverRecipient = { token: string; lang: string; first_name?: string };

/** v9: the driver's two alerts: a family asking to join (with the child's first name), the van verified. */
export function buildDriverPushes(what: 'request' | 'verified', recipients: DriverRecipient[]): ExpoMessage[] {
  const seen = new Set<string>();
  const out: ExpoMessage[] = [];
  for (const r of recipients) {
    if (seen.has(r.token)) continue;
    seen.add(r.token);
    const lang: Lang = r.lang === 'en' ? 'en' : 'ur';
    out.push({
      to: r.token,
      title: T(lang, what === 'request' ? 'push.driver.request.title' : 'push.driver.verified.title'),
      body: T(lang, what === 'request' ? 'push.driver.request.body' : 'push.driver.verified.body', { name: r.first_name ?? '' }),
      sound: 'default',
      priority: 'high',
      channelId: 'driver',
      interruptionLevel: 'active',
      categoryId: 'driver',
      data: { kind: 'driver', what },
    });
  }
  return out;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/** Sends in batches of 100 (Expo's limit). Returns the tokens Expo says no longer exist. */
export async function sendExpoPushes(messages: ExpoMessage[], opts: { fetch: typeof fetch; accessToken?: string }): Promise<{ sent: number; dead: string[] }> {
  const dead: string[] = [];
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    const res = await opts.fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        ...(opts.accessToken ? { authorization: `Bearer ${opts.accessToken}` } : {}),
      },
      body: JSON.stringify(batch),
    });
    if (!res.ok) continue;
    const json = (await res.json().catch(() => ({}))) as { data?: { status: string; details?: { error?: string } }[] };
    (json.data ?? []).forEach((ticket, j) => {
      if (ticket.status === 'ok') sent++;
      else if (ticket.details?.error === 'DeviceNotRegistered') dead.push((batch[j] as ExpoMessage).to);
    });
  }
  return { sent, dead };
}
