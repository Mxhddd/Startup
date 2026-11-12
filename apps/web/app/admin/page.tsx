// pohnch.pk/admin: the Pohnch team's page. The Supabase address and public (anon / publishable) key are read
// here, when the page is opened, and handed to the browser part. Everything it shows is guarded twice: the page
// checks you're on the team (with a second step from an authenticator app), and the database functions refuse
// anyone who isn't. v20 security: if the key set on the server is not a public key (for example the service key
// pasted into the wrong setting by mistake), the page refuses to hand it to the browser at all.
import type { Metadata } from 'next';
import { AdminApp } from './AdminApp';
import { isPublicKey } from './publicKey';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Pohnch team', robots: { index: false, follow: false } };

export default function AdminPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const raw = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const anonKey = isPublicKey(raw) ? raw : '';
  const turnstile = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';
  return <AdminApp url={anonKey ? url : ''} anonKey={anonKey} turnstileKey={turnstile} />;
}
