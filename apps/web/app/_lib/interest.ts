// The website's side of "Join the pilot": sends the form to the `interest` Edge Function, asks it for
// the waiting-map counts and the pilot numbers, and counts which honest answers people open. The
// function holds the service key; the website only knows the public project URL. Nothing here is
// logged, and failures are quiet (the form shows its own error).
import type { Interest } from '@pohnch/core';

const base = (): string | null => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url ? `${url.replace(/\/$/, '')}/functions/v1/interest` : null;
};

export type Summary = { areas: Record<string, number>; proof: { vans: number; trips: number; alerts: number } | null };

/** Sends the join form. Resolves true when the server saved it. The hidden field `website` is the bot trap. */
export async function sendInterest(value: Interest, lang: 'ur' | 'en', website: string): Promise<boolean> {
  const url = base();
  if (!url) return false;
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'join', lang, website, ...value }) });
    return res.ok;
  } catch {
    return false;
  }
}

/** The counts per area (only areas with 3 or more) and the pilot numbers (null until they mean something). */
export async function fetchSummary(): Promise<Summary> {
  const url = base();
  const empty: Summary = { areas: {}, proof: null };
  if (!url) return empty;
  try {
    const res = await fetch(`${url}?summary=1`, { method: 'GET' });
    if (!res.ok) return empty;
    const j = (await res.json()) as Partial<Summary>;
    return { areas: j.areas && typeof j.areas === 'object' ? j.areas : {}, proof: j.proof ?? null };
  } catch {
    return empty;
  }
}

/** Counts one opening of an honest answer (1-6). Anonymous: only the answer's number is sent. */
export function countDoubt(n: number): void {
  const url = base();
  if (!url || !Number.isInteger(n) || n < 1 || n > 6) return;
  try {
    void fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind: 'doubt', n }), keepalive: true }).catch(() => undefined);
  } catch {
    /* counting is best effort */
  }
}
