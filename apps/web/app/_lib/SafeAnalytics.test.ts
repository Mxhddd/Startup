// The page counter never sees invite tokens, the team page or the invite page (v20 security).
import { describe, expect, it } from 'vitest';
import { scrub } from './SafeAnalytics';

const ev = (url: string) => ({ type: 'pageview' as const, url });
describe('the page counter', () => {
  it('counts invite links without their token', () => {
    expect(scrub(ev('https://pohnch.pk/i/abcDEF123_-xyz?x=1#t'))?.url).toBe('https://pohnch.pk/i/[token]');
  });
  it('never counts the team page or the invite page', () => {
    expect(scrub(ev('https://pohnch.pk/admin'))).toBe(null);
    expect(scrub(ev('https://pohnch.pk/invite'))).toBe(null);
  });
  it('drops query strings and fragments everywhere', () => {
    expect(scrub(ev('https://pohnch.pk/drivers?ref=wa#join'))?.url).toBe('https://pohnch.pk/drivers');
  });
});
