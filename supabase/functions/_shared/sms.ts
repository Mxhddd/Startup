// Login codes by SMS. Supabase Auth calls our "send-sms" hook with the phone number and the code;
// we check the call really came from Supabase (Standard Webhooks signature) and pass it to the gateway.
// Neither the phone number nor the code is ever logged.

/** The SMS text: Urdu, short enough for one Unicode SMS (70 characters). */
export function smsText(code: string): string {
  return `پہنچ: آپ کا کوڈ ${code} ہے۔ کسی کو نہ بتائیں۔`;
}

function b64decode(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function b64encode(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** HMAC-SHA256 signature as Standard Webhooks defines it: base64(hmac(secret, `${id}.${timestamp}.${body}`)). */
export async function webhookSignature(secret: string, id: string, timestamp: string, body: string): Promise<string> {
  const raw = secret.replace(/^v1,/, '').replace(/^whsec_/, '');
  const key = await crypto.subtle.importKey('raw', b64decode(raw), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${body}`));
  return b64encode(new Uint8Array(sig));
}

/** True when the request is signed with our secret and is less than 5 minutes old. */
export async function verifyWebhook(secret: string, headers: Headers, body: string, nowSec = Math.floor(Date.now() / 1000)): Promise<boolean> {
  const id = headers.get('webhook-id');
  const ts = headers.get('webhook-timestamp');
  const sigs = headers.get('webhook-signature');
  if (!id || !ts || !sigs || !/^\d+$/.test(ts)) return false;
  if (Math.abs(nowSec - Number(ts)) > 300) return false;
  const expected = await webhookSignature(secret, id, ts, body);
  return sigs.split(' ').some((s) => s.replace(/^v1,/, '') === expected);
}

export type SmsDeps = {
  secret: string;
  gatewayUrl: string;
  gatewayKey: string;
  fetch: typeof fetch;
  log: (line: string) => void;
};

/** The hook: verify, then send. Supabase shows a failed hook to the user as "could not send code". */
export async function handleSendSms(req: Request, deps: SmsDeps): Promise<Response> {
  const body = await req.text();
  if (!(await verifyWebhook(deps.secret, req.headers, body))) {
    deps.log('send-sms 401');
    return new Response(JSON.stringify({ error: 'bad_signature' }), { status: 401 });
  }
  let phone = '';
  let code = '';
  try {
    const p = JSON.parse(body) as { user?: { phone?: string }; sms?: { otp?: string } };
    phone = p.user?.phone ?? '';
    code = p.sms?.otp ?? '';
  } catch {
    // fall through
  }
  if (!phone || !/^\d{4,8}$/.test(code)) {
    deps.log('send-sms 400');
    return new Response(JSON.stringify({ error: 'bad_payload' }), { status: 400 });
  }
  if (!deps.gatewayUrl || !deps.gatewayKey) {
    deps.log('send-sms 503 no gateway set');
    return new Response(JSON.stringify({ error: 'sms_not_configured' }), { status: 503 });
  }
  // A plain JSON POST; each Pakistani gateway names its fields a little differently, so adapt here in B9.
  const res = await deps.fetch(deps.gatewayUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${deps.gatewayKey}` },
    body: JSON.stringify({ to: phone.startsWith('+') ? phone : `+${phone}`, message: smsText(code), unicode: true }),
  });
  deps.log(`send-sms ${res.ok ? 200 : 502}`);
  return res.ok ? new Response('{}', { status: 200 }) : new Response(JSON.stringify({ error: 'gateway_failed' }), { status: 502 });
}
