// Supabase Auth errors -> the login screen's messages. Kept apart so it can be tested without a phone.
export type LoginError = 'phone' | 'code' | 'name' | 'offline' | 'tooMany' | 'notConfigured' | 'generic';

export function toLoginError(e: unknown): LoginError {
  if (e && typeof e === 'object') {
    const err = e as { kind?: string; status?: number; code?: string; message?: string; name?: string };
    if (err.kind && ['phone', 'code', 'name', 'notConfigured'].includes(err.kind)) return err.kind as LoginError;
    const msg = (err.message ?? '').toLowerCase();
    const code = err.code ?? '';
    if (err.status === 429 || code === 'over_sms_send_rate_limit' || code === 'over_request_rate_limit') return 'tooMany';
    if (code === 'otp_expired' || code === 'invalid_credentials' || msg.includes('token has expired or is invalid')) return 'code';
    if (code === 'validation_failed' && msg.includes('phone')) return 'phone';
    if (msg.includes('invalid phone') || code === 'phone_provider_disabled') return code === 'phone_provider_disabled' ? 'notConfigured' : 'phone';
    if (err.name === 'AuthRetryableFetchError' || msg.includes('network request failed') || msg.includes('failed to fetch')) return 'offline';
    if (msg.includes('sms') && (msg.includes('send') || msg.includes('hook'))) return 'notConfigured';
  }
  return 'generic';
}
