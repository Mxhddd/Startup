// The pilot's public WhatsApp contact (printed on the posters). Not a secret.
export const PILOT_WHATSAPP = { display: '0300 1478729', waNumber: '923001478729' } as const;

/** Store links. While both are null, every main button says "Join the pilot" (the form). Set playUrl
 *  to the Google Play (open testing) link and the website's buttons switch to "Get it on Google Play". */
export const STORE: { playUrl: string | null; appStoreUrl: string | null } = { playUrl: null, appStoreUrl: null };
