// The team page only ever hands a public Supabase key to the browser (v20 security).
import { describe, expect, it } from 'vitest';
import { isPublicKey } from './publicKey';

const jwt = (role: string) => `x.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.y`;
describe('isPublicKey', () => {
  it('accepts anon and publishable keys', () => {
    expect(isPublicKey(jwt('anon'))).toBe(true);
    expect(isPublicKey('sb_publishable_abc')).toBe(true);
  });
  it('refuses service keys and junk', () => {
    expect(isPublicKey(jwt('service_role'))).toBe(false);
    expect(isPublicKey('sb_secret_abc')).toBe(false);
    expect(isPublicKey('')).toBe(false);
    expect(isPublicKey('not.a.key')).toBe(false);
  });
});
