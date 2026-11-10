import { describe, expect, it } from 'vitest';
import { href, otherHref } from './links';

describe('page addresses', () => {
  it('puts English at the root and Urdu under /ur', () => {
    expect(href('en', '/')).toBe('/'); expect(href('en', '/drivers')).toBe('/drivers');
    expect(href('ur', '/')).toBe('/ur'); expect(href('ur', '/drivers')).toBe('/ur/drivers'); expect(href('ur', '/#join')).toBe('/ur#join');
  });
  it('links each page to the same page in the other language', () => {
    expect(otherHref('en', '/safety')).toBe('/ur/safety'); expect(otherHref('ur', '/safety')).toBe('/safety'); expect(otherHref('ur', '/')).toBe('/');
  });
});
