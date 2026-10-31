// pohnch.pk/admin: the Pohnch team's page. The Supabase address and public (anon) key are read here,
// when the page is opened, and handed to the browser part. Everything it shows is guarded twice:
// the page checks you're on the team, and the database functions refuse anyone who isn't.
import type { Metadata } from 'next';
import { AdminApp } from './AdminApp';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Pohnch team', robots: { index: false, follow: false } };

export default function AdminPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return <AdminApp url={url} anonKey={anonKey} />;
}
