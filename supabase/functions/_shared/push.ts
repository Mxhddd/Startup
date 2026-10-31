// Push notifications for trip steps, sent through Expo's push service (which passes them to Apple and Google).
// The words come from pushText.json (generated from the apps' ur.json and en.json), in each phone's language.
// Logs carry counts only: never tokens, phone numbers or children's names.
import text from './pushText.json' with { type: 'json' };

export type Recipient = { child_id: string; first_name: string; token: string; platform: string; lang: string; driver_name: string };
export type PushStep = 'left' | 'picked' | 'arriving' | 'reached_school' | 'left_school' | 'dropped' | 'late';
export type ExpoMessage = {
  to: string;
  title: string;
  body: string;
  sound: 'default';
  priority: 'high';
  channelId: 'trip';
  data: { kind: 'trip'; step: PushStep };
};

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
    out.push({ to: token, title: names, body, sound: 'default', priority: 'high', channelId: 'trip', data: { kind: 'trip', step } });
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
