// A driver's invite opened while logged out: the token waits here, in memory only (never in a URL,
// storage or a log), until login finishes and the join form can use it.
let pending: string | null = null;

export function rememberInvite(token: string) {
  pending = token;
}

export function takeInvite(): string | null {
  const t = pending;
  pending = null;
  return t;
}
