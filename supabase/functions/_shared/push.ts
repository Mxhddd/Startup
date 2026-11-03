// Push notifications for trip steps, sent through Expo's push service (which passes them to Apple and Google).
// The words come from pushText.json (generated from the apps' ur.json and en.json), in each phone's language.
// Logs carry counts only: never tokens, phone numbers or children's names.
import text from './pushText.json' with { type: 'json' };

export type Recipient = { child_id: string; first_name: string; token: string; platform: string; lang: string; driver_name: string; sound?: boolean };
export type PushStep = 'left' | 'picked' | 'arriving' | 'reached_school' | 'left_school' | 'dropped' | 'late';
/** Android channels (one per sound, since Android fixes a channel's sound when it is made). */
export type AlertChannel = 'step-chime' | 'step-pohnch' | 'step-quiet';

export type ExpoMessage = {
  to: string;
  title: string;
  body: string;
  /** iPhone: our sound file, or null for a quiet alert. Android takes the channel's sound. */
  sound: 'chime.wav' | 'pohnch.wav' | null;
  priority: 'high';
  channelId: AlertChannel;
  /** iPhone: "arriving" and "late" may show through Focus; the rest are ordinary. */
  interruptionLevel: 'time-sensitive' | 'active';
  /** The notification's buttons ("Open trip"), registered by the app. */
  categoryId: 'trip';
  data: { kind: 'trip'; step: PushStep } | { kind: 'dayoff'; date: string; off: boolean };
};

// The same table the apps use (packages/core/src/moments.ts), copied by value: Edge Functions can't
// import the app workspace. push.test.ts checks the two stay in step.
export const STEP_SOUND: Record<PushStep, 'chime' | 'pohnch'> = {
  left: 'chime', picked: 'chime', arriving: 'chime', reached_school: 'pohnch', left_school: 'chime', dropped: 'pohnch', late: 'chime',
};
export const TIME_SENSITIVE: PushStep[] = ['arriving', 'late'];

type Lang = 'ur' | 'en';
type Key = keyof (typeof text)['en'];
const T = (lang: Lang, key: Key, vars: Record<string, string> = {}) =>
  (text[lang][key] as string).replace(/\{(\w+)\}/g, (w, n: string) => vars[n] ?? w);

const STEP_KEY: Record<Exclude<PushStep, 'arriving' | 'late'>, Key> = {
  left: 'step.left', picked: 'step.picked', reached_school: 'step.reachedSchool', left_school: 'step.leftSchool', dropped: 'step.dropped',
};

/** One message per phone; brothers and sisters in one step share it ("علی، سارہ"). */
export function buildPushes(step: PushStep, recipients: Recipient[], reason?: string | null): ExpoMessage[] {
  const byToken = new Map<string, Recipient[]>();
  for (const r of recipients) byToken.set(r.token, [...(byToken.get(r.token) ?? []), r]);
  const out: ExpoMessage[] = [];
  for (const [token, rows] of byToken) {
    const first = rows[0] as Recipient;
    const lang: Lang = first.lang === 'en' ? 'en' : 'ur';
    const names = [...new Set(rows.map((r) => r.first_name))].join(lang === 'ur' ? '، ' : ', ');
    let body: string;
    if (step === 'arriving') body = T(lang, 'eta.door');
    else if (step === 'late') {
      const r = (['traffic', 'breakdown', 'roadClosed'].includes(reason ?? '') ? reason : 'traffic') as 'traffic' | 'breakdown' | 'roadClosed';
      body = T(lang, 'parent.late', { reason: T(lang, `help.reason.${r}`) });
    } else body = `${T(lang, STEP_KEY[step])} · ${T(lang, 'timeline.by', { who: first.driver_name })}`;
    const quiet = first.sound === false;
    const tone = STEP_SOUND[step];
    out.push({
      to: token,
      title: names,
      body,
      sound: quiet ? null : tone === 'pohnch' ? 'pohnch.wav' : 'chime.wav',
      priority: 'high',
      channelId: quiet ? 'step-quiet' : tone === 'pohnch' ? 'step-pohnch' : 'step-chime',
      interruptionLevel: TIME_SENSITIVE.includes(step) ? 'time-sensitive' : 'active',
      categoryId: 'trip',
      data: { kind: 'trip', step },
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
      sound: quiet ? null : 'chime.wav',
      priority: 'high',
      channelId: quiet ? 'step-quiet' : 'step-chime',
      interruptionLevel: 'active',
      categoryId: 'trip',
      data: { kind: 'dayoff', date: job.date, off: job.off },
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
