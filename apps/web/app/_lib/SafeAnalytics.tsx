'use client';
// Vercel's page-view counter, with the private parts taken out (v20 security): invite links carry a secret
// token in their address, so /i/<token> is counted as /i/[token]; the team page and the invite page are never
// counted; addresses are sent without their ?query and #fragment.
import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';

export function scrub(event: BeforeSendEvent): BeforeSendEvent | null {
  let u: URL;
  try { u = new URL(event.url); } catch { return null; }
  if (/^\/(admin|invite)(\/|$)/.test(u.pathname)) return null;
  const path = u.pathname.replace(/^\/i\/[^/]+/, '/i/[token]');
  return { ...event, url: `${u.origin}${path}` };
}

export function SafeAnalytics() {
  return <Analytics beforeSend={scrub} />;
}
