// The website's side of "Join the pilot": sends the form to the `interest` Edge Function, asks it for
// the waiting-map counts and the pilot numbers, and counts which honest answers people open. The
// function holds the service key; the website only knows the public project URL. Nothing here is
// logged, and failures are quiet (the form shows its own error).
import { INTEREST_URL, type AreaMeter, type Interest } from '@pohnch/core';
import { SUPABASE_URL } from './publicConfig';

// The project URL when the build has one (tests point it at a stub), else the public endpoint.
const base = (): string => {
  return SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/interest` : INTEREST_URL;
};

/** areas: exact family counts for areas with 3+; meter (v19): bands and a status per area; proof: pilot numbers once they mean something.
 *  status (v20): 'loading' until the answer arrives, 'error' if it couldn't be fetched, so the site never says "be the first" when it simply doesn't know. */
export type SummaryStatus = 'loading' | 'ready' | 'error';
export type Summary = { areas: Record<string, number>; meter: Record<string, AreaMeter>; proof: { vans: number; trips: number; alerts: number } | null; status: SummaryStatus };
export const LOADING_SUMMARY: Summary = { areas: {}, meter: {}, proof: null, status: 'loading' };

/** Sends the join form: 'ok' when the server saved it, 'human' when the bot check (Turnstile) didn't pass,
 *  'error' otherwise. The hidden field `website` is the bot trap; `turnstile` is the bot check's token. */
export async function sendInterest(value: Interest, lang: 'ur' | 'en', website: string, turnstile = ''): Promise<'ok' | 'human' | 'error'> {
  const url = base();
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'join', lang, website, turnstile, ...value }) });
    return res.ok ? 'ok' : res.status === 403 ? 'human' : 'error';
  } catch {
    return 'error';
  }
}

/** The counts per area (only areas with 3 or more) and the pilot numbers (null until they mean something). */
export async function fetchSummary(): Promise<Summary> {
  const url = base();
  const failed: Summary = { areas: {}, meter: {}, proof: null, status: 'error' };
  try {
    const res = await fetch(`${url}?summary=1`, { method: 'GET' });
    if (!res.ok) return failed;
    const j = (await res.json()) as Partial<Summary>;
    return { areas: j.areas && typeof j.areas === 'object' ? j.areas : {}, meter: j.meter && typeof j.meter === 'object' ? j.meter : {}, proof: j.proof ?? null, status: 'ready' };
  } catch {
    return failed;
  }
}

/** Counts one opening of an honest answer (1-6). Anonymous: only the answer's number is sent. */
export function countDoubt(n: number): void {
  const url = base();
  if (!Number.isInteger(n) || n < 1 || n > 6) return;
  try {
    void fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'doubt', n }), keepalive: true }).catch(() => undefined);
  } catch {
    /* counting is best effort */
  }
}
