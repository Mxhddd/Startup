import { describe, expect, it, vi } from 'vitest';
import { handleSendSms, smsText, verifyWebhook, webhookSignature } from './sms.ts';

const SECRET = 'v1,whsec_' + btoa('a-test-secret-of-some-length-123');
const PHONE = '923001234567';
const CODE = '482913';

async function signed(body: string, secret = SECRET, ts = Math.floor(Date.now() / 1000)) {
  const sig = await webhookSignature(secret, 'msg_1', String(ts), body);
  return new Request('https://x/functions/v1/send-sms', {
    method: 'POST',
    headers: { 'webhook-id': 'msg_1', 'webhook-timestamp': String(ts), 'webhook-signature': `v1,${sig}` },
    body,
  });
}

function deps(ok = true) {
  const logs: string[] = [];
  const fetchMock = vi.fn(async () => new Response('{}', { status: ok ? 200 : 500 }));
  return { logs, fetchMock, d: { secret: SECRET, gatewayUrl: 'https://sms.example/send', gatewayKey: 'k', fetch: fetchMock as unknown as typeof fetch, log: (l: string) => logs.push(l) } };
}

const payload = JSON.stringify({ user: { phone: PHONE }, sms: { otp: CODE } });

describe('login code SMS', () => {
  it('fits one Unicode SMS and contains the code', () => {
    const text = smsText(CODE);
    expect(text).toContain(CODE);
    expect([...text].length).toBeLessThanOrEqual(70);
  });

  it('sends the code to the gateway when Supabase signed the request', async () => {
    const { d, fetchMock } = deps();
    const res = await handleSendSms(await signed(payload), d);
    expect(res.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toMatchObject({ to: '+' + PHONE, message: smsText(CODE) });
  });

  it('refuses a request signed with another secret', async () => {
    const { d, fetchMock } = deps();
    const res = await handleSendSms(await signed(payload, 'v1,whsec_' + btoa('someone-else')), d);
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses an old (replayed) request', async () => {
    const { d } = deps();
    const res = await handleSendSms(await signed(payload, SECRET, Math.floor(Date.now() / 1000) - 3600), d);
    expect(res.status).toBe(401);
  });

  it('refuses a body changed after signing', async () => {
    const req = await signed(payload);
    const tampered = new Request(req.url, { method: 'POST', headers: req.headers, body: payload.replace(CODE, '000000') });
    expect(await verifyWebhook(SECRET, tampered.headers, await tampered.text())).toBe(false);
  });

  it('never logs the phone number or the code', async () => {
    const { d, logs } = deps(false);
    const res = await handleSendSms(await signed(payload), d);
    expect(res.status).toBe(502);
    expect(logs.join('\n')).not.toContain(PHONE);
    expect(logs.join('\n')).not.toContain(CODE);
  });

  it('says clearly when no gateway is set up yet', async () => {
    const { d } = deps();
    const res = await handleSendSms(await signed(payload), { ...d, gatewayUrl: '' });
    expect(res.status).toBe(503);
  });
});
