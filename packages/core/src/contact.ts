// The pilot's public WhatsApp contact (printed on the posters). Not a secret.
export const PILOT_WHATSAPP = { display: '0300 1478729', waNumber: '923001478729' } as const;

/** Store links. While both are null, every main button says "Join the pilot" (the form). Set playUrl
 *  to the Google Play (open testing) link and the website's buttons switch to "Get it on Google Play". */
export const STORE: { playUrl: string | null; appStoreUrl: string | null } = { playUrl: null, appStoreUrl: null };

/** The website's public "Join the pilot" endpoint (the `interest` Edge Function). Public by design: it
 *  holds the service key itself and accepts only the form. Used when the build has no Supabase URL. */
export const INTEREST_URL = 'https://vsyunieszswpreogzolx.supabase.co/functions/v1/interest';

/**
 * v21: joining from the one QR code (pohnch.pk/app). While the apps are in Google Play's closed test, a
 * person joins the testers' Google Group (one tap), becomes a tester, then installs from Play. Each one
 * counts toward the 12 testers Google asks for. When production is approved, set `public: true` and the
 * page sends people straight to the Play listing; the printed QR never changes.
 */
export const JOIN = {
  public: false,
  testersGroup: 'https://groups.google.com/g/pohnch-testers',
  apps: {
    parent: { pkg: 'pk.pohnch.parent' },
    driver: { pkg: 'pk.pohnch.driver' },
  },
  /** A last-resort direct download (an APK built by EAS), per app, once one exists. */
  apk: { parent: null as string | null, driver: null as string | null },
} as const;
export const playListing = (pkg: string) => `https://play.google.com/store/apps/details?id=${pkg}`;
export const playTesting = (pkg: string) => `https://play.google.com/apps/testing/${pkg}`;
/** The address the posters' QR code opens. */
export const JOIN_URL = 'https://pohnch.pk/app';
