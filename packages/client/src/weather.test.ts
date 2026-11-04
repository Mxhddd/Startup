import { describe, expect, it } from 'vitest';
import { _resetRain, rainNow } from './weather';

const reply = (current: unknown, ok = true) => (async () => ({ ok, json: async () => ({ current }) })) as unknown as typeof fetch;

describe('rain mode', () => {
  it('reads rain from Open-Meteo and asks only for the city centre', async () => {
    _resetRain();
    let asked = '';
    const f = (async (u: string) => {
      asked = u;
      return { ok: true, json: async () => ({ current: { rain: 1.2, precipitation: 1.2, weather_code: 61 } }) };
    }) as unknown as typeof fetch;
    expect(await rainNow(f)).toBe(true);
    expect(asked).toContain('latitude=24.86&longitude=67.01');
  });
  it('says no rain on a dry reading, a bad reply or no network', async () => {
    _resetRain();
    expect(await rainNow(reply({ rain: 0, precipitation: 0, weather_code: 1 }))).toBe(false);
    _resetRain();
    expect(await rainNow(reply(null, false))).toBe(false);
    _resetRain();
    expect(await rainNow((async () => { throw new Error('offline'); }) as unknown as typeof fetch)).toBe(false);
  });
});
