import { describe, expect, it } from 'vitest';
import { toLoginError } from './errors';

describe('login errors', () => {
  it('passes the screen input errors through', () => {
    expect(toLoginError({ kind: 'phone' })).toBe('phone');
    expect(toLoginError({ kind: 'notConfigured' })).toBe('notConfigured');
  });
  it('reads Supabase Auth errors', () => {
    expect(toLoginError({ status: 403, code: 'otp_expired', message: 'Token has expired or is invalid' })).toBe('code');
    expect(toLoginError({ status: 429, code: 'over_sms_send_rate_limit', message: 'too many' })).toBe('tooMany');
    expect(toLoginError({ name: 'AuthRetryableFetchError', message: 'Network request failed' })).toBe('offline');
    expect(toLoginError({ status: 500, message: 'Error sending sms OTP' })).toBe('notConfigured');
  });
  it('falls back to a calm general message', () => {
    expect(toLoginError(new Error('weird'))).toBe('generic');
    expect(toLoginError(null)).toBe('generic');
  });
});
