// Only a public Supabase key may ever reach a browser: a legacy JWT whose role is 'anon', or a new-style
// 'sb_publishable_' key. A service key (role 'service_role', or 'sb_secret_') is refused.
export function isPublicKey(key: string): boolean {
  if (!key) return false;
  if (key.startsWith('sb_publishable_')) return true;
  if (key.startsWith('sb_secret_')) return false;
  const part = key.split('.')[1];
  if (!part) return false;
  try {
    const json = JSON.parse(Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')) as { role?: string };
    return json.role === 'anon';
  } catch {
    return false;
  }
}
