import { describe, expect, it } from 'vitest';
import { tokenFromInviteLink } from './index';

const T = 'AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abcde'; // 43 characters

describe('invite links', () => {
  it('finds the token in the link, a WhatsApp message, or the app link', () => {
    expect(tokenFromInviteLink(`https://pohnch.pk/i/${T}`)).toBe(T);
    expect(tokenFromInviteLink(`Rafiq bhai's van · Pohnch\nhttps://pohnch.pk/i/${T}`)).toBe(T);
    expect(tokenFromInviteLink(`pohnch://i/${T}`)).toBe(T);
    expect(tokenFromInviteLink(`/i/${T}`)).toBe(T);
  });
  it('refuses anything else', () => {
    expect(tokenFromInviteLink('https://evil.example/i/' + T)).toBeNull();
    expect(tokenFromInviteLink(`https://pohnch.pk/i/${T}x`)).toBeNull();
    expect(tokenFromInviteLink('hello')).toBeNull();
  });
});
