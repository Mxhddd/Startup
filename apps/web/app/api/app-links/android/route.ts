// Served at pohnch.pk/.well-known/assetlinks.json (see next.config.ts).
// Tells Android that pohnch.pk/i/... links belong to the Pohnch parent app.
// ANDROID_CERT_SHA256: the app's signing fingerprint(s), comma-separated (`eas credentials` shows it).
export const dynamic = 'force-dynamic';

export function GET() {
  const fingerprints = (process.env.ANDROID_CERT_SHA256 ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return Response.json(
    [{ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: 'pk.pohnch.parent', sha256_cert_fingerprints: fingerprints } }],
    { headers: { 'cache-control': 'public, max-age=3600' } },
  );
}
