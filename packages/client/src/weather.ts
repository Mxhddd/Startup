// v12 rain mode: is it raining in Karachi right now? One reading for the city centre from Open-Meteo
// (free, no key, no account). Only fixed coordinates are sent, never the phone's or the van's
// location. Read at most every 15 minutes; any failure simply means "no rain banner".
import { isRaining } from '@pohnch/core';
import { useEffect, useState } from 'react';

const URL = 'https://api.open-meteo.com/v1/forecast?latitude=24.86&longitude=67.01&current=precipitation,rain,weather_code&timezone=Asia%2FKarachi';
const EVERY = 15 * 60_000;
let last: { at: number; rain: boolean } | null = null;

export async function rainNow(fetcher: typeof fetch = fetch): Promise<boolean> {
  if (last && Date.now() - last.at < EVERY) return last.rain;
  try {
    const r = await fetcher(URL);
    if (!r.ok) return false;
    const j = (await r.json()) as { current?: { rain?: number; precipitation?: number; weather_code?: number } };
    last = { at: Date.now(), rain: isRaining(j.current) };
    return last.rain;
  } catch {
    return false;
  }
}

/** True while it's raining in Karachi (checked now and every 15 minutes). */
export function useRain(enabled = true): boolean {
  const [rain, setRain] = useState(last?.rain ?? false);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const check = () => rainNow().then((r) => alive && setRain(r));
    check();
    const id = setInterval(check, EVERY);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [enabled]);
  return rain;
}

/** For tests: forget the last reading. */
export function _resetRain() {
  last = null;
}
