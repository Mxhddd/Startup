// The built-in public settings (v20 deploy): the Supabase key that ships to browsers is the publishable one,
// never the secret one, and the Turnstile key is a site key (its secret lives only in the interest function).
import { describe, expect, it } from 'vitest';
import { isPublicKey } from '../admin/publicKey';
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL, TURNSTILE_SITE_KEY } from './publicConfig';

describe('public config', () => {
  it('ships only a public Supabase key', () => {
    expect(SUPABASE_PUBLIC_KEY.startsWith('sb_publishable_')).toBe(true);
    expect(isPublicKey(SUPABASE_PUBLIC_KEY)).toBe(true);
  });
  it('points at our own project over https', () => {
    expect(SUPABASE_URL).toBe('https://vsyunieszswpreogzolx.supabase.co');
  });
  it('uses a Turnstile site key, not a secret', () => {
    expect(TURNSTILE_SITE_KEY).toMatch(/^0x4AAAAAA[A-Za-z0-9_-]+$/);
    expect(TURNSTILE_SITE_KEY.length).toBeLessThan(30);
  });
});
