// After a step is stored: find who should hear about it, send the pushes, and forget phones that are gone.
// A push failing never fails the driver's tap: the step is already saved, and the parent's map shows it.
import { buildPushes, sendExpoPushes, type PushStep, type Recipient } from './push.ts';

export type NotifyJob = { tripId: string; step: PushStep; children: string[] | null; reason?: string | null };

export type NotifyDeps = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  fetch: typeof fetch;
  expoAccessToken?: string;
  log: (line: string) => void;
};

export async function notifyTrip(job: NotifyJob, deps: NotifyDeps): Promise<void> {
  try {
    const { data, error } = await deps.rpc('push_recipients', { p_trip: job.tripId, p_children: job.children });
    if (error) throw new Error('recipients');
    const recipients = (data ?? []) as Recipient[];
    if (recipients.length === 0) return;
    const messages = buildPushes(job.step, recipients, job.reason);
    const { sent, dead } = await sendExpoPushes(messages, { fetch: deps.fetch, accessToken: deps.expoAccessToken });
    if (dead.length) await deps.rpc('remove_push_tokens', { p_tokens: dead });
    // Counts only, for the admin page's "alerts delivered".
    await deps.rpc('record_push_stats', { p_sent: sent, p_dead: dead.length, p_failed: messages.length - sent - dead.length });
    deps.log(`push ${job.step} sent=${sent} dead=${dead.length}`);
  } catch {
    deps.log(`push ${job.step} failed`);
  }
}
