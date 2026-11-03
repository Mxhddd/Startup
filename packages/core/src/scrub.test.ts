import { describe, expect, it } from 'vitest';
import { scrubEvent, scrubText } from './scrub';

describe('crash reports carry nothing personal', () => {
  it('hides phone numbers, tokens and places in any text', () => {
    expect(scrubText('call 0300 1234567 or +923211234567')).toBe('call [phone] or [phone]');
    expect(scrubText('jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.c2lnbmF0dXJlLXZhbHVl end')).toBe('jwt [token] end');
    expect(scrubText('/i/AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abcde')).toBe('/i/[token]');
    expect(scrubText('van at 24.91234, 67.08123')).toBe('van at [place]');
    expect(scrubText('TypeError: undefined is not a function')).toBe('TypeError: undefined is not a function');
  });

  it('drops the user, request and extras, and keeps only bare screen changes', () => {
    const out = scrubEvent({
      message: 'failed for 03001234567',
      user: { id: 'u1', phone: '+923001234567' },
      request: { url: 'https://x' },
      extra: { childName: 'Ali' },
      breadcrumbs: [
        { category: 'ui.click', message: 'Ali ko hataein' },
        { category: 'console', message: 'Ali' },
        { category: 'navigation', type: 'navigation', data: { from: '/family', to: '/child?id=k1' } },
      ],
      exception: { values: [{ value: 'at 24.9100, 67.0800' }] },
    });
    expect(out.user).toBeUndefined();
    expect(out.request).toBeUndefined();
    expect(out.extra).toBeUndefined();
    expect(out.message).toBe('failed for [phone]');
    expect(out.breadcrumbs).toEqual([{ category: 'navigation', type: 'navigation', timestamp: undefined, data: { from: '/family', to: '/child' } }]);
    expect(JSON.stringify(out)).not.toContain('Ali');
    expect((out.exception as { values: { value: string }[] }).values[0]?.value).toBe('at [place]');
  });
});
