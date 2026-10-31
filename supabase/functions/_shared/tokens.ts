// Invite tokens: 32 random bytes, base64url. Only the SHA-256 hash is stored in the database.
// The token itself appears only inside a pohnch.pk/i/<token> link; it is never logged.

export function newInviteToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** The hash in the form Postgres reads as bytea. */
export function byteaHex(hex: string): string {
  return '\\x' + hex;
}

export function isInviteToken(s: unknown): s is string {
  return typeof s === 'string' && /^[A-Za-z0-9_-]{43}$/.test(s);
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
