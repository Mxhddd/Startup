// v24: after login, a website sign-up is linked, and only accounts with no phone and no WhatsApp number
// are asked for one.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = { phone: '' as string, contact: null as string | null, linked: 0 };
vi.mock('./backend', () => ({
  backend: {
    supabase: {
      rpc: async (name: string) => {
        if (name === 'link_my_interest') state.linked++;
        return { data: [], error: null };
      },
      auth: { getUser: async () => ({ data: { user: { phone: state.phone } } }) },
      from: () => ({ select: () => ({ maybeSingle: async () => ({ data: state.contact ? { phone: state.contact } : null, error: null }) }) }),
    },
  },
}));

import { afterLogin } from './places';

describe('afterLogin', () => {
  beforeEach(() => Object.assign(state, { phone: '', contact: null, linked: 0 }));
  it('links the website sign-up every time', async () => {
    state.phone = '923001234567';
    await afterLogin();
    expect(state.linked).toBe(1);
  });
  it('does not ask a phone-login account', async () => {
    state.phone = '923001234567';
    expect(await afterLogin()).toEqual({ needsPhone: false });
  });
  it('asks a Google account with no WhatsApp number', async () => {
    expect(await afterLogin()).toEqual({ needsPhone: true });
  });
  it('does not ask once a WhatsApp number is saved', async () => {
    state.contact = '+923211234567';
    expect(await afterLogin()).toEqual({ needsPhone: false });
  });
});
