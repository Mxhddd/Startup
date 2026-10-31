import { describe, expect, it, vi } from 'vitest';
import { ApiError, chunkedStorage, createAppApi, displayPkMobile, normalisePkMobile, type KeyStore } from './index';

describe('Pakistani mobile numbers', () => {
  it('reads every common way of typing one', () => {
    for (const s of ['03001234567', '0300 1234567', '0300-1234567', '+92 300 1234567', '923001234567', '00923001234567']) {
      expect(normalisePkMobile(s), s).toBe('+923001234567');
    }
  });
  it('refuses landlines and short numbers', () => {
    expect(normalisePkMobile('021 34567890')).toBeNull();
    expect(normalisePkMobile('0300 12345')).toBeNull();
    expect(normalisePkMobile('')).toBeNull();
  });
  it('shows a number back the way people write it', () => {
    expect(displayPkMobile('+923001234567')).toBe('0300 1234567');
  });
});

describe('Edge Function client', () => {
  const ok = (body: unknown, status = 200) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

  it('sends the action with the login token', async () => {
    const f = ok({ stored: 1 });
    const api = createAppApi({ functionsUrl: 'https://p.supabase.co/functions/v1/', getToken: async () => 'tok', fetch: f });
    expect(await api('tap', { a: 1 })).toEqual({ stored: 1 });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://p.supabase.co/functions/v1/app/tap');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer tok');
  });

  it('turns a refusal into an ApiError with the code', async () => {
    const api = createAppApi({ functionsUrl: 'u', getToken: async () => 'tok', fetch: ok({ error: 'not_your_van' }, 403) });
    await expect(api('tap', {})).rejects.toMatchObject({ code: 'not_your_van', status: 403, retryable: false });
  });

  it('marks no-signal errors as worth retrying', async () => {
    const api = createAppApi({ functionsUrl: 'u', getToken: async () => 'tok', fetch: vi.fn(async () => { throw new TypeError('Network request failed'); }) });
    const err = await api('tap', {}).catch((e: ApiError) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).retryable).toBe(true);
  });

  it('does not call the server when logged out', async () => {
    const f = ok({});
    const api = createAppApi({ functionsUrl: 'u', getToken: async () => null, fetch: f });
    await expect(api('tap', {})).rejects.toMatchObject({ code: 'not_logged_in' });
    expect(f).not.toHaveBeenCalled();
  });
});

describe('chunked secure storage', () => {
  const memory = (): KeyStore & { size: () => number } => {
    const m = new Map<string, string>();
    return {
      getItem: async (k) => m.get(k) ?? null,
      setItem: async (k, v) => { if (v.length > 2048) throw new Error('too big for secure storage'); m.set(k, v); },
      removeItem: async (k) => { m.delete(k); },
      size: () => m.size,
    };
  };

  it('stores a 5 KB session in pieces small enough for the keychain and reads it back', async () => {
    const raw = memory();
    const s = chunkedStorage(raw);
    const session = 'x'.repeat(5000);
    await s.setItem('sb', session);
    expect(await s.getItem('sb')).toBe(session);
    expect(raw.size()).toBe(4); // 3 pieces + the count
  });

  it('leaves nothing behind after logout, even after a shorter value', async () => {
    const raw = memory();
    const s = chunkedStorage(raw);
    await s.setItem('sb', 'y'.repeat(5000));
    await s.setItem('sb', 'short');
    expect(raw.size()).toBe(2);
    await s.removeItem('sb');
    expect(raw.size()).toBe(0);
    expect(await s.getItem('sb')).toBeNull();
  });
});
