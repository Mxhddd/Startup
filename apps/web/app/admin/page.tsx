// pohnch.pk/admin: the Pohnch team's page. The Supabase address and public (anon / publishable) key are read
// here, when the page is opened, and handed to the browser part. Everything it shows is guarded twice: the page
// checks you're on the team (with a second step from an authenticator app), and the database functions refuse
// anyone who isn't. v20 security: if the key set on the server is not a public key (for example the service key
// pasted into the wrong setting by mistake), the page refuses to hand it to the browser at all.
import type { Metadata } from 'next';
import { AdminApp } from './AdminApp';
import { isPublicKey } from './publicKey';
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL, TURNSTILE_SITE_KEY } from '../_lib/publicConfig';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Pohnch team', robots: { index: false, follow: false } };

export default function AdminPage() {
  const anonKey = isPublicKey(SUPABASE_PUBLIC_KEY) ? SUPABASE_PUBLIC_KEY : '';
  return <AdminApp url={anonKey ? SUPABASE_URL : ''} anonKey={anonKey} turnstileKey={TURNSTILE_SITE_KEY} />;
}
