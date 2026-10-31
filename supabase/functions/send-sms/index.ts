// Deno entry for the Send SMS hook. In the Supabase dashboard: Authentication > Hooks > Send SMS >
// HTTPS, pointing at this function; copy the hook secret into SEND_SMS_HOOK_SECRET.
// Secrets: SEND_SMS_HOOK_SECRET, SMS_GATEWAY_URL, SMS_GATEWAY_KEY.
import { handleSendSms } from '../_shared/sms.ts';

Deno.serve((req) =>
  handleSendSms(req, {
    secret: Deno.env.get('SEND_SMS_HOOK_SECRET') ?? '',
    gatewayUrl: Deno.env.get('SMS_GATEWAY_URL') ?? '',
    gatewayKey: Deno.env.get('SMS_GATEWAY_KEY') ?? '',
    fetch,
    log: (line) => console.log(line),
  }),
);
