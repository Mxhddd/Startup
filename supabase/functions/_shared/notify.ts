// After a step is stored: find who should hear about it, send the pushes, and forget phones that are gone.
// A push failing never fails the driver's tap: the step is already saved, and the parent's map shows it.
import { buildDayOffPushes, buildDriverPushes, buildNoticePushes, buildPushes, inQuietHours, sendExpoPushes, type DayOffRecipient, type DriverRecipient, type NoticeJob, type NoticeRecipient, type PushStep, type Recipient } from './push.ts';

export type NotifyJob = { tripId: string; step: PushStep; children: string[] | null; reason?: string | null };

export type NotifyDeps = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  fetch: typeof fetch;
  expoAccessToken?: string;
  log: (line: string) => void;
};

export async function notifyTrip(job: NotifyJob, deps: NotifyDeps): Promise<void> {
  try {
    const { data, error } = await deps.rpc('push_recipients', { p_trip: job.tripId, p_children: job.children, p_step: job.step });
    if (error) throw new Error('recipients');
    const recipients = (data ?? []) as Recipient[];
    if (recipients.length === 0) return;
    const messages = buildPushes(job.step, recipients, job.reason, { tripId: job.tripId, quietHours: inQuietHours(new Date()) });
    const { sent, dead } = await sendExpoPushes(messages, { fetch: deps.fetch, accessToken: deps.expoAccessToken });
    if (dead.length) await deps.rpc('remove_push_tokens', { p_tokens: dead });
    // Counts only, for the admin page's "alerts delivered".
    await deps.rpc('record_push_stats', { p_sent: sent, p_dead: dead.length, p_failed: messages.length - sent - dead.length });
    deps.log(`push ${job.step} sent=${sent} dead=${dead.length}`);
  } catch {
    deps.log(`push ${job.step} failed`);
  }
}

export type DayOffJob = { vanId: string; date: string; today: string; off: boolean };

/** The driver's whole-van day off: every family on the van hears about it once. */
export async function notifyDayOff(job: DayOffJob, deps: NotifyDeps): Promise<void> {
  try {
    const { data, error } = await deps.rpc('dayoff_recipients', { p_van: job.vanId });
    if (error) throw new Error('recipients');
    const recipients = (data ?? []) as DayOffRecipient[];
    if (recipients.length === 0) return;
    const messages = buildDayOffPushes(recipients, job);
    const { sent, dead } = await sendExpoPushes(messages, { fetch: deps.fetch, accessToken: deps.expoAccessToken });
    if (dead.length) await deps.rpc('remove_push_tokens', { p_tokens: dead });
    await deps.rpc('record_push_stats', { p_sent: sent, p_dead: dead.length, p_failed: messages.length - sent - dead.length });
    deps.log(`push dayoff sent=${sent} dead=${dead.length}`);
  } catch {
    deps.log('push dayoff failed');
  }
}

export type DriverJob = { what: 'request'; membershipId: string } | { what: 'verified'; vanId: string };

/** v9: tells the van's driver about a family's request or the van being verified. Never throws. */
export async function notifyDriver(job: DriverJob, deps: NotifyDeps): Promise<void> {
  try {
    const { data, error } = job.what === 'request'
      ? await deps.rpc('request_push_targets', { p_membership: job.membershipId })
      : await deps.rpc('driver_push_targets', { p_van: job.vanId });
    if (error) throw new Error('recipients');
    const recipients = (data ?? []) as DriverRecipient[];
    if (recipients.length === 0) return;
    const messages = buildDriverPushes(job.what, recipients);
    const { sent, dead } = await sendExpoPushes(messages, { fetch: deps.fetch, accessToken: deps.expoAccessToken });
    if (dead.length) await deps.rpc('remove_push_tokens', { p_tokens: dead });
    deps.log(`push driver sent=${sent} dead=${dead.length}`);
  } catch {
    deps.log('push driver failed');
  }
}


export type NoticePush = { vanId: string | null; job: NoticeJob };

/** v12: a time change (one van) or a team notice (one van or everyone): families and drivers hear it once. */
export async function notifyNotice(n: NoticePush, deps: NotifyDeps): Promise<void> {
  try {
    const { data, error } = await deps.rpc('notice_recipients', { p_van: n.vanId });
    if (error) throw new Error('recipients');
    const recipients = (data ?? []) as NoticeRecipient[];
    if (recipients.length === 0) return;
    const messages = buildNoticePushes(recipients, n.job);
    const { sent, dead } = await sendExpoPushes(messages, { fetch: deps.fetch, accessToken: deps.expoAccessToken });
    if (dead.length) await deps.rpc('remove_push_tokens', { p_tokens: dead });
    await deps.rpc('record_push_stats', { p_sent: sent, p_dead: dead.length, p_failed: messages.length - sent - dead.length });
    deps.log(`push ${n.job.kind} sent=${sent} dead=${dead.length}`);
  } catch {
    deps.log(`push ${n.job.kind} failed`);
  }
}
