// Served at pohnch.pk/.well-known/apple-app-site-association (see next.config.ts).
// Tells iPhones that pohnch.pk/i/... links belong to the Pohnch parent app.
// APPLE_TEAM_ID comes from the Apple Developer account (Membership page); it is not a secret.
export const dynamic = 'force-dynamic';

export function GET() {
  const team = process.env.APPLE_TEAM_ID ?? 'TEAMID';
  return Response.json(
    { applinks: { details: [{ appIDs: [`${team}.pk.pohnch.parent`], components: [{ '/': '/i/*', comment: 'Driver invite links' }] }] } },
    { headers: { 'cache-control': 'public, max-age=3600' } },
  );
}
